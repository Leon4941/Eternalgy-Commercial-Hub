/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { 
  Sun, 
  Download, 
  Calculator, 
  TrendingUp, 
  Zap, 
  Battery, 
  CheckCircle2, 
  Info,
  DollarSign,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const CA_SCHEDULE = [0.34, 0.14, 0.14, 0.14, 0.14, 0.10];
const TAX_RATES = [0.15, 0.17, 0.24];

export default function App() {
  // --- State ---
  const [cost, setCost] = useState<number>(100000);
  const [taxRate, setTaxRate] = useState<number>(0.24);
  const [withBattery, setWithBattery] = useState<boolean>(false);
  const [annualSavings, setAnnualSavings] = useState<number>(20000); 

  const exportRef = useRef<HTMLDivElement>(null);

  // --- Calculations ---
  const caData = useMemo(() => {
    return CA_SCHEDULE.map((percent, index) => {
      const amount = cost * percent;
      const taxSaving = amount * taxRate;
      return {
        year: index + 1,
        percent: percent * 100,
        amount,
        taxSaving
      };
    });
  }, [cost, taxRate]);

  const totalCASavings = useMemo(() => {
    return caData.reduce((acc, curr) => acc + curr.taxSaving, 0);
  }, [caData]);

  // GITA calculation
  const gitaAllowanceRate = withBattery ? 1.0 : 0.6;
  const gitaAllowanceVal = cost * gitaAllowanceRate;
  
  // Real tax rules: GITA is 100%/60% of investment
  // User requested to remove Chargeable Income cap/input
  const gitaTaxSavings = gitaAllowanceVal * taxRate;

  const totalTaxRedemption = totalCASavings + gitaTaxSavings;
  const actualCost = cost - totalTaxRedemption;
  
  // Payback period (Years)
  const roiYears = annualSavings > 0 ? actualCost / annualSavings : 0;

  // --- Actions ---
  const handleDownload = async () => {
    if (exportRef.current === null) return;
    
    // Set a temporary style for high-fidelity A4 export (794 x 1123 px)
    const originalWidth = exportRef.current.style.width;
    const originalHeight = exportRef.current.style.height;
    exportRef.current.style.width = '794px';
    exportRef.current.style.height = '1123px';
    
    try {
      const dataUrl = await toPng(exportRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        width: 794,
        height: 1123,
      });
      const link = document.createElement('a');
      link.download = `Eternalgy_Solar_Tax_Report_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      exportRef.current.style.width = originalWidth;
      exportRef.current.style.height = originalHeight;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 font-sans selection:bg-blue-100 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-none">ETERNALGY</h1>
              <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase">Eternal Energy</p>
            </div>
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-100"
          >
            <Download className="w-4 h-4" />
            Download Summary
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: Inputs Section */}
          <section className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200 border border-slate-100 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calculator className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="font-black text-xl tracking-tight">System Input</h2>
              </div>

              {/* Solar PV Cost */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Solar PV System Cost
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">RM</span>
                  <input 
                    type="number" 
                    value={cost} 
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono text-lg font-bold"
                  />
                </div>
              </div>

              {/* Tax Rate */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Income Tax Rate</label>
                <div className="grid grid-cols-3 gap-3">
                  {TAX_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setTaxRate(rate)}
                      className={cn(
                        "py-3 rounded-2xl border-2 text-sm font-black transition-all",
                        taxRate === rate 
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                      )}
                    >
                      {rate * 100}%
                    </button>
                  ))}
                </div>
              </div>

              {/* GITA Type */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incentive Category (GITA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setWithBattery(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      !withBattery 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <Zap className={cn("w-6 h-6", !withBattery ? "text-amber-400" : "text-slate-300")} />
                    <span className="font-black text-[10px] uppercase tracking-tighter">No Battery (60%)</span>
                  </button>
                  <button
                    onClick={() => setWithBattery(true)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      withBattery 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                    )}
                  >
                    <Battery className={cn("w-6 h-6", withBattery ? "text-green-400" : "text-slate-300")} />
                    <span className="font-black text-[10px] uppercase tracking-tighter">With Battery (100%)</span>
                  </button>
                </div>
              </div>

              {/* Annual Savings */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Yearly Bill Savings</label>
                <input 
                  type="number" 
                  value={annualSavings} 
                  onChange={(e) => setAnnualSavings(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono font-bold"
                />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-blue-600 text-white p-8 rounded-[2rem] shadow-2xl shadow-blue-200 relative overflow-hidden group">
                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Final Effective Cost</p>
                <h3 className="text-4xl font-black">{formatCurrency(actualCost)}</h3>
                <div className="mt-8 pt-6 border-t border-blue-500/50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Tax Redemption Value</span>
                  <span className="font-black text-lg">{formatCurrency(totalTaxRedemption)}</span>
                </div>
                {/* Decoration */}
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={120} />
                </div>
              </div>

              <div className="bg-emerald-500 text-white p-8 rounded-[2rem] shadow-2xl shadow-emerald-200 relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1">Payback Period (ROI)</p>
                    <h3 className="text-4xl font-black">{roiYears.toFixed(1)} <span className="text-lg text-emerald-100 opacity-80">Years</span></h3>
                  </div>
                  <TrendingUp className="w-10 h-10 text-emerald-100 opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
                <p className="mt-4 text-[10px] font-medium text-emerald-100 italic">Expected to break even by year {Math.ceil(roiYears + 1)}</p>
              </div>
            </div>
          </section>

          {/* RIGHT: Visual Report Section */}
          <section className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden ring-1 ring-slate-200">
              <div 
                className="p-5 sm:p-10 bg-white w-full max-w-[794px] min-h-[1123px] flex flex-col items-center mx-auto relative" 
                ref={exportRef}
              >
                {/* Report Header */}
                <div className="w-full flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 rounded-[1rem] flex items-center justify-center p-2.5">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                        <path d="M20 50 C 20 30, 45 30, 50 50 C 55 70, 80 70, 80 50 C 80 30, 55 30, 50 50 C 45 70, 20 70, 20 50 Z" fill="none" stroke="currentColor" strokeWidth="8" />
                        <circle cx="20" cy="50" r="4" />
                        <circle cx="80" cy="50" r="4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">ETERNALGY</h2>
                      <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 uppercase">Sustainable Solar Solutions</p>
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-100 pl-6">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Solar Tax Incentive Report</h3>
                    <p className="text-lg font-black text-slate-900 leading-tight">Investment ROI Analysis</p>
                    <p className="text-[10px] text-slate-500 font-medium">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Primary Stats Section */}
                <div className="w-full space-y-2 mb-6">
                  <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">System Capital Cost (Investment)</p>
                      <p className="text-xl font-black text-slate-900">{formatCurrency(cost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 text-blue-500">Incentive Category</p>
                      <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter">
                        {withBattery ? '100% GITA Offset' : '60% GITA Offset'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Total Savings (Tax Offset)</p>
                      <p className="text-lg font-black text-blue-600 truncate">{formatCurrency(totalTaxRedemption)}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Actual Net Cost</p>
                      <p className="text-lg font-black text-slate-900 truncate">{formatCurrency(actualCost)}</p>
                    </div>
                  </div>
                </div>

                {/* CA Schedule */}
                <div className="w-full mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-black text-[10px]">01</div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight">Capital Allowance (CA) Schedule</h3>
                    <div className="h-px flex-1 bg-slate-100 ml-3"></div>
                  </div>
                  <div className="bg-white rounded-[1rem] overflow-hidden border border-slate-100 shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Deduction Cycle</th>
                          <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Rate</th>
                          <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Amortized (RM)</th>
                          <th className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Tax Saved (RM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 border-b border-slate-100">
                        {caData.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-3 py-2 font-bold text-slate-600 text-[10px]">Year 0{row.year}</td>
                            <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-full text-[8px] font-black text-slate-900">{Math.round(row.percent)}%</span></td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500 font-medium whitespace-nowrap text-[10px]">{new Intl.NumberFormat().format(row.amount)}</td>
                            <td className="px-3 py-2 text-right font-black text-slate-900 whitespace-nowrap text-[10px]">{formatCurrency(row.taxSaving)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50/80 border-t-2 border-slate-900 font-black">
                          <td colSpan={3} className="px-3 py-3 text-slate-900 uppercase text-[8px] tracking-widest">Accumulated CA Tax Benefits</td>
                          <td className="px-3 py-3 text-right text-blue-600 text-base whitespace-nowrap">{formatCurrency(totalCASavings)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* GITA Logic */}
                <div className="w-full mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-slate-900 text-white rounded flex items-center justify-center font-black text-[10px]">02</div>
                    <h3 className="font-black text-lg text-slate-900 tracking-tight font-black">Green Investment Tax Allowance (GITA)</h3>
                    <div className="h-px flex-1 bg-slate-100 ml-4"></div>
                  </div>
                  <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-4 self-center">
                        <div>
                          <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-1">Category Weight</p>
                          <div className="flex items-center gap-2">
                            {withBattery ? <Battery className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                            <p className="text-base font-black">{withBattery ? "100% Tax Offset" : "60% Tax Offset"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 p-5 rounded-2xl border-2 border-white/20 backdrop-blur-sm self-center shadow-lg">
                        <p className="text-white text-[8px] font-black uppercase tracking-[0.2em] mb-1.5 text-center opacity-80">Calculated GITA Tax Saving (RM)</p>
                        <p className="text-xl font-black text-white text-center drop-shadow-sm">{formatCurrency(gitaTaxSavings)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final ROI Footer Summary */}
                <div className="w-full mt-auto pt-3 border-t-2 border-slate-900 grid grid-cols-2 gap-6 items-end">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Est. ROI Period</p>
                        <p className="text-xl font-black text-slate-900 leading-none">{roiYears.toFixed(1)} <span className="text-[10px] text-slate-400 uppercase font-bold">Years</span></p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        <Info className="w-2 h-2" />
                        ROI Calculation Basis
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                        Based on net cost of <span className="font-bold text-slate-900">{formatCurrency(actualCost)}</span> 
                        and ann. savings of <span className="font-bold text-slate-900">{formatCurrency(annualSavings)}</span>.
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-3xl font-black text-slate-900 leading-none">-{((totalTaxRedemption / cost) * 100).toFixed(0)}%</p>
                    <p className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Total Investment Offset</p>
                  </div>
                </div>

                <div className="w-full mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  <span>Eternalgy Commercial Hub</span>
                  <span>Confidential Proposal • {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* Floating Action Hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-6 py-3 rounded-full border border-slate-200 shadow-2xl flex items-center gap-4 group">
        <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-xs font-bold text-slate-600 tracking-tight">Adjust inputs to see real-time ROI update</span>
      </div>
    </div>
  );
}
