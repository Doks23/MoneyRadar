import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, CheckCircleIcon } from './Icons';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!disabled) {
      setUploadedFiles([]);
    }
  }, [disabled]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFiles(acceptedFiles);
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative w-full border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
        ${isDragActive 
          ? 'border-brand-500 bg-brand-50/80 scale-[1.01] shadow-lg shadow-brand-100' 
          : 'border-surface-200 bg-white hover:border-brand-400 hover:bg-surface-50/80 hover:shadow-card-hover'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input {...getInputProps()} />
      
      {uploadedFiles.length > 0 ? (
        <div className="flex flex-col items-center animate-slide-up">
          <div className="p-3 bg-positive-50 rounded-full mb-4 shadow-sm">
            <CheckCircleIcon className="w-10 h-10 text-positive-500" />
          </div>
          <p className="font-bold text-xl text-surface-800 mb-1">{uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''} Received</p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto mt-2">
            {uploadedFiles.map(f => (
                <span key={f.name} className="px-3 py-1 bg-surface-100 border border-surface-200 rounded-lg text-xs font-medium text-surface-600">{f.name}</span>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-surface-400">
            <div className="w-4 h-4 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
            <span className="font-medium">Processing through AI analysis engine...</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`p-4 rounded-2xl mb-5 transition-all duration-300 ${isDragActive ? 'bg-brand-100 scale-110' : 'bg-surface-100 group-hover:bg-brand-50 group-hover:scale-105'}`}>
            <UploadIcon className={`w-10 h-10 transition-colors duration-300 ${isDragActive ? 'text-brand-600' : 'text-surface-400 group-hover:text-brand-500'}`} />
          </div>
          {isDragActive ? (
            <p className="text-xl font-bold text-brand-700 animate-pulse">Release to start analysis</p>
          ) : (
            <>
              <p className="text-xl font-display font-bold text-surface-800 mb-2">Upload Bank Statements</p>
              <p className="text-sm text-surface-400 max-w-xs mx-auto mb-6 leading-relaxed">
                Drag & drop your files here or <span className="text-brand-600 font-semibold underline decoration-2 underline-offset-4 decoration-brand-300">browse files</span>
              </p>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                <span className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg">PDF</span>
                <span className="px-3 py-1.5 bg-negative-50 text-negative-600 rounded-lg">IMAGE</span>
                <span className="px-3 py-1.5 bg-positive-50 text-positive-600 rounded-lg">CSV</span>
                <span className="px-3 py-1.5 bg-surface-100 text-surface-600 rounded-lg">XLS</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
