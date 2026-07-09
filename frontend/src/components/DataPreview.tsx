import { useMemo, useState } from 'react'
import { DataPreviewRow, CRMRecord } from '@/types/csv'

interface DataPreviewProps {
  originalData: DataPreviewRow[]
  mappedData: CRMRecord[]
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function DataPreview({ originalData, mappedData, currentPage, pageSize, onPageChange }: DataPreviewProps) {
  const [viewMode, setViewMode] = useState<'original' | 'mapped'>('mapped')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const totalPages = useMemo(
    () => Math.ceil((viewMode === 'mapped' ? mappedData : originalData).length / pageSize),
    [mappedData.length, originalData.length, pageSize]
  )

  const currentData = useMemo(() => {
    const data = viewMode === 'mapped' ? mappedData : originalData
    const start = currentPage * pageSize
    return data.slice(start, start + pageSize)
  }, [viewMode, mappedData, originalData, currentPage, pageSize])

  const columns = useMemo(() => {
    if (viewMode === 'mapped' && currentData.length > 0) {
      return Object.keys(currentData[0] as Record<string, unknown>).map(key => ({
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      }))
    }
    if (viewMode === 'original' && currentData.length > 0) {
      return Object.keys(currentData[0] as Record<string, unknown>).map(key => ({
        accessorKey: key,
        header: key,
      }))
    }
    return []
  }, [currentData, viewMode])

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return currentData
    return [...currentData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortConfig.key]
      const bVal = (b as Record<string, unknown>)[sortConfig.key]
      if (aVal === bVal) return 0
      const comparison = aVal > bVal ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [currentData, sortConfig])

  return (
    <div className="data-preview">
      <div className="preview-toolbar">
        <div className="view-toggle">
          <button
            className={viewMode === 'original' ? 'active' : ''}
            onClick={() => setViewMode('original')}
          >
            Original CSV
          </button>
          <button
            className={viewMode === 'mapped' ? 'active' : ''}
            onClick={() => setViewMode('mapped')}
          >
            Mapped CRM Data
          </button>
        </div>
        <div className="preview-stats">
          <span>{viewMode === 'mapped' ? mappedData.length : originalData.length} records</span>
          <span>Page {currentPage + 1} / {totalPages}</span>
        </div>
      </div>

      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.accessorKey}
                  onClick={() => handleSort(col.accessorKey)}
                  className={sortConfig?.key === col.accessorKey ? `sorted ${sortConfig.direction}` : ''}
                >
                  {col.header}
                  {sortConfig?.key === col.accessorKey && (
                    <span className="sort-icon">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map(col => (
                  <td key={col.accessorKey}>
                    <pre className="cell-content">
                      {String((row as Record<string, unknown>)[col.accessorKey] ?? '')}
                    </pre>
                  </td>
                ))}
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  No data to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            aria-label="First page"
          >
            ««
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Previous page"
          >
            «
          </button>
          <span className="page-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Next page"
          >
            »
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            aria-label="Last page"
          >
            »»
          </button>
        </div>
      )}
    </div>
  )
}