import { parse } from 'csv-parse/sync'
import { ParsedCSVData } from '@/types/csv'

export async function parseCSV(file: File): Promise<ParsedCSVData> {
  const text = await file.text()

  let delimiter = ','
  const firstLine = text.split('\n')[0]
  if (firstLine.includes(';')) delimiter = ';'
  else if (firstLine.includes('\t')) delimiter = '\t'
  else if (firstLine.includes('|')) delimiter = '|'

  try {
    const records = parse(text, {
      delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    }) as string[][]

    if (records.length === 0) {
      throw new Error('CSV file is empty')
    }

    const headers = records[0].map(h => h.trim())
    const rows = records.slice(1)

    return {
      headers,
      rows,
      totalRows: rows.length,
      delimiter,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse CSV: ${error.message}`)
    }
    throw new Error('Failed to parse CSV file')
  }
}

export function detectEncoding(text: string): string {
  if (text.includes('�')) return 'possibly corrupted'
  return 'utf-8'
}

export function validateCSVStructure(data: ParsedCSVData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (data.headers.length === 0) {
    errors.push('No headers found in CSV')
  }

  if (data.rows.length === 0) {
    errors.push('No data rows found in CSV')
  }

  const headerSet = new Set(data.headers)
  if (headerSet.size !== data.headers.length) {
    errors.push('Duplicate column headers found')
  }

  const rowLengths = data.rows.map(r => r.length)
  const expectedLength = data.headers.length
  const inconsistentRows = rowLengths.filter(l => l !== expectedLength).length
  if (inconsistentRows > 0) {
    errors.push(`${inconsistentRows} rows have inconsistent column counts`)
  }

  if (data.totalRows > 50000) {
    errors.push('CSV exceeds maximum of 50,000 rows')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}