import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { useCSVImport } from '@/hooks/useCSVImport'

interface ProcessButtonProps {
  data: any[]
  mappings: Record<string, string>
  mappingsComplete: boolean
}

export function ProcessButton({ data, mappings, mappingsComplete }: ProcessButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, stage: '' })
  const { processCSV } = useCSVImport()
  const { showToast } = useToast()

  const handleProcess = async () => {
    if (isProcessing || !mappingsComplete) return

    setIsProcessing(true)
    setProgress({ current: 0, total: data.length, stage: 'Preparing...' })

    try {
      const result = await processCSV(data, mappings, (update) => {
        setProgress(prev => ({ ...prev, ...update }))
      })
      showToast(`Successfully processed ${result.successful} of ${result.total} records`, 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Processing failed', 'error')
    } finally {
      setIsProcessing(false)
      setProgress({ current: 0, total: 0, stage: '' })
    }
  }

  const handlePreview = async () => {
    // Preview logic - process first 5 rows
    setIsProcessing(true)
    setProgress({ current: 0, total: 5, stage: 'Previewing...' })

    try {
      const previewData = data.slice(0, 5)
      const result = await processCSV(previewData, mappings)
      showToast(`Preview: ${result.successful} of ${result.total} records previewed`, 'info')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Preview failed', 'error')
    } finally {
      setIsProcessing(false)
      setProgress({ current: 0, total: 0, stage: '' })
    }
  }

  return (
    <div className="process-button-container">
      <div className="process-actions">
        <button
          className="btn btn-secondary"
          onClick={handlePreview}
          disabled={isProcessing || !mappingsComplete}
        >
          Preview (5 rows)
        </button>
        <button
          className="btn btn-primary"
          onClick={handleProcess}
          disabled={isProcessing || !mappingsComplete}
        >
          {isProcessing ? (
            <>
              <span className="spinner" />
              Processing...
            </>
          ) : (
            `Process ${data.length} Rows`
          )}
        </button>
      </div>

      {isProcessing && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="progress-info">
            <span>{progress.stage}</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
        </div>
      )}
    </div>
  )
}