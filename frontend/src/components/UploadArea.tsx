import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { parseCSV } from '@/utils/csvParser'
import { ParsedCSVData } from '@/types/csv'

interface UploadAreaProps {
  onFileUpload: (data: ParsedCSVData) => void
}

export function UploadArea({ onFileUpload }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) await processFile(file)
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
    e.target.value = ''
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setError(null)
    setIsParsing(true)

    try {
      const parsed = await parseCSV(file)
      onFileUpload(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV')
    } finally {
      setIsParsing(false)
    }
  }

  const triggerFileInput = () => fileInputRef.current?.click()

  return (
    <div className="upload-area-container">
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isParsing ? 'parsing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="file-input"
        />
        {isParsing ? (
          <div className="parsing-state">
            <div className="spinner"></div>
            <p>Parsing CSV...</p>
          </div>
        ) : (
          <>
            <svg className="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <h3>Upload CSV File</h3>
            <p>Drag and drop your CSV file here, or click to browse</p>
            <p className="file-hint">Maximum file size: 10MB • CSV format only</p>
          </>
        )}
      </div>

      {error && (
        <div className="error-message" role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}