import { useState, useCallback } from 'react'
import { ImportProgress, ImportResult, ParsedCSVData, ColumnMapping, ColumnMapping } from '@/types/csv'

interface UseCSVImportReturn {
  step: number
  file: File | null
  parsedData: ParsedCSVData | null
  columnMappings: Record<string, string>
  setColumnMappings: (mappings: Record<string, string>) => void
  importProgress: ImportProgress
  importResult: ImportResult | null
  setStep: (step: number) => void
  handleFileUpload: (data: ParsedCSVData) => void
  handleImport: () => Promise<void>
  reset: () => void
}

export function useCSVImport(): UseCSVImportReturn {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    status: 'idle',
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
    processedRecords: 0,
    totalRecords: 0,
  })
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileUpload = useCallback((data: ParsedCSVData) => {
    setParsedData(data)
    setStep(2)
  }, [])

  const handleImport = useCallback(async () => {
    if (!parsedData || !file) return

    setImportProgress({
      status: 'processing',
      progress: 0,
      currentBatch: 0,
      totalBatches: Math.ceil(parsedData.rows.length / 100),
      processedRecords: 0,
      totalRecords: parsedData.rows.length,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(columnMappings))

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Import failed')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)
      setImportProgress(prev => ({ ...prev, status: 'complete', progress: 100 }))
      setStep(4)
    } catch (error) {
      setImportProgress(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Import failed',
      }))
    }
  }, [parsedData, file, columnMappings])

  const reset = useCallback(() => {
    setStep(1)
    setFile(null)
    setParsedData(null)
    setColumnMappings({})
    setImportProgress({
      status: 'idle',
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      processedRecords: 0,
      totalRecords: 0,
    })
    setImportResult(null)
  }, [])

  return {
    step,
    file,
    parsedData,
    columnMappings,
    setColumnMappings,
    importProgress,
    importResult,
    setStep,
    handleFileUpload,
    handleImport,
    reset,
  }
}