import { useState } from 'react';
import React from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { UserPlus, Save, X } from 'lucide-react';

interface GuestFormProps {
  onSuccess?: (id: number) => void;
  onCancel?: () => void;
}

export default function GuestForm({ onSuccess, onCancel }: GuestFormProps) {
  const { createGuest } = useInvoiceStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const id = await createGuest(formData);
    if (onSuccess) onSuccess(id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <UserPlus size={14} />
          New Guest Profile
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <input 
          type="text" 
          placeholder="Guest Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input 
            type="email" 
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          />
          <input 
            type="tel" 
            placeholder="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <textarea 
          placeholder="Home Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      <button 
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[13px] font-bold flex items-center justify-center gap-2 transition-colors"
      >
        <Save size={14} />
        Create Profile
      </button>
    </form>
  );
}
