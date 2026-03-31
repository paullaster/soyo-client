import axios from 'axios';
import {
  AlertTriangle, Building, CheckCircle, Search, Target, ArrowRight, Zap,
  History, ShieldCheck, ListChecks, Fingerprint, ArrowDownCircle, Check, 
  ActivitySquare, UserX, Users2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Types ---
interface Director { name: string; national_id: string; }
interface PastContract {
  project_name: string; start_date: string; planned_end: string; actual_end: string; status: string; delay_days: number;
}
interface Tender { 
  id: string; title: string; category: string; budget_kes: number; deadline_days: number; anticipated_closure_date: string;
}
interface Supplier {
  id: string; name: string; registration_number: string; credit_score: number; employee_count: number; age_days: number;
  directors: Director[]; past_contracts: PastContract[];
}interface AnalysisResult { 
  tender_id: string; supplier_id: string; supplier_name: string; risk_level: string; risk_score_probability: number; predicted_delay_days: number; timestamp: string; 
  workload_status?: string; conflict_found?: boolean;
}
interface RiskAuditResponse extends AnalysisResult { 
  risk_factors: string[]; 
  active_workload_kes: number;
  conflicts: { partner: string; directors: string[] }[];
}

// --- Search Input ---
function SearchInput({ options, value, onChange, placeholder, label, icon: Icon }: any) {
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
    <div className="relative w-full" ref={wrapperRef}>
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border-2 rounded-xl px-4 py-4 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-blue-600 shadow-lg' : 'border-slate-200'}`}
      >
        <div className="flex items-center gap-3 truncate">
          <Icon className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900 truncate">{selected ? (selected.title || selected.name) : placeholder}</span>
        </div>
        <ArrowDownCircle className="w-5 h-5 text-slate-300" />
      </div>
      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input autoFocus placeholder="Start typing to search..." className="w-full bg-transparent outline-none text-sm font-bold text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map((opt: any) => (
              <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearchTerm(''); }} className={`p-4 text-sm font-bold cursor-pointer hover:bg-blue-50 flex items-center justify-between ${value === opt.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700'}`}>
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

  const apiBaseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const init = async () => {
      try {
        const tRes = await axios.get<Tender[]>(`${apiBaseURL}/tenders`);
        setTenders(tRes.data);
        if (tRes.data.length) {
          const firstTenderId = tRes.data[0].id;
          setSelectedTenderId(firstTenderId);
          await fetchSuppliers(firstTenderId);
        }
      } catch (err) { setError('Connection Failure.'); }
    };
    void init();
  }, []);

  useEffect(() => { 
    if (selectedTenderId) {
      void fetchComparison();
      void fetchSuppliers(selectedTenderId);
    } 
  }, [selectedTenderId]);

  useEffect(() => { setRiskResult(null); }, [selectedSupplierId, selectedTenderId]);

  const fetchSuppliers = async (tenderId: string) => {
    try {
      const res = await axios.get<Supplier[]>(`${apiBaseURL}/suppliers?tender_id=${tenderId}`);
      setSuppliers(res.data);
      if (res.data.length) setSelectedSupplierId(res.data[0].id);
      else setSelectedSupplierId('');
    } catch (err) { console.error('Failed to fetch suppliers', err); }
  };

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
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Audit Failed: Unexpected Error.');
    }
    finally { setLoading(false); }
  };

  const activeTender = tenders.find(t => t.id === selectedTenderId);
  const activeSupplier = suppliers.find(s => s.id === selectedSupplierId);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] font-sans pb-20">
      
      {/* --- TOP BRANDING --- */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg shadow-md"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Soyo</h1>
        </div>
        <div className="flex gap-8">
           <button onClick={() => setActiveTab('audit')} className={`text-xs font-black uppercase tracking-widest ${activeTab === 'audit' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>1. Check a Supplier</button>
           <button onClick={() => setActiveTab('comparison')} className={`text-xs font-black uppercase tracking-widest ${activeTab === 'comparison' ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'text-slate-400 hover:text-slate-600'}`}>2. Compare Results</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* --- ERROR BANNER --- */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-lg">
            <div className="bg-red-500 p-2 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">System Error Detected</p>
              <p className="text-red-900 font-bold text-sm leading-relaxed">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600 font-black uppercase text-[10px] tracking-widest border border-red-200 px-4 py-2 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* --- STEP 1: SELECTORS --- */}
        <section className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-200 overflow-visible">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-10">
            <div className="lg:col-span-5">
              <SearchInput label="Search for a Project" placeholder="Select Tender..." options={tenders} value={selectedTenderId} onChange={setSelectedTenderId} icon={Target} />
            </div>
            <div className="lg:col-span-4">
              <SearchInput label="Search for a Firm" placeholder="Select Supplier..." options={suppliers} value={selectedSupplierId} onChange={setSelectedSupplierId} icon={Building} />
            </div>
            <div className="lg:col-span-3">
              <button 
                onClick={handleRunAudit} disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-[18px] rounded-xl shadow-xl transition-all transform active:scale-95 uppercase text-xs tracking-widest flex items-center justify-center gap-3"
              >
                {loading ? 'Processing...' : 'Check This Supplier Now'}
                {!loading && <Zap className="w-4 h-4 fill-current" />}
              </button>
            </div>
          </div>

          {/* --- THE DATA SNAPSHOT --- */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pt-10 border-t border-slate-100">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tender Budget</p>
                <p className="text-xl font-black text-emerald-600">KES {activeTender?.budget_kes.toLocaleString()}</p>
             </div>
             <div className="space-y-1 border-l border-slate-100 pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anticipated Closure</p>
                <p className="text-xl font-black text-slate-900">{activeTender?.anticipated_closure_date}</p>
             </div>
             <div className="space-y-1 border-l border-slate-100 pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Score</p>
                <p className={`text-xl font-black ${(activeSupplier?.credit_score || 0) < 500 ? 'text-red-600' : 'text-blue-600'}`}>{activeSupplier?.credit_score} Points</p>
             </div>
             <div className="space-y-1 border-l border-slate-100 pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workforce Size</p>
                <p className="text-xl font-black text-slate-900">{activeSupplier?.employee_count} Employees</p>
             </div>
             <div className="space-y-1 border-l border-slate-100 pl-8">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Experience</p>
                <p className="text-xl font-black text-slate-900">{Math.round((activeSupplier?.age_days || 0)/365)} Years active</p>
             </div>
          </div>

          {/* EXPLICIT DIRECTOR LIST (By Name and ID) */}
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-6">
             <div className="flex items-center gap-2 shrink-0">
                <Users2 className="w-5 h-5 text-blue-600" />
                <span className="text-[10px] font-black text-slate-400 uppercase">Registered Owners:</span>
             </div>
             <div className="flex flex-wrap gap-3">
                {activeSupplier?.directors.map((d, i) => (
                  <span key={i} className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-sm font-bold text-slate-700 shadow-sm flex items-center gap-2">
                    {d.name} <span className="text-[10px] text-slate-400 font-black">({d.national_id})</span>
                  </span>
                ))}
             </div>
          </div>
        </section>

        {/* --- AUDIT AREA --- */}
        {activeTab === 'audit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: History Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Performance Records (State Registry)</h3>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase">5 Verified Contracts</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                      <th className="px-8 py-4">Contract Name</th>
                      <th className="px-8 py-4">Timeline</th>
                      <th className="px-8 py-4">Delay Days</th>
                      <th className="px-8 py-4 text-center">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSupplier?.past_contracts && activeSupplier.past_contracts.length > 0 ? activeSupplier.past_contracts.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800 tracking-tight italic uppercase">{c.project_name}</td>
                        <td className="px-8 py-5 text-slate-500 font-bold text-xs">{c.start_date} <ArrowRight className="inline w-3 h-3 mx-1 opacity-30" /> {c.actual_end}</td>
                        <td className="px-8 py-5 font-black">
                          <span className={c.delay_days > 15 ? 'text-red-600' : 'text-emerald-600'}>+{c.delay_days} FULL DAYS</span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm">{c.status}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-400 font-bold uppercase text-[10px]">No historical records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Verdict */}
            <div className="lg:col-span-5 flex flex-col gap-8 self-stretch">
              {riskResult ? (
                <div className="animate-in fade-in slide-in-from-right-10 duration-700 space-y-8">
                  <div className={`p-10 rounded-[3rem] border-[10px] shadow-2xl flex flex-col items-center text-center ${riskResult.risk_level === 'High' ? 'bg-red-50 border-red-500' : 'bg-emerald-50 border-emerald-500'}`}>
                    <div className="bg-white p-8 rounded-full shadow-lg mb-6">
                      {riskResult.risk_level === 'High' ? <AlertTriangle className="w-16 h-16 text-red-600" /> : <CheckCircle className="w-16 h-16 text-emerald-600" />}
                    </div>
                    <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">{riskResult.risk_level} RISK VERDICT</h2>
                    <p className="text-xl font-bold text-slate-700">
                      {riskResult.predicted_delay_days < 0 ? 'Projected to finish early:' : 'Forecasted project delay:'}
                      <span className="text-5xl font-black block mt-4 underline decoration-blue-200 decoration-8">
                        {Math.abs(Math.ceil(riskResult.predicted_delay_days))} {riskResult.predicted_delay_days < 0 ? 'DAYS AHEAD' : 'FULL DAYS'}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl space-y-8">
                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Fingerprint className="w-4 h-4" /> Traceable Audit Evidence
                    </h3>
                    <div className="space-y-6">
                      {riskResult.risk_factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                           <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${riskResult.risk_level === 'High' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                           <span className="text-sm font-bold text-slate-300 leading-relaxed italic">{f}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                       <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Active Commitments</p>
                          <p className="text-sm font-black text-blue-400">KES {riskResult.active_workload_kes.toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-white/5 rounded-xl text-center border border-white/5">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Ownership Scan</p>
                          <p className={`text-[10px] font-black ${riskResult.conflicts.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {riskResult.conflicts.length > 0 ? 'CONFLICT FOUND' : 'CLEAR'}
                          </p>
                       </div>
                    </div>

                    {riskResult.conflicts.length > 0 && (
                      <div className="bg-red-900/30 p-4 rounded-2xl border border-red-500/50 flex items-start gap-3 mt-4">
                        <UserX className="w-5 h-5 text-red-400 shrink-0 mt-1" />
                        <div className="text-xs font-bold text-red-200 leading-relaxed">
                          Conflict Detected with {riskResult.conflicts[0].partner}. Shared Owner: {riskResult.conflicts[0].directors[0]}.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-200 p-20 flex flex-col items-center justify-center text-center h-full shadow-inner space-y-4">
                   <div className="bg-slate-50 p-8 rounded-full shadow-inner"><ActivitySquare className="w-16 h-16 text-slate-200" /></div>
                   <h3 className="text-2xl font-black text-slate-300 uppercase italic">Awaiting Audit</h3>
                   <p className="text-slate-400 font-bold uppercase text-[9px] max-w-xs leading-relaxed mx-auto">
                     Review the historical data on the left, then click the blue button above to get the full risk evaluation.
                   </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- COMPARISON AREA --- */}
        {activeTab === 'comparison' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic text-center mb-12">Compare All Bidders</h2>
            {comparisonResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
                  <h3 className="font-black text-slate-800 mb-12 uppercase text-[10px] tracking-widest text-center">Success Probability (Lower is better)</h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonResults}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="supplier_name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={20} />
                        <YAxis domain={[0, 1]} hide />
                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }} />
                        <Bar dataKey="risk_score_probability" radius={[20, 20, 20, 20]} barSize={80}>
                          {comparisonResults.map((entry, index) => (
                            <Cell key={index} fill={entry.risk_level === 'High' ? '#EF4444' : '#10B981'} />
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
                       <div className="text-3xl font-black uppercase italic leading-none truncate">Rift Valley Infrastructure</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[5rem] p-40 border-8 border-dashed border-slate-50 text-center space-y-10 shadow-inner">
                <ListChecks className="w-32 h-32 text-slate-100 mx-auto" />
                <h3 className="text-4xl font-black text-slate-300 uppercase tracking-tighter italic">No Data Audited</h3>
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
