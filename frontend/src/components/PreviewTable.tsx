import { useReactTable, getCoreRowModel, getSortedRowModel, createColumnHelper, flexRender, SortingState, ColumnDef } from '@tanstack/react-table'
import { ParsedCSVData, ColumnMapping } from '@/types/csv'

interface PreviewTableProps {
  data: ParsedCSVData
  mappings: Record<string, string>
}

const columnHelper = createColumnHelper<Record<string, string>>()

export function PreviewTable({ data, mappings }: PreviewTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)

  const mappedHeaders = data.headers.filter(h => mappings[h])
  const previewRows = data.rows.slice(0, 100)

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => [
    columnHelper.accessor('rowIndex', {
      header: '#',
      cell: info => <span className="row-index">{info.getValue()}</span>,
      size: 60,
    }),
    ...mappedHeaders.map(header =>
      columnHelper.accessor(header, {
        header: `${header} → ${mappings[header]}`,
        cell: info => <span className="cell-value">{info.getValue() || '—'}</span>,
        size: 200,
      })
    ),
  ], [mappedHeaders, mappings])

  const rowData = useMemo(() => previewRows.map((row, i) => ({
    rowIndex: i + 1,
    ...row,
  })), [previewRows])

  const filteredRows = useMemo(() => {
    if (!search) return rowData
    const lowerSearch = search.toLowerCase()
    return rowData.filter(row =>
      Object.values(row).some(val => String(val).toLowerCase().includes(lowerSearch))
    )
  }, [rowData, search])

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row, index) => String(index),
  })

  const totalPages = Math.ceil(filteredRows.length / pageSize)
  const currentPage = Math.floor((table.getState().pagination?.pageIndex ?? 0))

  return (
    <div className="preview-table">
      <div className="preview-header">
        <h2>Data Preview</h2>
        <div className="preview-stats">
          <span>{data.rows.length} total rows</span>
          <span>•</span>
          <span>{mappedHeaders.length} mapped columns</span>
          <span>•</span>
          <span>Showing {Math.min(pageSize, filteredRows.length)} rows</span>
        </div>
      </div>

      <div className="preview-controls">
        <input
          type="text"
          placeholder="Search rows..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="page-size-select"
        >
          <option value={10}>10 rows</option>
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table className="preview-table">
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={currentPage === 0}
          >
            First
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => table.setPageIndex(totalPages - 1)}
            disabled={currentPage === totalPages - 1}
          >
            Last
          </button>
        </div>
      )}
    </div>
  )
}