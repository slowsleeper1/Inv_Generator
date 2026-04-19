import { ChangeEvent } from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LogoUpload() {
  const { invoice, updateBusiness } = useInvoiceStore();
  const { logo } = invoice.business;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBusiness({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    updateBusiness({ logo: undefined });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Business Logo
      </label>
      <div className="flex items-center gap-4">
        {logo ? (
          <div className="relative group">
            <img 
              src={logo} 
              alt="Logo Preview" 
              className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white"
            />
            <button
              onClick={removeLogo}
              className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className={cn(
            "flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer",
            "border-gray-300 dark:border-gray-700 hover:border-blue-500 transition-colors",
            "bg-gray-50 dark:bg-gray-800/50"
          )}>
            <Upload className="w-6 h-6 text-gray-400" />
            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
          </label>
        )}
        <div className="flex-1 text-xs text-gray-500">
          <p>PNG, JPG or SVG.</p>
          <p>Recommended: 400x400px</p>
        </div>
      </div>
    </div>
  );
}
