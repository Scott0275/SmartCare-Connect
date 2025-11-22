'use client';

import { useState, useRef } from 'react';
import { useFileUpload } from '../hooks/useFileUpload';

interface MedicalFileUploadProps {
  patientId: string;
  type: 'image' | 'document';
  category?: 'xray' | 'mri' | 'ct' | 'ultrasound' | 'photo' | 'document';
  documentType?: 'lab-result' | 'prescription' | 'report' | 'consent' | 'insurance';
  onUploadComplete?: (result: any) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export default function MedicalFileUpload({
  patientId,
  type,
  category,
  documentType,
  onUploadComplete,
  maxFileSize = 10,
  acceptedTypes = type === 'image' 
    ? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    : ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword']
}: MedicalFileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploads, uploadMedicalImage, uploadMedicalDocument } = useFileUpload();

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        continue;
      }

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        continue;
      }

      try {
        let result;
        if (type === 'image' && category) {
          result = await uploadMedicalImage(file, patientId, category);
        } else if (type === 'document' && documentType) {
          result = await uploadMedicalDocument(file, patientId, documentType);
        } else {
          throw new Error('Invalid upload configuration');
        }

        onUploadComplete?.(result);
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Failed to upload ${file.name}: ${error}`);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          accept={acceptedTypes.join(',')}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={onButtonClick}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Click to upload
            </button>
            <span> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500">
            {type === 'image' ? 'Images and PDFs' : 'Documents'} up to {maxFileSize}MB
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{upload.file.name}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                  upload.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {upload.status === 'completed' ? 'Complete' :
                   upload.status === 'error' ? 'Failed' :
                   `${upload.progress}%`}
                </span>
              </div>
              {upload.status === 'uploading' && (
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              {upload.error && (
                <p className="mt-1 text-xs text-red-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}