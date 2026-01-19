import axios from 'axios';
import {
  AlertTriangle, Building, CheckCircle, Clock, DollarSign, Search, TrendingUp,
  BarChart as BarChartIcon, Activity, Users, FileText, Share2, MapPin, Phone, Globe, ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Interfaces ---
interface HistoricalProject {
  year: string;
  delay_days: number;
  overrun_pct: number;
  project_size: string;
}

interface PredictionResponse {
  risk_level: string;
  predicted_delay_days: number;
  risk_score_probability: number;
  risk_factors: string[];
  historical_performance: HistoricalProject[];
  market_comparison: {
    supplier_avg_delay: number;
    market_avg_delay: number;
  };
}

interface PricingAnalysisResponse {
  total_variance_kes: number;
  inflated_items: {
    item: string;
    quoted: number;
    market: number;
    inflation_pct: number;
    potential_loss: number;
  }[];
  market_savings_potential: number;
  recommendation: string;
}

interface CollusionResponse {
  is_collusion_suspected: boolean;
  risk_score: number;
  graph_nodes: { id: string; type: string }[];
  graph_links: { source: string; target: string; label: string }[];
  message: string;
}

interface SiteVerifyResponse {
  zoning_type: string;
  satellite_snapshot_url: string;
  risk_score: number;
  analysis: string;
}

interface SanctionCheckResponse {
  is_sanctioned: boolean;
  source_list: string | null;
  match_confidence: number;
  details: string;
}

// --- Main App ---
function App() {
  const [activeTab, setActiveTab] = useState<'risk' | 'pricing' | 'collusion' | 'geo'>('risk');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. RISK STATE
  const [riskFormData, setRiskFormData] = useState({
    tender_budget_kes: 5000000,
    credit_score: 600,
    company_size: 'Medium',
    supplier_age_at_award_days: 700,
    category: 'Construction & Civil Works'
  });
  const [riskResult, setRiskResult] = useState<PredictionResponse | null>(null);

  // 2. PRICING STATE
  const [pricingItems, setPricingItems] = useState([
    { item_name: 'Cement (50kg Bag)', quoted_unit_price: 850, quantity: 5000 },
    { item_name: 'Standard Laptop (i5, 8GB)', quoted_unit_price: 65000, quantity: 10 },
    { item_name: 'Wheelbarrow', quoted_unit_price: 8000, quantity: 50 }
  ]);
  const [pricingResult, setPricingResult] = useState<PricingAnalysisResponse | null>(null);

  // 3. COLLUSION STATE
  const [collusionSupplier, setCollusionSupplier] = useState('Soyo Construction Ltd');
  const [collusionResult, setCollusionResult] = useState<CollusionResponse | null>(null);

  // 4. GEO & SANCTIONS STATE
  const [geoAddress, setGeoAddress] = useState('P.O. Box 4567, Nairobi');
  const [geoResult, setGeoResult] = useState<SiteVerifyResponse | null>(null);
  const [sanctionResult, setSanctionResult] = useState<SanctionCheckResponse | null>(null);


  const apiBaseURL = import.meta.env.VITE_API_BASE_URL;

  // --- Handlers ---
  const handleRiskPredict = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post<PredictionResponse>(`${apiBaseURL}/predict`, riskFormData);
      setRiskResult(res.data);
      // Auto-run sanctions check for demo
      const sancRes = await axios.post<SanctionCheckResponse>(`${apiBaseURL}/screen-sanctions`, {
        entity_name: "Soyo International", // Demo trigger
        directors: ["John Doe"]
      });
      setSanctionResult(sancRes.data);
    } catch (err) { setError('Connection Error'); console.error(err); }
    finally { setLoading(false); }
  };

  const handlePricingAnalyze = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post<PricingAnalysisResponse>('http://localhost:8000/analyze-pricing', pricingItems);
      setPricingResult(res.data);
    } catch (err) { setError('Connection Error'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleCollusionCheck = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post<CollusionResponse>('http://localhost:8000/check-collusion', {
        supplier_name: collusionSupplier,
        tender_id: "T-2025-001"
      });
      setCollusionResult(res.data);
    } catch (err) { setError('Connection Error'); console.error(err); }
    finally { setLoading(false); }
  };

  const handleGeoVerify = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.post<SiteVerifyResponse>('http://localhost:8000/verify-site', {
        address: geoAddress,
        coordinates: "-1.29, 36.82"
      });
      setGeoResult(res.data);
    } catch (err) { setError('Connection Error'); console.error(err); }
    finally { setLoading(false); }
  };

  // --- Components ---
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-50 text-red-900 border-red-200';
      case 'Medium': return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'Low': return 'bg-emerald-50 text-emerald-900 border-emerald-200';
      default: return 'bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              Soyo Procurement Intelligence
            </h1>
            <p className="text-slate-400 text-sm mt-1 ml-14">GovTech Audit Suite</p>
          </div>
          <div className="flex items-center gap-4">
            {sanctionResult && sanctionResult.is_sanctioned && (
              <div className="bg-red-600 px-4 py-2 rounded font-bold flex items-center gap-2 animate-pulse">
                <ShieldAlert className="w-5 h-5" />
                SANCTIONED ENTITY DETECTED
              </div>
            )}
            <div className="text-xs bg-slate-800 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2">
              <Globe className="w-3 h-3 text-blue-400" />
              Connected to OFAC / World Bank / GIS
            </div>
          </div>
        </div>
      </header>

      {error && <div className="bg-red-500 text-white p-4 text-center">{error}</div>}

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto flex gap-8 px-6 min-w-max">
          <button
            onClick={() => setActiveTab('risk')}
            className={`py-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'risk' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Activity className="w-5 h-5" />
            Performance Risk Audit
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'pricing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'} `}
          >
            <DollarSign className="w-5 h-5" />
            Fair Price Analysis
          </button>
          <button
            onClick={() => setActiveTab('collusion')}
            className={`py-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'collusion' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'} `}
          >
            <Share2 className="w-5 h-5" />
            Conflict of Interest (CR12)
          </button>
          <button
            onClick={() => setActiveTab('geo')}
            className={`py-4 px-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'geo' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'} `}
          >
            <MapPin className="w-5 h-5" />
            Geospatial Site Audit
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 mt-6">

        {/* --- TAB 1: RISK AUDIT --- */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input */}
            <section className="lg:col-span-4 h-fit space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
                  <Search className="w-5 h-5 text-blue-600" />
                  Supplier Due Diligence
                </h2>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="tender-budget" className="block text-sm font-semibold text-slate-700 mb-1">Tender Budget (KES)</label>
                    <input
                      id="tender-budget"
                      type="number"
                      value={riskFormData.tender_budget_kes}
                      onChange={(e) => setRiskFormData({ ...riskFormData, tender_budget_kes: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="credit-score" className="block text-sm font-semibold text-slate-700 mb-1">Credit Score (300-850)</label>
                    <input
                      id="credit-score"
                      type="number"
                      value={riskFormData.credit_score}
                      onChange={(e) => setRiskFormData({ ...riskFormData, credit_score: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company-size" className="block text-sm font-semibold text-slate-700 mb-1">Size</label>
                      <select
                        id="company-size"
                        value={riskFormData.company_size}
                        onChange={(e) => setRiskFormData({ ...riskFormData, company_size: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                      >
                        <option>Small</option><option>Medium</option><option>Large</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="supplier-age" className="block text-sm font-semibold text-slate-700 mb-1">Age (Days)</label>
                      <input
                        id="supplier-age"
                        type="number"
                        value={riskFormData.supplier_age_at_award_days}
                        onChange={(e) => setRiskFormData({ ...riskFormData, supplier_age_at_award_days: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { void handleRiskPredict() }}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4"
                  >
                    {loading ? 'Running Audit...' : 'Execute Risk Audit'}
                  </button>
                </div>
              </div>
            </section>

            {/* Results */}
            <section className="lg:col-span-8 space-y-6">
              {riskResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

                  {/* 1. Executive Assessment Card */}
                  <div className={`p-6 rounded-xl border-l-8 shadow-sm flex flex-col md:flex-row items-start gap-6 ${getRiskColor(riskResult.risk_level)} `}>
                    <div className="mt-1 shrink-0 bg-white p-4 rounded-full shadow-sm">
                      {riskResult.risk_level === 'High' ? <AlertTriangle className="w-12 h-12 text-red-600" /> :
                        riskResult.risk_level === 'Medium' ? <AlertTriangle className="w-12 h-12 text-amber-500" /> :
                          <CheckCircle className="w-12 h-12 text-emerald-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">AI Confidence: {Math.round(riskResult.risk_score_probability * 100)}%</span>
                      </div>
                      <h2 className="text-3xl font-bold mb-2">
                        {riskResult.risk_level} Risk Classification
                      </h2>
                      <p className="text-lg opacity-90 max-w-2xl leading-relaxed">
                        This supplier shows a <strong>{riskResult.risk_level.toLowerCase()} probability</strong> of contract failure.
                        Projected delivery deviation is <strong>{riskResult.predicted_delay_days} days</strong> beyond the contract end date.
                      </p>
                    </div>
                    <div className="bg-white/50 p-4 rounded-lg text-center min-w-[120px]">
                      <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Projected Delay</div>
                      <div className="text-3xl font-bold">{riskResult.predicted_delay_days}</div>
                      <div className="text-xs">Days</div>
                    </div>
                  </div>

                  {/* Sanctions Warning (Demo Injection) */}
                  {sanctionResult?.is_sanctioned && (
                    <div className="bg-red-900 text-white p-4 rounded-lg flex items-start gap-4 shadow-lg border-2 border-red-500 animate-pulse">
                      <ShieldAlert className="w-8 h-8 shrink-0" />
                      <div>
                        <h3 className="font-bold text-lg">GLOBAL SANCTIONS MATCH</h3>
                        <p className="opacity-90 text-sm">{sanctionResult.details}</p>
                      </div>
                    </div>
                  )}

                  {/* 2. Deep Dive Grid: Drivers & Benchmarks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* A. Explainable AI: Risk Factors */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                      <h4 className="text-slate-800 font-bold mb-4 flex items-center gap-2 border-b pb-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        Risk Drivers (Root Cause)
                      </h4>
                      <ul className="space-y-3 flex-1">
                        {riskResult.risk_factors.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span className="font-medium">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* B. Market Context */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                      <h4 className="text-slate-800 font-bold mb-4 flex items-center gap-2 border-b pb-2">
                        <BarChartIcon className="w-5 h-5 text-blue-600" />
                        Industry Benchmarking
                      </h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={[
                              { name: 'This Supplier', value: riskResult.market_comparison.supplier_avg_delay, fill: riskResult.market_comparison.supplier_avg_delay > riskResult.market_comparison.market_avg_delay ? '#ef4444' : '#10b981' },
                              { name: 'Market Avg', value: riskResult.market_comparison.market_avg_delay, fill: '#94a3b8' },
                            ]}
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" fontSize={11} />
                            <YAxis dataKey="name" type="category" width={90} stroke="#64748b" fontSize={11} fontWeight={600} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 italic text-center">
                        *Comparing against 5,000+ similar tenders in category.
                      </p>
                    </div>
                  </div>

                  {/* 3. Actionable Recommendations (The "So What?") */}
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                    <h4 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      SCM Officer Recommendations
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                        <h5 className="font-bold text-slate-700 text-sm mb-1">Procurement Action</h5>
                        <p className="text-sm text-slate-600">
                          {riskResult.risk_level === 'High' ? "Mandatory: Request 10% Performance Bond & Conduct Physical Site Verification." :
                            riskResult.risk_level === 'Medium' ? "Recommended: Request updated Bank Statements & conduct reference checks." :
                              "Standard Procedure: Proceed to award preparation."}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                        <h5 className="font-bold text-slate-700 text-sm mb-1">Feedback to Supplier</h5>
                        <p className="text-sm text-slate-600">
                          {riskResult.risk_level === 'High' ? "Flagged for insufficient financial capacity relative to tender size." :
                            riskResult.risk_level === 'Medium' ? "Note: Delivery timelines are consistently slipping beyond market average." :
                              "Strong performance profile maintained."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Historical Chart */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="text-slate-800 font-bold mb-6 flex items-center gap-2 border-b pb-4">
                      <Clock className="w-5 h-5 text-blue-600" />
                      5-Year Performance History
                    </h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={riskResult.historical_performance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="year" fontSize={12} stroke="#64748b" />
                          <YAxis fontSize={12} stroke="#64748b" />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar name="Delay (Days)" dataKey="delay_days" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                          <Bar name="Overrun (%)" dataKey="overrun_pct" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <Activity className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Run a risk audit to see supplier projections.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- TAB 2: PRICING ANALYSIS --- */}
        {activeTab === 'pricing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 h-fit space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Bill of Quantities (BoQ) Editor
                </h2>
                <div className="space-y-4">
                  {pricingItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-sm relative group">
                      <button
                        onClick={() => {
                          const newItems = pricingItems.filter((_, i) => i !== idx);
                          setPricingItems(newItems);
                        }}
                        className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </button>

                      <div className="space-y-2">
                        <div>
                          <label htmlFor={`item-name-${idx}`} className="text-xs text-slate-500 font-semibold uppercase">Item Description</label>
                          <input
                            id={`item-name-${idx}`}
                            type="text"
                            value={item.item_name}
                            onChange={(e) => {
                              const newItems = [...pricingItems];
                              newItems[idx].item_name = e.target.value;
                              setPricingItems(newItems);
                            }}
                            placeholder="e.g. Cement"
                            className="w-full px-2 py-1 border rounded bg-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label htmlFor={`quantity-${idx}`} className="text-xs text-slate-500 font-semibold uppercase">Qty</label>
                            <input
                              id={`quantity-${idx}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...pricingItems];
                                newItems[idx].quantity = Number(e.target.value);
                                setPricingItems(newItems);
                              }}
                              className="w-full px-2 py-1 border rounded bg-white outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor={`unit-price-${idx}`} className="text-xs text-slate-500 font-semibold uppercase">Unit Price (KES)</label>
                            <input
                              id={`unit-price-${idx}`}
                              type="number"
                              value={item.quoted_unit_price}
                              onChange={(e) => {
                                const newItems = [...pricingItems];
                                newItems[idx].quoted_unit_price = Number(e.target.value);
                                setPricingItems(newItems);
                              }}
                              className="w-full px-2 py-1 border rounded bg-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setPricingItems([...pricingItems, { item_name: '', quoted_unit_price: 0, quantity: 1 }])}
                    className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                    Add BoQ Item
                  </button>

                  <button
                    onClick={() => { void handlePricingAnalyze() }}
                    disabled={loading || pricingItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4 disabled:opacity-50"
                  >
                    {loading ? 'Scanning Market Prices...' : 'Check For Inflation'}
                  </button>
                </div>
              </div>
            </section>

            <section className="lg:col-span-8 space-y-6">
              {pricingResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className={`p-8 rounded-xl border shadow-sm ${pricingResult.total_variance_kes > 0 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} `}>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      {pricingResult.total_variance_kes > 0 ? <AlertTriangle /> : <CheckCircle />}
                      {pricingResult.recommendation}
                    </h2>
                    <p className="text-lg opacity-90">
                      Total Detected Inflation: <strong>KES {pricingResult.total_variance_kes.toLocaleString()}</strong>
                    </p>
                  </div>

                  {pricingResult.inflated_items.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-4 font-semibold text-slate-600">Item</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Quoted</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Market Rate</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Inflation</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingResult.inflated_items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-4 font-medium">{item.item}</td>
                              <td className="p-4 text-right font-mono text-red-600">{item.quoted.toLocaleString()}</td>
                              <td className="p-4 text-right font-mono text-emerald-600">{item.market.toLocaleString()}</td>
                              <td className="p-4 text-right font-bold text-red-600">+{item.inflation_pct}%</td>
                              <td className="p-4 text-right font-bold text-red-600">KES {item.potential_loss.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <DollarSign className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Enter BoQ items to compare against Market Price Index.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- TAB 3: COLLUSION --- */}
        {activeTab === 'collusion' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 h-fit space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  Beneficial Ownership Scan
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company-name" className="block text-sm font-semibold text-slate-700 mb-1">Company Name (CR12)</label>
                    <input
                      id="company-name"
                      type="text"
                      value={collusionSupplier}
                      onChange={(e) => setCollusionSupplier(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Checks for shared directors, same physical address, or shared phone numbers with other bidders in Tender #T-2025-001.
                  </p>
                  <button
                    onClick={() => { void handleCollusionCheck() }}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4"
                  >
                    {loading ? 'Building Network Graph...' : 'Trace Ownership'}
                  </button>
                </div>
              </div>
            </section>

            <section className="lg:col-span-8 space-y-6">
              {collusionResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className={`p-8 rounded-xl border shadow-sm ${collusionResult.is_collusion_suspected ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} `}>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      {collusionResult.is_collusion_suspected ? <AlertTriangle /> : <CheckCircle />}
                      {collusionResult.is_collusion_suspected ? 'Collusion Ring Detected' : 'No Conflict of Interest Found'}
                    </h2>
                    <p className="text-lg opacity-90">{collusionResult.message}</p>
                  </div>

                  {/* Network Graph Visualizer (Mock using CSS/Divs for now) */}
                  {collusionResult.is_collusion_suspected && (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 relative h-[500px] flex items-center justify-center overflow-hidden bg-slate-50/50">

                      {/* CENTRAL HUB: Director */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group cursor-pointer">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white ring-4 ring-slate-100 transition-transform group-hover:scale-110">
                          <Users className="w-8 h-8" />
                        </div>
                        <span className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-sm mt-3 font-bold shadow-lg">Director: John Doe</span>
                      </div>

                      {/* LEFT: Company A */}
                      <div className="absolute top-1/4 left-1/4 flex flex-col items-center animate-pulse z-10">
                        <div className="w-24 h-24 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-lg border-2 border-red-500">
                          <Building className="w-10 h-10" />
                        </div>
                        <span className="font-bold mt-2 text-red-700 bg-red-100 px-3 py-1 rounded border border-red-200">Soyo Const.</span>
                        {/* Link to Director */}
                        <div className="absolute top-12 left-24 w-40 h-1 bg-slate-300 rotate-[25deg] -z-10 origin-left"></div>
                      </div>

                      {/* RIGHT: Company B */}
                      <div className="absolute bottom-1/4 right-1/4 flex flex-col items-center animate-pulse z-10">
                        <div className="w-24 h-24 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-lg border-2 border-red-500">
                          <Building className="w-10 h-10" />
                        </div>
                        <span className="font-bold mt-2 text-red-700 bg-red-100 px-3 py-1 rounded border border-red-200">Hidden Ventures</span>
                        {/* Link to Director */}
                        <div className="absolute bottom-12 right-24 w-40 h-1 bg-slate-300 rotate-[25deg] -z-10 origin-right"></div>
                      </div>

                      {/* BOTTOM: Shared Address */}
                      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 shadow-md border-2 border-amber-500">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">P.O. Box 4567</span>
                        {/* Links */}
                        <div className="absolute -top-10 left-0 w-64 h-32 border-b-2 border-l-2 border-amber-300 rounded-bl-full -z-10 opacity-50"></div>
                        <div className="absolute -top-10 right-0 w-64 h-32 border-b-2 border-r-2 border-amber-300 rounded-br-full -z-10 opacity-50"></div>
                      </div>

                      {/* TOP RIGHT: Shared Phone */}
                      <div className="absolute top-10 right-20 flex flex-col items-center z-10">
                        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 shadow-md border-2 border-amber-500">
                          <Phone className="w-6 h-6" />
                        </div>
                        <span className="mt-2 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">+254 722...</span>
                        {/* Link to Company B */}
                        <div className="absolute top-14 left-0 w-1 h-20 bg-amber-300 -z-10"></div>
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <Share2 className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Scan CR12 records for shared directorships.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* --- TAB 4: GEOSPATIAL AUDIT --- */}
        {activeTab === 'geo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <section className="lg:col-span-4 h-fit space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 border-b pb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Site Verification (GIS)
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="physical-address" className="block text-sm font-semibold text-slate-700 mb-1">Registered Physical Address</label>
                    <input id="physical-address" type="text"
                      value={geoAddress}
                      onChange={(e) => setGeoAddress(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Uses Satellite Imagery and County Zoning Data to verify if the location is a valid operational site or a residential/shell address.
                  </p>
                  <button
                    onClick={() => { void handleGeoVerify() }}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-4"
                  >
                    {loading ? 'Acquiring Satellite Feed...' : 'Verify Physical Location'}
                  </button>
                </div>
              </div>
            </section>

            <section className="lg:col-span-8 space-y-6">
              {geoResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className={`p-8 rounded-xl border shadow-sm ${geoResult.risk_score > 50 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'} `}>
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                      {geoResult.risk_score > 50 ? <AlertTriangle /> : <CheckCircle />}
                      Zoning: {geoResult.zoning_type}
                    </h2>
                    <p className="text-lg opacity-90">{geoResult.analysis}</p>
                  </div>

                  {/* Simulated Satellite View */}
                  <div className="bg-slate-900 rounded-xl overflow-hidden relative h-96 group">
                    {/* Map Overlay UI */}
                    <div className="absolute top-4 left-4 z-20 bg-slate-900/80 text-white p-2 rounded backdrop-blur-sm border border-slate-700">
                      <div className="text-xs font-mono text-emerald-400">LIVE FEED • -1.2921, 36.8219</div>
                      <div className="text-xs font-mono opacity-70">Resolution: 30cm • Source: Maxar</div>
                    </div>

                    {/* Target Reticle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="w-16 h-16 border-2 border-red-500 rounded-full animate-ping absolute opacity-50"></div>
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
                      <div className="w-64 h-0.5 bg-red-500/30 absolute top-2 -left-32"></div>
                      <div className="h-64 w-0.5 bg-red-500/30 absolute -top-30 left-2"></div>
                    </div>

                    {/* Placeholder for Map (CSS Grid Pattern to simulate map) */}
                    <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-80 group-hover:scale-105 transition-transform duration-1000"></div>

                    <div className="absolute bottom-4 right-4 z-20">
                      <span className={`px-4 py-2 rounded font-bold uppercase shadow-lg ${geoResult.risk_score > 50 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'} `}>
                        Site Verdict: {geoResult.risk_score > 50 ? 'FAIL' : 'PASS'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                  <MapPin className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Enter physical address to cross-reference with County Zoning & Satellite data.</p>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;