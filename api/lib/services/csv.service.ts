// backend/src/services/csv.service.ts

import { parse } from 'csv-parse/sync';
import type { RawCsvRecord, CsvPreviewResponse, CsvValidationResult } from '../types';

export interface ParseOptions {
  delimiter?: string;
  quote?: string;
  escape?: string;
  skipEmptyLines?: boolean;
  relaxQuotes?: boolean;
  relaxColumnCount?: boolean;
}

const DEFAULT_OPTIONS: Required<ParseOptions> = {
  delimiter: ',',
  quote: '"',
  escape: '"',
  skipEmptyLines: true,
  relaxQuotes: true,
  relaxColumnCount: true,
};

export interface CsvServiceInterface {
  parseCsv(buffer: Buffer, options?: ParseOptions): RawCsvRecord[];
  getPreview(records: RawCsvRecord[], limit?: number): CsvPreviewResponse;
  validateCsv(records: RawCsvRecord[]): CsvValidationResult;
}

export class CsvService implements CsvServiceInterface {
  parseCsv(buffer: Buffer, options: ParseOptions = {}): RawCsvRecord[] {
    const content = buffer.toString('utf-8');

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: mergedOptions.skipEmptyLines,
        relax_quotes: mergedOptions.relaxQuotes,
        relax_column_count: mergedOptions.relaxColumnCount,
        delimiter: mergedOptions.delimiter,
        quote: mergedOptions.quote,
        escape: mergedOptions.escape,
        trim: true,
      }) as RawCsvRecord[];

      return records;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown CSV parsing error';
      throw new CsvParseError(`Failed to parse CSV: ${message}`);
    }
  }

  getPreview(records: RawCsvRecord[], limit = 5): CsvPreviewResponse {
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    const previewData = records.slice(0, limit);

    return {
      headers,
      previewData,
      totalRows: records.length,
    };
  }

  validateCsv(records: RawCsvRecord[]): CsvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (records.length === 0) {
      errors.push('CSV file is empty or contains no data rows');
      return { valid: false, errors, warnings, headers: [], rowCount: 0 };
    }

    const headers = Object.keys(records[0]);

    if (headers.length === 0) {
      errors.push('CSV has no columns');
    }

    // Check for duplicate headers (case-insensitive)
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    const duplicates = lowerHeaders.filter((h, i) => lowerHeaders.indexOf(h) !== i);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate column names detected: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Check for empty rows
    const emptyRows = records.filter((r) => Object.values(r).every((v) => !v || v.trim() === '')).length;
    if (emptyRows > 0) {
      warnings.push(`${emptyRows} completely empty row(s) found and will be skipped`);
    }

    // Check for rows with all same values (potential header row duplication)
    const firstRowValues = Object.values(records[0]);
    const headerDuplicateRows = records.slice(1).filter((r) => {
      const vals = Object.values(r);
      return vals.every((v, i) => v === firstRowValues[i]);
    }).length;
    if (headerDuplicateRows > 0) {
      warnings.push(`${headerDuplicateRows} row(s) appear to duplicate the header row`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      headers,
      rowCount: records.length,
    };
  }
}

export function detectDelimiter(content: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = content.split('\n')[0];

  let maxCount = 0;
  let detected = ',';

  for (const delim of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detected = delim;
    }
  }

  return detected;
}

export class CsvParseError extends Error {
  public readonly cause?: Error;

  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'CsvParseError';
    this.cause = options?.cause;
  }
}

export const csvService = new CsvService();