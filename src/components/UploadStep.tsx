import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/api/client';
import type { PreviewResponse } from '@/types/crm';

interface UploadStepProps {
  onPreviewComplete: (data: PreviewResponse) => void;
  onFileUpload: (file: File) => void;
}

export function UploadStep({ onPreviewComplete, onFileUpload }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    onFileUpload(file);

    try {
      const response = await api.previewCSV(file);
      onPreviewComplete(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload and parse the CSV file.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onPreviewComplete, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    multiple: false,
  });

  const handleFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-gray-600">Uploading and parsing file...</p>
          </div>
        ) : isDragActive ? (
          <p className="text-blue-500 font-semibold text-lg">Drop the CSV right here!</p>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600 text-lg">Drag & drop your CSV file here, or click to browse</p>
            <button
              type="button"
              onClick={handleFileSelect}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Browse Files
            </button>
          </div>
        )}
        <p className="mt-4 text-xs text-gray-500">Supports .csv files up to 50MB</p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Upload Failed</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}