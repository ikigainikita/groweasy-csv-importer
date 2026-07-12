import { useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { StepIndicator } from './StepIndicator';
import { UploadStep } from './UploadStep';
import { PreviewStep } from './PreviewStep';
import { ConfirmStep } from './ConfirmStep';
import { ExtractionProgress } from './ExtractionProgress';
import { ResultsStep } from './ResultsStep';
import { useImportFlow } from '@/hooks/useImportFlow';

export function ImportWizard() {
  const { state, actions } = useImportFlow();

  const handlePreviewComplete = useCallback((data: any) => {
    actions.setPreviewData(data);
    // Note: file is stored when dropped in UploadStep
  }, [actions]);

  const handleFileUpload = useCallback((file: File) => {
    actions.setFile(file);
  }, [actions]);

  const handleConfirm = useCallback(() => {
    actions.goToConfirm();
  }, [actions]);

  const handleBackToPreview = useCallback(() => {
    actions.goToPreview();
  }, [actions]);

  const handleStartExtraction = useCallback(async () => {
    await actions.startExtraction();
  }, [actions]);

  const handleExtractionComplete = useCallback((results: any) => {
    toast.success(`Successfully extracted ${results.stats.totalExtracted} of ${results.stats.totalInput} leads`);
  }, []);

  const handleExtractionError = useCallback((error: string) => {
    toast.error(error);
    actions.setError(error);
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.reset();
    toast.success('Ready for new file');
  }, [actions]);

  const renderStep = () => {
    switch (state.step) {
      case 'upload':
        return <UploadStep onPreviewComplete={handlePreviewComplete} onFileUpload={handleFileUpload} />;
      case 'preview':
        return state.previewData ? (
          <PreviewStep
            data={state.previewData}
            onConfirm={handleConfirm}
            onBack={actions.goToPreview}
          />
        ) : null;
      case 'confirm':
        return state.previewData ? (
          <ConfirmStep
            totalRows={state.previewData.totalRows}
            onConfirm={handleStartExtraction}
            onBack={handleBackToPreview}
            isLoading={state.isLoading}
          />
        ) : null;
      case 'extracting':
        return state.jobId ? (
          <ExtractionProgress
            jobId={state.jobId}
            onComplete={handleExtractionComplete}
            onError={handleExtractionError}
          />
        ) : null;
      case 'results':
        return state.results ? (
          <ResultsStep results={state.results} onReset={handleReset} />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">GrowEasy CSV Importer</h1>
          <p className="text-gray-600">Upload a CSV file and let AI extract CRM leads automatically</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <StepIndicator currentStep={state.step} />
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 text-sm">{state.error}</p>
            </div>
            <button
              onClick={() => actions.setError(null)}
              className="text-red-500 hover:text-red-700 flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[400px]">
          {renderStep()}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          GrowEasy AI-Powered CSV Importer — Powered by LLM extraction
        </p>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}