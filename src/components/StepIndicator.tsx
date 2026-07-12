interface StepIndicatorProps {
  currentStep: 'upload' | 'preview' | 'confirm' | 'extracting' | 'results';
  className?: string;
}

const steps = [
  { id: 'upload', label: 'Upload' },
  { id: 'preview', label: 'Preview' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'results', label: 'Results' },
];

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  // For extracting step, show progress on the Confirm step
  const displayIndex = currentStep === 'extracting' ? 2 : currentIndex;

  return (
    <div className={`flex items-center w-full ${className || ''}`} role="progressbar" aria-valuenow={displayIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      {steps.map((step, index) => {
        const isCompleted = index < displayIndex;
        const isCurrent = index === displayIndex;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center flex-1">
              <div className="flex items-center">
                {/* Step circle */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              {/* Step label */}
              <span
                className={`text-xs font-medium whitespace-nowrap ${isCurrent || isCompleted ? 'text-gray-700' : 'text-gray-400'}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}