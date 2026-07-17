import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/api/client';
import type {
  PreviewResponse,
  JobResultsResponse,
  CrmLead,
} from '@/types/crm';

type Step = 'upload' | 'preview' | 'confirm' | 'extracting' | 'results';

interface FlowState {
  step: Step;
  file: File | null;
  previewData: PreviewResponse | null;
  jobId: string | null;
  results: JobResultsResponse | null;
  error: string | null;
  isLoading: boolean;
  progress: {
    current: number;
    total: number;
    stage: string;
    percentage: number;
  };
}

interface FlowActions {
  setFile: (file: File) => void;
  setPreviewData: (data: PreviewResponse) => void;
  goToPreview: () => void;
  goToConfirm: () => void;
  startExtraction: () => Promise<void>;
  pollJob: (jobId: string) => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

const initialState: FlowState = {
  step: 'upload',
  file: null,
  previewData: null,
  jobId: null,
  results: null,
  error: null,
  isLoading: false,
  progress: {
    current: 0,
    total: 0,
    stage: '',
    percentage: 0,
  },
};

export function useImportFlow(): { state: FlowState; actions: FlowActions } {
  const [state, setState] = useState<FlowState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((partial: Partial<FlowState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setFile = useCallback((file: File) => {
    updateState({ file, step: 'upload' });
  }, [updateState]);

  const setPreviewData = useCallback((data: PreviewResponse) => {
    updateState({ step: 'preview', previewData: data, error: null });
  }, [updateState]);

  const goToPreview = useCallback(() => {
    updateState({ step: 'preview' });
  }, [updateState]);

  const goToConfirm = useCallback(() => {
    updateState({ step: 'confirm' });
  }, [updateState]);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
  }, [updateState]);

  const setLoading = useCallback((loading: boolean) => {
    updateState({ isLoading: loading });
  }, [updateState]);

  const startExtraction = useCallback(async () => {
    if (!state.file || !state.previewData) return;

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    updateState({
      step: 'extracting',
      progress: { current: 0, total: 0, stage: 'Starting extraction...', percentage: 0 },
    });

    try {
      const response = await api.extractCSV(state.file);

      if ('jobId' in response) {
        updateState({ jobId: response.jobId });
        await pollJob(response.jobId);
      } else {
        // ✅ FIXED SYNC RESPONSE:
        const safeResponse = response as any;
        
        // Grab the array from whichever key the backend uses
        const extractedData = safeResponse.leads || safeResponse.previewData || safeResponse.data || safeResponse.extractedRows || [];
        
        // Grab the count or fallback to the array length
        const totalCount = safeResponse.stats?.totalInput || safeResponse.totalRows || extractedData.length;

        const results: JobResultsResponse = {
          jobId: '',
          leads: extractedData,
          stats: safeResponse.stats || {
            totalInput: totalCount,
            totalExtracted: extractedData.length,
            filteredNoContact: 0
          },
        };
        
        updateState({ step: 'results', results, jobId: null });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      setError(message);
      updateState({ step: 'confirm' });
    } finally {
      setLoading(false);
    }
  }, [state.file, state.previewData, setLoading, setError, updateState]);
  const pollJob = useCallback(async (jobId: string) => {
    while (true) {
      if (abortControllerRef.current?.signal.aborted) break;

      try {
        const status = await api.getJobStatus(jobId);

        updateState({
          progress: {
            current: status.processedRecords,
            total: status.totalRecords,
            stage: `Processing... ${status.processedRecords}/${status.totalRecords}`,
            percentage: status.progress,
          },
        });

        if (status.status === 'completed' || status.status === 'failed') {
          if (status.status === 'completed') {
            const results = await api.getJobResults(jobId);
            updateState({ step: 'results', results, jobId: null });
          } else {
            setError(status.error || 'Extraction failed');
            updateState({ step: 'confirm', jobId: null });
          }
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check job status';
        setError(message);
        updateState({ step: 'confirm', jobId: null });
        break;
      }
    }
  }, [updateState, setError]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(initialState);
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const actions: FlowActions = {
    setFile,
    setPreviewData,
    goToPreview,
    goToConfirm,
    startExtraction,
    pollJob,
    reset,
    setError,
    setLoading,
  };

  return { state, actions };
}