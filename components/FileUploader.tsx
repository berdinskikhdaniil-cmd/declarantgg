import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  label: string;
  description: string;
  fileData: UploadedFile;
  onFileSelect: (file: File) => void;
  icon: React.ReactNode;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  description,
  fileData,
  onFileSelect,
  icon,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    // Ideally accept docx, but we can relax for demo
    onFileSelect(file);
  };

  const getStatusColor = () => {
    switch (fileData.status) {
      case 'ready': return 'border-green-500 bg-green-50 text-green-700';
      case 'reading': return 'border-blue-300 bg-blue-50 text-blue-700';
      case 'error': return 'border-red-300 bg-red-50 text-red-700';
      default: return isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-white';
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer group ${getStatusColor()}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        className="hidden"
        accept=".docx,.doc,.txt"
      />
      
      <div className="flex flex-col items-center p-4 text-center">
        <div className={`mb-3 p-3 rounded-full ${fileData.status === 'ready' ? 'bg-green-100' : 'bg-slate-100 group-hover:bg-indigo-100'}`}>
          {fileData.status === 'ready' ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
             </svg>
          ) : (
            <div className="text-slate-500 group-hover:text-indigo-600">
              {icon}
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-sm mb-1">
          {fileData.file ? fileData.file.name : label}
        </h3>
        
        <p className="text-xs text-slate-500 max-w-[200px]">
          {fileData.status === 'ready' 
            ? 'File loaded successfully' 
            : fileData.status === 'reading' 
              ? 'Reading content...' 
              : description}
        </p>
      </div>
    </div>
  );
};