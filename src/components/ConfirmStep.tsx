import { AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';

interface ConfirmStepProps {
  totalRows: number;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const features = [
  { icon: Sparkles, title: 'Smart Field Mapping', desc: 'AI automatically maps CSV columns to CRM fields' },
  { icon: Sparkles, title: 'Contact Extraction', desc: 'Emails, phones, names parsed intelligently' },
  { icon: Sparkles, title: 'CRM Status Classification', desc: 'Leads categorized: Good Lead, Bad Lead, Sale Done, etc.' },
  { icon: Sparkles, title: 'Data Enrichment', desc: 'Extra info consolidated into notes field' },
];

export function ConfirmStep({ totalRows, onConfirm, onBack, isLoading }: ConfirmStepProps) {
  return (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Confirm Import</h2>
        <p className="text-gray-600">Ready to process <span className="font-semibold text-blue-600">{totalRows.toLocaleString()}</span> rows</p>
      </div>

      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-4 text-left">
        <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">This will send data to AI for extraction</p>
          <p className="text-yellow-800 text-sm mt-1">The AI will automatically map columns and extract CRM fields from your CSV data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {features.map((feature, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <feature.icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{feature.title}</p>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Preview
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            'Confirm & Extract'
          )}
        </button>
      </div>
    </div>
  );
}