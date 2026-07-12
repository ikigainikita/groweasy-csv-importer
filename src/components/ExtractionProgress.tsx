import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { JobStatusResponse, JobResultsResponse } from '@/types/crm';

interface ExtractionProgressProps {
  jobId: string;
  onComplete: (results: JobResultsResponse) => void;
  onError: (error: string) => void;
}

export function ExtractionProgress({ jobId, onComplete, onError }: ExtractionProgressProps) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const response = await api.getJobStatus(jobId);
        if (cancelled) return;

        setStatus(response);

        if (response.status === 'completed') {
          try {
            const results = await api.getJobResults(jobId);
            if (!cancelled) onComplete(results);
          } catch (err) {
            if (!cancelled) onError(err instanceof Error ? err.message : 'Failed to fetch results');
          }
        } else if (response.status === 'failed') {
          if (!cancelled) onError(response.error || 'Extraction failed');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to check job status');
          onError(err instanceof Error ? err.message : 'Failed to check job status');
        }
      }
    };

    poll();
    intervalId = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [jobId, onComplete, onError]);

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto text-center space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Extraction Failed</h2>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  const progress = status?.progress || 0;
  const totalBatches = Math.ceil((status?.totalRecords || 0) / 50); // default batch size
  const currentBatch = Math.min(totalBatches, Math.ceil((status?.processedRecords || 0) / 50));
  const stage = status?.status === 'completed' ? 'Completed!' : `Processing batch ${currentBatch} of ${totalBatches}...`;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
          {status?.status === 'completed' ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {status?.status === 'completed' ? 'Extraction Complete' : 'Extracting Leads...'}
        </h2>
        <p className="text-gray-600">{stage}</p>
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{status ? `Processed: ${status.processedRecords} / ${status.totalRecords}` : 'Starting...'}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {status && (
        <div className="text-center text-sm text-gray-500">
          <p>Batch {currentBatch} of {totalBatches}</p>
          <p>Records processed: {status.processedRecords} / {status.totalRecords}</p>
        </div>
      )}
    </div>
  );
}