import { useInvoiceStore } from '../store/useInvoiceStore';
import { useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { DollarSign, Users, Calendar, TrendingUp, AlertCircle, Home, PieChart as PieIcon, ArrowUpRight, Download, Printer } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { stats, fetchStats } = useInvoiceStore();

  const handleDownloadCSV = () => {
    const summary = stats.summary;
    const monthly = stats.monthlyRevenue;
    
    let csv = "Metric,Value\n";
    csv += `Collected Revenue,$${summary.totalRevenue}\n`;
    csv += `Outstanding,$${summary.unpaidInvoices}\n`;
    csv += `Total Guests,${summary.guestCount}\n`;
    csv += `Active Stays,${summary.activeReservations}\n`;
    csv += `Cancelled Bookings,${summary.cancelledCount}\n`;
    csv += `Lost Revenue (Cancelled),$${summary.cancelledAmount}\n\n`;
    
    csv += "Monthly Breakdown\nMonth,Invoices,Revenue\n";
    monthly.forEach(row => {
      csv += `${row.month},${row.invoice_count},$${row.revenue}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_stats_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = [...(stats?.monthlyRevenue || [])].reverse().map(item => ({
    name: item.month,
    revenue: item.revenue
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">Performance</h1>
          <p className="text-sm text-gray-500 font-medium">Detailed breakdown of your rental business</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
          <Calendar size={14} />
          Last 12 Months
        </div>
      </header>

      {/* Main Metrics Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          label="Collected Revenue" 
          value={`$${(stats?.summary?.totalRevenue || 0).toLocaleString()}`} 
          icon={<DollarSign className="text-green-500" />}
          sub="Total cash in hand"
          color="green"
        />
        <MetricCard 
          label="Outstanding" 
          value={`$${(stats?.summary?.unpaidInvoices || 0).toLocaleString()}`} 
          icon={<AlertCircle className="text-amber-500" />}
          sub="Awaiting payment"
          color="amber"
        />
        <MetricCard 
          label="Total Guests" 
          value={stats?.summary?.guestCount || 0} 
          icon={<Users className="text-blue-500" />}
          sub="Registered profiles"
          color="blue"
        />
        <MetricCard 
          label="Active Stays" 
          value={stats?.summary?.activeReservations || 0} 
          icon={<Calendar className="text-purple-500" />}
          sub="Currently confirmed"
          color="purple"
        />
        <MetricCard 
          label="Cancelled Bookings" 
          value={stats?.summary?.cancelledCount || 0} 
          icon={<Calendar className="text-red-500" />}
          sub="Withdrawn reservations"
          color="red"
        />
        <MetricCard 
          label="Lost Revenue" 
          value={`$${(stats?.summary?.cancelledAmount || 0).toLocaleString()}`} 
          icon={<TrendingUp className="text-red-500 rotate-180" />}
          sub="Cancelled potential"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-[#1a1a1a] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Revenue Over Time</h3>
              <p className="text-xs text-gray-400 font-medium">Monthly cash flow trends</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">Paid Invoices</span>
              </div>
            </div>
          </div>

          <div className="h-[340px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#9ca3af'}}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ 
                      backgroundColor: '#111', 
                      border: 'none', 
                      borderRadius: '16px',
                      padding: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#9ca3af', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}
                    itemStyle={{ color: '#3b82f6', fontSize: '14px', fontWeight: 900 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* Unit Breakdown */}
        <div className="p-8 bg-white dark:bg-[#1a1a1a] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Home size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">By Unit</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Revenue Distribution</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto w-full no-scrollbar space-y-5">
            {(stats?.unitRevenue || []).length > 0 ? (
              stats.unitRevenue.map((unit, i) => (
                <div key={i} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                      {unit.unit_name || 'Unassigned'}
                    </span>
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                      ${unit.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 group-hover:bg-blue-400" 
                      style={{ width: `${(unit.revenue / Math.max(...stats.unitRevenue.map(u => u.revenue)) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    <span>{unit.booking_count} Bookings</span>
                    <span>Potential: ${unit.potential_revenue?.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs italic text-center">
                No unit data available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Monthly Performance</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleDownloadCSV}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
            >
              <Download size={12} />
              Download CSV
            </button>
            <button 
              onClick={handlePrint}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={12} />
              Print Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/30 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="px-8 py-4">Month</th>
                <th className="px-8 py-4">Invoices</th>
                <th className="px-8 py-4">Growth</th>
                <th className="px-8 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(stats?.monthlyRevenue || []).map((row, i) => {
                const prevRow = stats.monthlyRevenue[i + 1];
                const growth = prevRow ? ((row.revenue - prevRow.revenue) / prevRow.revenue) * 100 : 0;
                
                return (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-gray-900 dark:text-gray-100">{row.month}</td>
                    <td className="px-8 py-4 text-xs font-medium text-gray-500">{row.invoice_count}</td>
                    <td className="px-8 py-4">
                      {growth !== 0 && (
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full",
                          growth > 0 ? "text-green-600 bg-green-50 animate-pulse" : "text-red-500 bg-red-50"
                        )}>
                          {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-sm font-black text-right text-gray-900 dark:text-gray-100">
                      ${row.revenue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, sub, trend, color }: any) {
  const colorMap: any = {
    green: "bg-green-50 dark:bg-green-900/10 text-green-600",
    amber: "bg-amber-50 dark:bg-amber-900/10 text-amber-600",
    blue: "bg-blue-50 dark:bg-blue-900/10 text-blue-600",
    purple: "bg-purple-50 dark:bg-purple-900/10 text-purple-600",
    red: "bg-red-50 dark:bg-red-900/10 text-red-600",
  };

  return (
    <div className="p-8 bg-white dark:bg-[#1a1a1a] rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", colorMap[color] || "bg-gray-50 text-gray-600")}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <ArrowUpRight size={10} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 block">
          {label}
        </span>
        <div className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-1">
          {value}
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-full">
        <PieIcon size={32} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-bold">No financial data yet</p>
        <p className="text-xs text-gray-400">Add payments to invoices to see revenue trends.</p>
      </div>
    </div>
  );
}
