import { useState, useCallback } from 'react';
import { StorageService, StorageUploadResult } from '../lib/storageService';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  result?: StorageUploadResult;
  error?: string;
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback(async (
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> => {
    const uploadId = `${Date.now()}-${file.name}`;
    
    // Initialize upload progress
    setUploads(prev => new Map(prev).set(uploadId, {
      file,
      progress: 0,
      status: 'uploading',
    }));

    try {
      // Simulate progress for better UX (S3 doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploads(prev => {
          const current = prev.get(uploadId);
          if (current && current.progress < 90) {
            const newMap = new Map(prev);
            newMap.set(uploadId, {
              ...current,
              progress: Math.min(current.progress + 10, 90),
            });
            return newMap;
          }
          return prev;
        });
      }, 200);

      const result = await StorageService.uploadFile(file, path, metadata);
      
      clearInterval(progressInterval);
      
      // Complete upload
      setUploads(prev => new Map(prev).set(uploadId, {
        file,
        progress: 100,
        status: 'completed',
        result,
      }));

      return result;
    } catch (error) {
      setUploads(prev => new Map(prev).set(uploadId, {
        file,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
      throw error;
    }
  }, []);

  const uploadMedicalImage = useCallback(async (
    file: File,
    patientId: string,
    category: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'photo' | 'document'
  ): Promise<StorageUploadResult> => {
    return uploadFile(file, `patients/${patientId}/images/${category}`, {
      patientId,
      category,
      fileType: 'medical-image',
    });
  }, [uploadFile]);

  const uploadMedicalDocument = useCallback(async (
    file: File,
    patientId: string,
    documentType: 'lab-result' | 'prescription' | 'report' | 'consent' | 'insurance'
  ): Promise<StorageUploadResult> => {
    return uploadFile(file, `patients/${patientId}/documents/${documentType}`, {
      patientId,
      documentType,
      fileType: 'medical-document',
    });
  }, [uploadFile]);

  const clearUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(uploadId);
      return newMap;
    });
  }, []);

  const clearAllUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  return {
    uploads: Array.from(uploads.entries()).map(([id, upload]) => ({ id, ...upload })),
    uploadFile,
    uploadMedicalImage,
    uploadMedicalDocument,
    clearUpload,
    clearAllUploads,
  };
}