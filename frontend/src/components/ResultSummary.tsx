import { ProcessingResult } from '@/hooks/useCSVImport'

interface ResultSummaryProps {
  result: ProcessingResult | null
  onDownload?: (format: 'csv' | 'json') => void
  onReset?: () => void
}

export function ResultSummary({ result, onDownload, onReset }: ResultSummaryProps) {
  if (!result) return null

  const statusColors: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP: 'status-good-lead',
    DID_NOT_CONNECT: 'status-did-not-connect',
    BAD_LEAD: 'status-bad-lead',
    SALE_DONE: 'status-sale-done',
  }

  const statusLabels: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP: 'Good Lead - Follow Up',
    DID_NOT_CONNECT: 'Did Not Connect',
    BAD_LEAD: 'Bad Lead',
    SALE_DONE: 'Sale Done',
  }

  return (
    <div className="result-summary">
      <div className="result-header">
        <h2>Processing Complete</h2>
        <div className="result-stats">
          <div className="stat">
            <span className="stat-value success">{result.successful}</span>
            <span className="stat-label">Successful</span>
          </div>
          <div className="stat">
            <span className="stat-value warning">{result.warnings.length}</span>
            <span className="stat-label">Warnings</span>
          </div>
          <div className="stat">
            <span className="stat-value error">{result.errors.length}</span>
            <span className="stat-label">Errors</span>
          </div>
          <div className="stat">
            <span className="stat-value">{result.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {result.statusDistribution && Object.keys(result.statusDistribution).length > 0 && (
        <div className="status-distribution">
          <h3>CRM Status Distribution</h3>
          <div className="status-bars">
            {Object.entries(result.statusDistribution).map(([status, count]) => (
              <div key={status} className="status-bar">
                <div className="status-bar-header">
                  <span className={`status-label ${statusColors[status]}`}>
                    {statusLabels[status] || status}
                  </span>
                  <span className="status-count">{count}</span>
                </div>
                <div className="status-bar-visual">
                  <div
                    className={`status-bar-fill ${statusColors[status]}`}
                    style={{ width: `${(count / result.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="warnings-section">
          <h3>Warnings ({result.warnings.length})</h3>
          <ul className="warnings-list">
            {result.warnings.slice(0, 10).map((warning, index) => (
              <li key={index} className="warning-item">
                <span className="warning-row">Row {warning.row}</span>
                <span className="warning-message">{warning.message}</span>
              </li>
            ))}
            {result.warnings.length > 10 && (
              <li className="warning-item more">
                ... and {result.warnings.length - 10} more warnings
              </li>
            )}
          </ul>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="errors-section">
          <h3>Errors ({result.errors.length})</h3>
          <ul className="errors-list">
            {result.errors.slice(0, 10).map((error, index) => (
              <li key={index} className="error-item">
                <span className="error-row">Row {error.row}</span>
                <span className="error-message">{error.message}</span>
              </li>
            ))}
            {result.errors.length > 10 && (
              <li className="error-item more">
                ... and {result.errors.length - 10} more errors
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-secondary" onClick={() => onDownload?.('csv')}>
          Download CSV
        </button>
        <button className="btn btn-secondary" onClick={() => onDownload?.('json')}>
          Download JSON
        </button>
        <button className="btn btn-primary" onClick={onReset}>
          Process Another File
        </button>
      </div>
    </div>
  )
}