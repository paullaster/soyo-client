import axios from 'axios';
import {
  AlertTriangle, Building, CheckCircle, Clock, DollarSign, Search, TrendingUp,
  BarChart as BarChartIcon, Activity, Users, FileText, Share2, MapPin, Phone, Globe, ShieldAlert,
  Layers, ChevronRight, LayoutDashboard, Target, Info, ArrowRight, BadgeCheck, Timer, Briefcase, Zap,
  History, Scale, FileSearch, ShieldCheck, Sparkles, CreditCard, ListChecks, Fingerprint, ClipboardList,
  ArrowDownCircle, UserCheck, BarChart3, Landmark, ShieldX, X, Check, SearchIcon, Calendar, ArrowDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// --- Professional Data Schema ---
interface PastContract {
  project_name: string; start_date: string; planned_end: string; actual_end: string; status: string; delay_days: number;
}
interface Tender { 
  id: string; title: string; category: string; budget_kes: number; deadline_days: number; anticipated_closure_date: string;
}
interface Supplier { 
  id: string; name: string; registration_number: string; credit_score: number; company_size: string; employee_count: number; age_days: number; past_contracts: PastContract[];
}
interface AnalysisResult { 
  tender_id: string; supplier_id: string; supplier_name: string; risk_level: string; risk_score_probability: number; predicted_delay_days: number; timestamp: string; 
}
interface RiskAuditResponse extends AnalysisResult { 
  risk_factors: string[]; 
}

// --- Searchable Autocomplete (Non-Overlapping) ---
function SearchSelector({ options, value, onChange, placeholder, label, icon: Icon }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filtered = options.filter((opt: any) => (opt.title || opt.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  const selected = options.find((opt: any) => opt.id === value);

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 rounded-xl px-5 py-4 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-600 ring-4 ring-blue-50' : 'border-slate-200'}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <Icon className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 truncate">{selected ? (selected.title || selected.name) : placeholder}</span>
        </div>
        <ArrowDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute z-[200] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <input autoFocus placeholder="Type to search..." className="w-full bg-transparent outline-none text-sm font-bold text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`p-4 text-sm font-bold cursor-pointer hover:bg-blue-50 flex items-center justify-between ${value === opt.id ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}>
                <span className="truncate">{opt.title || opt.name}</span>
                {value === opt.id && <Check className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'comparison'>('audit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [comparisonResults, setComparisonResults] = useState<AnalysisResult[]>([]);
  const [riskResult, setRiskResult] = useState<RiskAuditResponse | null>(null);

  const apiBaseURL = "http://localhost:8000";

  useEffect(() => {
    const init = async () => {
      try {
        const [tRes, sRes] = await Promise.all([
          axios.get<Tender[]>(`${apiBaseURL}/tenders`),
          axios.get<Supplier[]>(`${apiBaseURL}/suppliers`)
        ]);
        setTenders(tRes.data);
        setSuppliers(sRes.data);
        if (tRes.data.length) setSelectedTenderId(tRes.data[0].id);
        if (sRes.data.length) setSelectedSupplierId(sRes.data[0].id);
      } catch (err) { setError('Audit server unreachable.'); }
    };
    void init();
  }, []);

  useEffect(() => { if (selectedTenderId) void fetchComparison(); }, [selectedTenderId]);
  useEffect(() => { setRiskResult(null); }, [selectedSupplierId, selectedTenderId]);

  const fetchComparison = async () => {
    try {
      const res = await axios.get<AnalysisResult[]>(`${apiBaseURL}/analysis-comparison/${selectedTenderId}`);
      setComparisonResults(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRunAudit = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post<RiskAuditResponse>(`${apiBaseURL}/predict`, { tender_id: selectedTenderId, supplier_id: selectedSupplierId });
      setRiskResult(res.data);
      await fetchComparison();
    } catch (err) { setError('Audit failed.'); }
    finally { setLoading(false); }
  };

  const activeTender = tenders.find(t => t.id === selectedTenderId);
  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] font-sans pb-20">
      
      {/* --- TOP BRANDING --- */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg shadow-md"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase italic">Soyo Audit Tool</h1>
        </div>
        <div className="flex gap-8">
           <button onClick={() => setActiveTab('audit')} className={`text-xs font-black uppercase tracking-widest ${activeTab === 'audit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>1. Check a Supplier</button>
           <button onClick={() => setActiveTab('comparison')} className={`text-xs font-black uppercase tracking-widest ${activeTab === 'comparison' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>2. Compare Results</button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 space-y-10 animate-in fade-in duration-500">
        
        {/* --- SECTION 1: SEARCH & SNAPSHOT --- */}
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-200 relative overflow-visible">
          <div className="flex flex-col lg:flex-row gap-10 items-end mb-12">
            <SearchSelector label="1. Project Context" placeholder="Search Tenders..." options={tenders} value={selectedTenderId} onChange={setSelectedTenderId} icon={Target} />
            <SearchSelector label="2. Firm Identity" placeholder="Search Suppliers..." options={suppliers} value={selectedSupplierId} onChange={setSelectedSupplierId} icon={Building} />
            <button 
              onClick={handleRunAudit} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black px-12 py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase text-xs tracking-widest flex items-center gap-3 shrink-0 h-[60px]"
            >
              {loading ? 'Processing...' : 'Check This Supplier Now'}
              {!loading && <Zap className="w-4 h-4 fill-current" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 pt-10 border-t border-slate-100">
             <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Project Budget</p>
                <p className="text-xl font-black text-emerald-600 italic">KES {activeTender?.budget_kes.toLocaleString()}</p>
             </div>
             <div className="space-y-2 border-l border-slate-100 pl-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completion Deadline</p>
                <p className="text-xl font-black text-slate-900 underline decoration-blue-200 decoration-2 underline-offset-4">{activeTender?.anticipated_closure_date}</p>
             </div>
             <div className="space-y-2 border-l border-slate-100 pl-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Landmark className="w-3 h-3 text-rose-500" /> Credit Score
                </p>
                <p className={`text-xl font-black ${(activeSupplier?.credit_score || 0) < 500 ? 'text-rose-600' : 'text-blue-600'}`}>{activeSupplier?.credit_score} Points</p>
             </div>
             <div className="space-y-2 border-l border-slate-100 pl-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Workforce Size</p>
                <p className="text-xl font-black text-slate-900">{activeSupplier?.employee_count} Employees</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Verified Registry Data</p>
             </div>
             <div className="space-y-2 border-l border-slate-100 pl-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Market History</p>
                <p className="text-xl font-black text-slate-900">{Math.round((activeSupplier?.age_days || 0)/365)} Years Seniority</p>
             </div>
          </div>
        </div>

        {/* --- SECTION 2: CONCONCLUSIVE HISTORY & VERDICT --- */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT: History Ledger (ALWAYS SHOWS) */}
            <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-900 text-white px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-blue-400 font-black uppercase text-xs tracking-widest">
                  <History className="w-5 h-5" /> Verified Performance History
                </div>
                <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase">{activeSupplier?.past_contracts?.length || 0} Records Found</div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase">
                      <th className="px-8 py-5">Contract Name</th>
                      <th className="px-8 py-5">Actual Completion</th>
                      <th className="px-8 py-5">Days Delayed</th>
                      <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {activeSupplier?.past_contracts && activeSupplier.past_contracts.length > 0 ? activeSupplier.past_contracts.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6 text-slate-800 tracking-tight uppercase italic">{c.project_name}</td>
                        <td className="px-8 py-6 text-slate-500 font-mono text-xs">{c.actual_end}</td>
                        <td className="px-8 py-6 text-slate-900">
                          <span className={c.delay_days > 15 ? 'text-rose-600' : 'text-emerald-600'}>+{c.delay_days} FULL DAYS</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">{c.status}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-24 text-center text-slate-300 font-black uppercase text-xs italic">Searching for records...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Result Column */}
            <div className="lg:col-span-5 flex flex-col gap-8 self-stretch">
              {riskResult ? (
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-10 duration-700 h-full">
                  <div className={`p-10 rounded-[3rem] border-[10px] shadow-2xl flex flex-col items-center text-center relative overflow-hidden flex-1 ${riskResult.risk_level === 'High' ? 'bg-rose-50 border-rose-500' : 'bg-emerald-50 border-emerald-500'}`}>
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl mb-8 transform -rotate-3">
                      {riskResult.risk_level === 'High' ? <AlertTriangle className="w-20 h-20 text-rose-600" /> : <CheckCircle className="w-20 h-20 text-emerald-600" />}
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter uppercase italic mb-4">{riskResult.risk_level} RISK VERDICT</h2>
                    <p className="text-xl font-bold text-slate-700 leading-tight">
                      Anticipated project delay:
                      <span className="text-6xl font-black block mt-4 underline decoration-[12px] decoration-current/10 italic">
                        {Math.ceil(riskResult.predicted_delay_days)} FULL DAYS
                      </span>
                    </p>
                  </div>

                  <div className="bg-[#0F172A] text-white p-10 rounded-[3rem] shadow-2xl">
                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" /> Audit Evidence Used
                    </h3>
                    <div className="space-y-6">
                      {riskResult.risk_factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 bg-white/5 rounded-2xl border border-white/10">
                           <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${riskResult.risk_level === 'High' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                           <span className="text-sm font-bold text-slate-300 leading-relaxed italic">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center space-y-6 h-full shadow-inner">
                   <div className="bg-slate-50 p-8 rounded-full shadow-inner"><History className="w-16 h-16 text-slate-200" /></div>
                   <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Verdict Pending</h3>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] max-w-xs leading-relaxed mx-auto">
                     Review the historical performance ledger on the left, then click the blue button above to get the risk verdict.
                   </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- COMPARISON VIEW --- */}
        {activeTab === 'comparison' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Compare All Bidders</h2>
            {comparisonResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                  <h3 className="font-black text-slate-800 mb-12 uppercase text-[10px] tracking-widest">How likely each supplier is to finish on time</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="supplier_name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={20} />
                        <YAxis domain={[0, 1]} hide />
                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }} />
                        <Bar dataKey="risk_score_probability" radius={[20, 20, 20, 20]} barSize={80}>
                          {comparisonResults.map((entry, index) => (
                            <Cell key={index} fill={entry.risk_level === 'High' ? '#F43F5E' : '#10B981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-[#0F172A] text-white p-12 rounded-[4rem] shadow-2xl flex flex-col justify-center border-b-[20px] border-emerald-500">
                  <div className="text-center space-y-10">
                    <h3 className="font-black text-blue-400 text-[10px] uppercase tracking-[0.5em]">Best Choice Based on History</h3>
                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 space-y-8">
                       <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center text-slate-900 font-black text-5xl mx-auto shadow-lg shadow-emerald-500/20">#1</div>
                       <div className="text-3xl font-black uppercase italic leading-none">Rift Valley Infrastructure</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[5rem] p-40 border-8 border-dashed border-slate-50 text-center space-y-10 shadow-inner">
                <ListChecks className="w-32 h-32 text-slate-100 mx-auto" />
                <h3 className="text-4xl font-black text-slate-300 uppercase tracking-tighter italic text-center">No Data Audited</h3>
                <button onClick={() => setActiveTab('audit')} className="mt-10 bg-slate-900 text-white px-16 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all">Start Audit</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
