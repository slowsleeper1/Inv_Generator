import { useInvoiceStore } from '../store/useInvoiceStore';
import { User, Mail, Phone, MapPin, Trash2, Search, Edit2, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GuestList() {
  const { guests, fetchGuests, updateGuest, deleteGuest } = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const startEdit = (guest: any) => {
    setEditingId(guest.id);
    setEditData({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      address: guest.address || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: number) => {
    if (!editData.name) return;
    await updateGuest(id, editData);
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    console.log('Attempting to delete guest:', id);
    try {
      await deleteGuest(id);
      console.log('Guest deleted successfully:', id);
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Delete guest error:', err);
      alert('Failed to delete guest: ' + (err.message || 'Unknown error'));
      setConfirmDeleteId(null);
    }
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Header */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
          <Search size={14} />
        </div>
        <input 
          type="text"
          placeholder="Search guests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

      {/* Guest List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar pb-10">
        {filteredGuests.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <User size={32} className="mx-auto text-gray-200 dark:text-gray-800" />
            <p className="text-xs text-gray-400 font-medium tracking-tight">No guests found</p>
          </div>
        ) : (
          filteredGuests.map((guest) => (
            <div 
              key={guest.id} 
              className="p-4 bg-white dark:bg-[#222] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {editingId === guest.id ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={editData.name} 
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    placeholder="Guest Name *"
                    className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="email" 
                      value={editData.email} 
                      onChange={(e) => setEditData({...editData, email: e.target.value})}
                      placeholder="Email"
                      className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[11px] outline-none"
                    />
                    <input 
                      type="tel" 
                      value={editData.phone} 
                      onChange={(e) => setEditData({...editData, phone: e.target.value})}
                      placeholder="Phone"
                      className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[11px] outline-none"
                    />
                  </div>
                  <textarea 
                    value={editData.address} 
                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                    placeholder="Address"
                    rows={2}
                    className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[11px] outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdate(guest.id)}
                      className="flex-1 py-1.5 bg-blue-600 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      className="flex-1 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {guest.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                          {guest.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 tracking-tight">ID: #{guest.id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => startEdit(guest)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit Guest"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(guest.id)}
                        className="p-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-gray-400 hover:text-red-500 transition-all border border-gray-100 dark:border-gray-800 hover:border-red-100 dark:hover:border-red-900/30"
                        title="Delete Guest"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {confirmDeleteId === guest.id && (
                    <div className="top-0 left-0 right-0 bottom-0 absolute bg-red-600/95 dark:bg-red-900/95 z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-200">
                      <p className="text-white text-[11px] font-bold mb-3 leading-tight uppercase tracking-wider">
                        Delete profile & all tied bookings?<br/>
                        <span className="opacity-75 text-[9px]">This action cannot be undone.</span>
                      </p>
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => handleDelete(guest.id)}
                          className="flex-1 py-1.5 bg-white text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                        >
                          Confirm Delete
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 py-1.5 bg-red-800/50 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 mt-3">
                    {guest.email && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <Phone size={12} className="shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    {guest.address && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <MapPin size={12} className="shrink-0" />
                        <span className="line-clamp-1">{guest.address}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
