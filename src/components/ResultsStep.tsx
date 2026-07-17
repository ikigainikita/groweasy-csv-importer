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
  type PaginationState,
} from '@tanstack/react-table';
import { Search, Download, RotateCcw, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import type { JobResultsResponse, CrmLead } from '@/types/crm';
import { CrmStatusBadge } from './CrmStatusBadge';
import { DataSourceBadge } from './DataSourceBadge';
import { formatDate, truncate, formatPhone } from '@/utils/format';
import { downloadCSV, downloadJSON } from '@/utils/download';

const columnHelper = createColumnHelper<CrmLead>();

const CRM_COLUMNS: { key: keyof CrmLead; header: string; width: number }[] = [
  { key: 'name', header: 'Name', width: 150 },
  { key: 'email', header: 'Email', width: 200 },
  { key: 'mobile_without_country_code', header: 'Phone', width: 150 },
  { key: 'crm_status', header: 'Status', width: 180 },
  { key: 'company', header: 'Company', width: 150 },
  { key: 'city', header: 'City', width: 120 },
  { key: 'state', header: 'State', width: 120 },
  { key: 'country', header: 'Country', width: 120 },
  { key: 'lead_owner', header: 'Owner', width: 150 },
  { key: 'data_source', header: 'Source', width: 150 },
  { key: 'created_at', header: 'Created', width: 120 },
  { key: 'possession_time', header: 'Possession', width: 120 },
  { key: 'description', header: 'Description', width: 200 },
  { key: 'crm_note', header: 'Notes', width: 250 },
];

export function ResultsStep({ results, onReset }: { results: JobResultsResponse; onReset: () => void }) {
  console.log("DEBUG RESULTS:", results);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [showNotes, setShowNotes] = useState<Record<number, boolean>>({});

  const columns = useMemo<ColumnDef<CrmLead>[]>(() => [
    ...CRM_COLUMNS.map((col) =>
      columnHelper.accessor(col.key, {
        header: col.header,
        cell: (info) => {
          const value = info.getValue();
          const row = info.row.original;

          switch (col.key) {
            case 'crm_status':
              return <CrmStatusBadge status={value as any} />;
            case 'data_source':
              return <DataSourceBadge source={value as any} />;
            case 'created_at':
              return <span className="font-mono text-xs">{formatDate(value as string | null)}</span>;
            case 'mobile_without_country_code':
              return <span className="font-mono text-xs">{formatPhone(row.country_code, value as string | null)}</span>;
            case 'crm_note':
              const note = value as string | null;
              const expanded = showNotes[info.row.index] || false;
              if (!note) return <span className="text-gray-400">—</span>;
              const display = expanded ? note : truncate(note, 80);
              return (
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-xs" title={expanded ? note : undefined}>{display}</span>
                  {note && note.length > 80 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotes((prev) => ({ ...prev, [info.row.index]: !expanded }));
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label={expanded ? 'Show less' : 'Show more'}
                    >
                      {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              );
            case 'possession_time':
              return <span className="text-sm">{value || '—'}</span>;
            case 'description':
              return <span className="truncate max-w-xs" title={value as string || undefined}>{value || '—'}</span>;
            default:
              return <span className="truncate max-w-xs" title={value as string || undefined}>{value || '—'}</span>;
          }
        },
        size: col.width,
      }) as ColumnDef<CrmLead>
    ),
  ], []);

  // ADD THIS: || [] to prevent the React Table crash
  // Look for leads, but fall back to previewData or data if the backend names it differently
  const rowData = useMemo(() => {
    // 1. Safety check: If results is null/undefined, return empty array
    if (!results) return [];
    
    // 2. If results is ALREADY the array itself
    if (Array.isArray(results)) return results;
    
    // 3. Tell TypeScript to temporarily ignore the strict type definitions
    const safeResults = results as any;
    
    // 4. Safely check all the common keys without TypeScript complaining
    return safeResults.leads || safeResults.previewData || safeResults.data || safeResults.extractedRows || [];
  }, [results]);

  const table = useReactTable({
    data: rowData,
    columns,
    state: { sorting, globalFilter: search, pagination: { pageIndex: 0, pageSize } },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    onPaginationChange: (updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex: 0, pageSize });
        setPageSize(newState.pageSize);
      } else {
        setPageSize(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();

  const handleDownloadCSV = () => downloadCSV(results.leads, 'crm-leads.csv');
  const handleDownloadJSON = () => downloadJSON(results.leads, 'crm-leads.json');

  // Calculate status distribution from leads
  // Calculate status distribution from leads safely
  const statusCounts = useMemo(() => {
    const dist: Record<string, number> = {};
    // Use the rowData we defined above!
    rowData.forEach((r: CrmLead) => {
      const status = r.crm_status || 'UNKNOWN';
      dist[status] = (dist[status] || 0) + 1;
    });
    return dist;
  }, [rowData]); // <-- Dependency changed to rowData
  // Calculate stats for display
  // Calculate stats for display safely using optional chaining and fallbacks
  // Check for stats.totalInput first, but fall back to totalRows
  // Tell TypeScript to ignore strict typing for the stats calculation
  const safeResults = results as any;

  // Now it won't complain when you ask for totalRows instead of stats
  const totalRecords = results.stats?.totalInput || safeResults.totalRows || rowData.length || 0;
  const successfulRecords = results.stats?.totalExtracted || rowData.length || 0;
  const skippedRecords = results.stats?.filteredNoContact || 0;
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Summary Cards - using backend stats format */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-3xl font-bold text-gray-900">{totalRecords.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">Successful</p>
          <p className="text-3xl font-bold text-green-600">{successfulRecords.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">Skipped (No Contact)</p>
          <p className="text-3xl font-bold text-red-600">{skippedRecords.toLocaleString()}</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CRM Status Distribution</h3>
        <div className="space-y-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-4">
              <CrmStatusBadge status={status as any} showLabel />
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    status === 'GOOD_LEAD_FOLLOW_UP' || status === 'SALE_DONE'
                      ? 'bg-green-500'
                      : status === 'DID_NOT_CONNECT'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${totalRecords > 0 ? (count / totalRecords) * 100 : 0}%` }}
                />
              </div>
              <span className="font-mono text-sm text-gray-600 w-16 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3 items-center justify-between">
          {/* Change results.leads.length to rowData.length so it doesn't crash if undefined */}
          <h3 className="text-lg font-semibold text-gray-900">Extracted Leads ({rowData.length})</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
              />
            </div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
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
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    No leads extracted
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {currentPage + 1} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!canPreviousPage}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!canNextPage}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button onClick={handleDownloadCSV} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="h-4 w-4" />
          Download CSV
        </button>
        <button onClick={handleDownloadJSON} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="h-4 w-4" />
          Download JSON
        </button>
        <button onClick={onReset} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <RotateCcw className="h-4 w-4" />
          Process Another File
        </button>
      </div>
    </div>
  );
}