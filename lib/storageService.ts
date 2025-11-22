import { storage } from './firebase';
import { S3StorageService, UploadResult } from './s3StorageService';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface StorageUploadResult {
  key: string;
  url: string;
  size: number;
  provider: 'firebase' | 's3';
}

export class StorageService {
  private static useAWS = process.env.NEXT_PUBLIC_USE_AWS === 'true';

  /**
   * Upload file using the configured storage provider
   */
  static async uploadFile(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> {
    if (this.useAWS) {
      const result = await S3StorageService.uploadFile(file, path, metadata);
      return { ...result, provider: 's3' };
    } else {
      return this.uploadToFirebase(file, path, metadata);
    }
  }

  /**
   * Upload medical image
   */
  static async uploadMedicalImage(
    file: File,
    patientId: string,
    category: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'photo' | 'document'
  ): Promise<StorageUploadResult> {
    if (this.useAWS) {
      const result = await S3StorageService.uploadMedicalImage(file, patientId, category);
      return { ...result, provider: 's3' };
    } else {
      const path = `patients/${patientId}/images/${category}/${Date.now()}-${file.name}`;
      return this.uploadToFirebase(file, path, { patientId, category });
    }
  }

  /**
   * Upload medical document
   */
  static async uploadMedicalDocument(
    file: File,
    patientId: string,
    documentType: 'lab-result' | 'prescription' | 'report' | 'consent' | 'insurance'
  ): Promise<StorageUploadResult> {
    if (this.useAWS) {
      const result = await S3StorageService.uploadMedicalDocument(file, patientId, documentType);
      return { ...result, provider: 's3' };
    } else {
      const path = `patients/${patientId}/documents/${documentType}/${Date.now()}-${file.name}`;
      return this.uploadToFirebase(file, path, { patientId, documentType });
    }
  }

  /**
   * Get secure download URL
   */
  static async getDownloadUrl(key: string, provider?: 'firebase' | 's3'): Promise<string> {
    const useProvider = provider || (this.useAWS ? 's3' : 'firebase');
    
    if (useProvider === 's3') {
      return S3StorageService.getSignedDownloadUrl(key);
    } else {
      if (!storage) throw new Error('Firebase storage not initialized');
      const storageRef = ref(storage, key);
      return await getDownloadURL(storageRef);
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(key: string, provider?: 'firebase' | 's3'): Promise<void> {
    const useProvider = provider || (this.useAWS ? 's3' : 'firebase');
    
    if (useProvider === 's3') {
      await S3StorageService.deleteFile(key);
    } else {
      if (!storage) throw new Error('Firebase storage not initialized');
      const storageRef = ref(storage, key);
      await deleteObject(storageRef);
    }
  }

  /**
   * Get public URL (for S3 via CloudFront)
   */
  static getPublicUrl(key: string, provider?: 'firebase' | 's3'): string {
    const useProvider = provider || (this.useAWS ? 's3' : 'firebase');
    
    if (useProvider === 's3') {
      return S3StorageService.getPublicUrl(key);
    } else {
      // Firebase URLs need to be generated dynamically
      throw new Error('Firebase public URLs must be generated via getDownloadUrl');
    }
  }

  /**
   * Private method for Firebase uploads
   */
  private static async uploadToFirebase(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> {
    if (!storage) throw new Error('Firebase storage not initialized');
    
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      customMetadata: metadata,
    });
    
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      key: path,
      url,
      size: file.size,
      provider: 'firebase',
    };
  }
}