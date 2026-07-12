import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type ColumnDef,
  type CellContext,
} from '@tanstack/react-table';
import { Search, ArrowLeft } from 'lucide-react';
import type { PreviewResponse } from '@/types/crm';

interface PreviewStepProps {
  data: PreviewResponse;
  onConfirm: () => void;
  onBack: () => void;
}

type RowData = Record<string, unknown>;

const columnHelper = createColumnHelper<RowData>();

export function PreviewStep({ data, onConfirm, onBack }: PreviewStepProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);

  const columns = useMemo<ColumnDef<RowData>[]>(() => {
    const cols: ColumnDef<RowData>[] = [
      columnHelper.accessor('rowIndex', {
        header: '#',
        cell: (info: CellContext<RowData, number>) => <span className="text-gray-500 font-mono">{info.getValue()}</span>,
        size: 60,
      }) as ColumnDef<RowData>,
      ...data.headers.map((header) =>
        columnHelper.accessor(header, {
          header: header,
          cell: (info: CellContext<RowData, unknown>) => <span className="truncate max-w-xs">{String(info.getValue() ?? '') || '—'}</span>,
          size: 200,
        }) as ColumnDef<RowData>
      ),
    ];
    return cols;
  }, [data.headers]);

  const rowData = useMemo(() =>
    data.previewData.map((row, i) => ({ rowIndex: i + 1, ...row })),
    [data.previewData]
  );

  const table = useReactTable({
    data: rowData,
    columns,
    state: { sorting, globalFilter: search, pagination: { pageIndex: 0, pageSize: 9999 } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Data Preview</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{data.totalRows} total rows</span>
          <span className="text-gray-300">•</span>
          <span>Showing {Math.min(pageSize, data.previewData.length)} rows (first {data.previewData.length})</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value={10}>10 rows</option>
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize(), minWidth: header.getSize() }}
                      className="px-3 py-2 text-left"
                    >
                      {header.isPlaceholder ? null : (flexRender(header.column.columnDef.header, header.getContext()) as React.ReactNode)}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                    No data to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </button>

        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Confirm & Extract
        </button>
      </div>
    </div>
  );
}