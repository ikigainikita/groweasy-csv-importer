import { UploadArea } from './UploadArea'
import { ColumnMapper } from './ColumnMapper'
import { PreviewTable } from './PreviewTable'
import { ImportProgress } from './ImportProgress'
import { useCSVImport } from '@/hooks/useCSVImport'

export function CSVImporter() {
  const {
    step,
    file,
    parsedData,
    columnMappings,
    setColumnMappings,
    importProgress,
    setStep,
    handleFileUpload,
    handleImport,
  } = useCSVImport()

  return (
    <div className="csv-importer">
      <div className="progress-steps">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Upload</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Map Columns</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Preview</span>
        </div>
        <div className="step-connector"></div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Import</span>
        </div>
      </div>

      <div className="step-content">
        {step === 1 && <UploadArea onFileUpload={handleFileUpload} />}
        {step === 2 && parsedData && <ColumnMapper data={parsedData} mappings={columnMappings} onMappingsChange={setColumnMappings} />}
        {step === 3 && parsedData && <PreviewTable data={parsedData} mappings={columnMappings} />}
        {step === 4 && <ImportProgress progress={importProgress} onStartImport={handleImport} />}
      </div>

      <div className="step-navigation">
        {step > 1 && (
          <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
            Previous
          </button>
        )}
        {step < 4 && step > 1 && parsedData && columnMappings && Object.keys(columnMappings).length > 0 && (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        )}
        {step === 1 && file && (
          <button className="btn btn-primary" onClick={() => setStep(2)}>
            Next: Map Columns
          </button>
        )}
      </div>
    </div>
  )
}