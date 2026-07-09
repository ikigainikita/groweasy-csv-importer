import { useState, useMemo } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, createColumnHelper, flexRender, SortingState, ColumnDef } from '@tanstack/react-table'
import { ColumnMapping, CRM_FIELD_OPTIONS, ParsedCSVData } from '@/types/csv'

interface ColumnMapperProps {
  data: ParsedCSVData
  mappings: Record<string, string>
  onMappingsChange: (mappings: Record<string, string>) => void
}

const columnHelper = createColumnHelper<Record<string, string>>()

function ColumnHeader({ column }: { column: any }) {
  return (
    <button
      className="column-header-cell"
      onClick={column.getToggleSortingHandler()}
      style={{ cursor: column.getCanSort() ? 'pointer' : 'auto' }}
    >
      <span>{column.columnDef.header}</span>
      {column.getIsSorted() && (
        <span className={`sort-icon ${column.getIsSorted() === 'asc' ? 'asc' : 'desc'}`}>
          {column.getIsSorted() === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  )
}

export function ColumnMapper({ data, mappings, onMappingsChange }: ColumnMapperProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const csvColumns = data.headers
  const sampleRows = data.rows.slice(0, 10)

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => [
    columnHelper.accessor('csvColumn', {
      header: 'CSV Column',
      cell: info => <strong>{info.getValue()}</strong>,
      size: 200,
    }),
    columnHelper.accessor('sampleValues', {
      header: 'Sample Values (first 5 rows)',
      cell: info => (
        <div className="sample-values">
          {info.getValue().slice(0, 5).map((v, i) => (
            <span key={i} className="sample-value">{v || '—'}</span>
          ))}
        </div>
      ),
      size: 300,
    }),
    columnHelper.accessor('crmField', {
      header: 'CRM Field Mapping',
      cell: info => {
        const csvCol = info.row.original.csvColumn
        const currentMapping = mappings[csvCol]
        return (
          <select
            className="mapping-select"
            value={currentMapping || ''}
            onChange={e => {
              const newMappings = { ...mappings }
              if (e.target.value) {
                newMappings[csvCol] = e.target.value
              } else {
                delete newMappings[csvCol]
              }
              onMappingsChange(newMappings)
            }}
          >
            <option value="">— Select CRM Field —</option>
            {CRM_FIELD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label} {opt.required && '(required)'}
              </option>
            ))}
          </select>
        )
      },
      size: 250,
    }),
    columnHelper.accessor('inferredType', {
      header: 'Detected Type',
      cell: info => <span className={`type-badge ${info.getValue()}`}>{info.getValue()}</span>,
      size: 150,
    }),
  ], [mappings])

  const rowData = useMemo(() => csvColumns.map(col => ({
    csvColumn: col,
    sampleValues: sampleRows.map(row => row[col] || ''),
    crmField: mappings[col] || '',
    inferredType: inferType(sampleRows.map(row => row[col]).filter(Boolean)),
  })), [csvColumns, mappings, sampleRows])

  const table = useReactTable({
    data: rowData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const mappedCount = Object.keys(mappings).length
  const requiredFields = CRM_FIELD_OPTIONS.filter(f => f.required).map(f => f.value)
  const missingRequired = requiredFields.filter(f => !Object.values(mappings).includes(f))

  return (
    <div className="column-mapper">
      <div className="mapper-header">
        <h2>Map CSV Columns to CRM Fields</h2>
        <div className="mapping-progress">
          <span>{mappedCount} of {csvColumns.length} columns mapped</span>
          {missingRequired.length > 0 && (
            <span className="missing-warning">
              ⚠ Missing required: {missingRequired.join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="mapper-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Drag to reorder columns. Click headers to sort. Select CRM field for each CSV column.</span>
      </div>

      <div className="table-wrapper">
        <table className="mapper-table">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="auto-map-actions">
        <button className="btn btn-secondary" onClick={() => autoMapColumns(csvColumns, onMappingsChange)}>
          Auto-Map Columns
        </button>
        <button className="btn btn-secondary" onClick={() => onMappingsChange({})}>
          Clear All Mappings
        </button>
      </div>
    </div>
  )
}

function inferType(values: string[]): string {
  if (values.length === 0) return 'unknown'
  const sample = values[0]
  if (/^\d{4}-\d{2}-\d{2}/.test(sample)) return 'date'
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(sample)) return 'email'
  if (/^\+?\d{10,}$/.test(sample.replace(/\D/g, ''))) return 'phone'
  if (!isNaN(Number(sample))) return 'number'
  return 'text'
}

function autoMapColumns(csvColumns: string[], onMappingsChange: (m: Record<string, string>) => void) {
  const mappings: Record<string, string> = {}
  const usedFields = new Set<string>()

  csvColumns.forEach(col => {
    const lower = col.toLowerCase()
    let matched = false

    const fieldPatterns: Record<string, string[]> = {
      email: ['email', 'e-mail', 'mail'],
      mobile_without_country_code: ['phone', 'mobile', 'cell', 'telephone', 'contact'],
      country_code: ['country code', 'country_code', 'cc'],
      name: ['name', 'full name', 'fullname', 'lead name', 'customer name'],
      company: ['company', 'organization', 'org', 'firm'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      country: ['country', 'nation'],
      lead_owner: ['owner', 'assigned to', 'sales rep', 'representative'],
      crm_status: ['status', 'lead status', 'crm status', 'stage'],
      crm_note: ['note', 'notes', 'remark', 'remarks', 'comment', 'comments'],
      data_source: ['source', 'data source', 'origin', 'lead source'],
      possession_time: ['possession', 'possession time', 'handover'],
      description: ['description', 'desc', 'details'],
      created_at: ['created', 'created at', 'date', 'lead date', 'entry date'],
    }

    for (const [field, patterns] of Object.entries(fieldPatterns)) {
      if (matched) break
      for (const pattern of patterns) {
        if (lower.includes(pattern) && !usedFields.has(field)) {
          mappings[col] = field
          usedFields.add(field)
          matched = true
          break
        }
      }
    }
  })

  onMappingsChange(mappings)
}

const statusLabels: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Good Lead - Follow Up',
  DID_NOT_CONNECT: 'Did Not Connect',
  BAD_LEAD: 'Bad Lead',
  SALE_DONE: 'Sale Done',
}

const statusColors: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'success',
  DID_NOT_CONNECT: 'warning',
  BAD_LEAD: 'danger',
  SALE_DONE: 'success',
}