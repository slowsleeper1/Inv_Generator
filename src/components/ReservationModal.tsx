import { useState, useEffect } from 'react';
import React from 'react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { Calendar, Save, X, Info, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';
import GuestForm from './GuestForm';

interface ReservationModalProps {
  onClose: () => void;
  initialData?: any;
}

export default function ReservationModal({ onClose, initialData }: ReservationModalProps) {
  const { guests, fetchGuests, createReservation, createGuest, updateReservation } = useInvoiceStore();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    guest_id: initialData?.guest_id?.toString() || '',
    unit_name: initialData?.unit_name || '',
    check_in: initialData?.check_in || '',
    check_out: initialData?.check_out || '',
    nightly_rate: initialData?.nightly_rate || 150,
    cleaning_fee: initialData?.cleaning_fee || 75,
    service_fee: initialData?.service_fee || 45,
    tax_rate: initialData?.tax_rate || 12,
    discount: initialData?.discount || 0,
    status: initialData?.status || 'pending',
    payment_status: initialData?.payment_status || 'unpaid',
    guest_count: initialData?.guest_count || 1,
    notes: initialData?.notes || ''
  });

  const [newGuestData, setNewGuestData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let guestId = formData.guest_id;

      // If user is filling out a NEW guest form, create it first
      if (showGuestForm) {
        if (!newGuestData.name) {
          throw new Error('Please provide at least a name for the new guest.');
        }
        guestId = (await createGuest(newGuestData)).toString();
      }

      if (!guestId || !formData.check_in || !formData.check_out) {
        throw new Error('Please select a guest and provide dates.');
      }
      
      if (new Date(formData.check_out) <= new Date(formData.check_in)) {
        throw new Error('Check-out date must be after check-in date.');
      }

      const payload = {
        ...formData,
        guest_id: Number(guestId)
      };

      if (initialData?.id) {
        await updateReservation(initialData.id, payload);
      } else {
        await createReservation(payload);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculatePreview = () => {
    if (!formData.check_in || !formData.check_out) return 0;
    const nights = Math.max(1, Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 3600 * 24)));
    if (nights <= 0) return 0;
    
    const subtotal = (formData.nightly_rate * nights) + formData.cleaning_fee + formData.service_fee;
    const discountedSubtotal = Math.max(0, subtotal - formData.discount);
    const tax = (discountedSubtotal * formData.tax_rate) / 100;
    return discountedSubtotal + tax;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className={cn(
          "px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between transition-colors",
          success ? "bg-green-600" : "bg-blue-600"
        )}>
          <h2 className="text-white font-bold flex items-center gap-2">
            <Calendar size={18} />
            {initialData ? 'Edit Reservation' : 'New Reservation'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh] no-scrollbar">
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold rounded-xl border border-green-200 dark:border-green-900/50 flex items-center justify-center gap-2 animate-bounce">
              <Save size={18} />
              Booking Saved Successfully!
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-100 dark:border-red-900/50 flex items-center gap-2">
              <Info size={14} />
              {error}
            </div>
          )}

          {/* Guest Selection */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Guest Selection</label>
              <button 
                type="button" 
                onClick={() => setShowGuestForm(!showGuestForm)}
                className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
              >
                <UserPlus size={12} />
                {showGuestForm ? 'Choose Existing' : 'Create New Profile'}
              </button>
            </div>

            {showGuestForm ? (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <UserPlus size={14} />
                    New Guest Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <input 
                    type="text" 
                    placeholder="Guest Name *"
                    value={newGuestData.name}
                    onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    required={showGuestForm}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      value={newGuestData.email}
                      onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number"
                      value={newGuestData.phone}
                      onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <textarea 
                    placeholder="Home Address"
                    value={newGuestData.address}
                    onChange={(e) => setNewGuestData({ ...newGuestData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
                <div className="text-[10px] text-gray-400 italic">This profile will be saved automatically when you confirm the reservation.</div>
              </div>
            ) : (
              <select 
                value={formData.guest_id}
                onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              >
                <option value="">-- Select Guest --</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.email})</option>
                ))}
              </select>
            )}
          </section>

          {/* UNIT & GUESTS SELECTION */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Unit Number / Name</label>
              <input 
                type="text" 
                placeholder="e.g. Unit C14..."
                value={formData.unit_name}
                onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Guests</label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </section>

          {/* Dates */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Check-in</label>
                <input 
                  type="date" 
                  value={formData.check_in}
                  onChange={(e) => setFormData({ ...formData, check_in: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Check-out</label>
                <input 
                  type="date" 
                  value={formData.check_out}
                  onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Extend Feature */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">Extend Stay</span>
               <div className="flex flex-wrap gap-2">
                 {[1, 2, 3, 7, 14].map(n => (
                   <button
                     key={n}
                     type="button"
                     onClick={() => {
                       if (!formData.check_out) return;
                       const d = new Date(formData.check_out);
                       d.setDate(d.getDate() + n);
                       setFormData({ ...formData, check_out: d.toISOString().split('T')[0] });
                     }}
                     className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold hover:border-blue-500 hover:text-blue-500 transition-all"
                   >
                     +{n} Night{n > 1 ? 's' : ''}
                   </button>
                 ))}
               </div>
            </div>
          </div>

          {/* Rates & Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nightly Rate</label>
              <input 
                type="number" 
                value={formData.nightly_rate}
                onChange={(e) => setFormData({ ...formData, nightly_rate: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Cleaning Fee</label>
              <input 
                type="number" 
                value={formData.cleaning_fee}
                onChange={(e) => setFormData({ ...formData, cleaning_fee: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tax %</label>
              <input 
                type="number" 
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Service Fee</label>
              <input 
                type="number" 
                value={formData.service_fee}
                onChange={(e) => setFormData({ ...formData, service_fee: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Discount</label>
              <input 
                type="number" 
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-4">
            <section className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Booking Status</label>
              <div className="flex flex-wrap gap-2">
                {['pending', 'confirmed', 'cancelled'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      formData.status === s
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Payment Status</label>
              <div className="flex flex-wrap gap-2">
                {['unpaid', 'paid'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_status: s as any })}
                    className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                      formData.payment_status === s
                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/10"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Notes */}
          <section className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Internal Notes</label>
            <textarea 
              placeholder="e.g. Needs early check-in, allergic to peanuts..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </section>

          {/* Calculation Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Estimated Total</p>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                ${calculatePreview().toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Nights</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {formData.check_in && formData.check_out ? Math.max(0, Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 3600 * 24))) : 0}
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {initialData ? 'Update Reservation' : 'Save Reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
