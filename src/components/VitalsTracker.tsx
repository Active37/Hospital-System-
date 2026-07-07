import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Plus, TrendingUp, AlertTriangle, CheckCircle, Heart, Thermometer, ChevronRight } from 'lucide-react';
import { VitalRecord } from '../types';

interface VitalsTrackerProps {
  vitals: VitalRecord[];
  onAddVital: (vital: Omit<VitalRecord, 'id' | 'date' | 'time'>) => void;
}

type VitalType = 'bp' | 'hr' | 'temp';

export default function VitalsTracker({ vitals, onAddVital }: VitalsTrackerProps) {
  const [activeTab, setActiveTab] = useState<VitalType>('hr');
  const [isLogging, setIsLogging] = useState(false);

  // Form states
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [error, setError] = useState('');

  // Latest values
  const latest = vitals[vitals.length - 1];

  // Helper clinical checks
  const getBpCategory = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (sys >= 120 && sys < 130 && dia < 80) return { label: 'Elevated', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if ((sys >= 130 && sys < 140) || (dia >= 80 && dia < 90)) return { label: 'Stage 1 Hypertension', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: 'Stage 2 Hypertension', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const getHrCategory = (hr: number) => {
    if (hr < 60) return { label: 'Bradycardia (Low)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (hr <= 100) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    return { label: 'Tachycardia (High)', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  const getTempCategory = (temp: number) => {
    if (temp < 97.0) return { label: 'Low Temperature', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (temp <= 99.0) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (temp < 100.4) return { label: 'Low Grade Fever', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'High Fever', color: 'text-red-600 bg-red-50 border-red-200' };
  };

  // SVG Chart Config
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  // Chart data calculations
  const getChartParams = () => {
    let minVal = 0;
    let maxVal = 100;
    let getVal: (item: VitalRecord) => number | number[] = () => 0;

    if (activeTab === 'hr') {
      minVal = 50;
      maxVal = 120;
      getVal = (item) => item.heartRate;
    } else if (activeTab === 'temp') {
      minVal = 95;
      maxVal = 103;
      getVal = (item) => item.temperature;
    } else {
      minVal = 60;
      maxVal = 150;
      // Returns [systolic, diastolic]
      getVal = (item) => [item.systolic, item.diastolic];
    }

    return { minVal, maxVal, getVal };
  };

  const { minVal, maxVal, getVal } = getChartParams();

  // Map values to coordinates
  const getCoords = (val: number, index: number) => {
    const totalPoints = vitals.length;
    const xRange = width - paddingLeft - paddingRight;
    const yRange = height - paddingTop - paddingBottom;

    const x = paddingLeft + (index / Math.max(1, totalPoints - 1)) * xRange;
    const y = height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * yRange;
    return { x, y };
  };

  // Build SVG Path helper
  const buildPath = (values: number[]) => {
    if (values.length === 0) return '';
    return values
      .map((val, idx) => {
        const { x, y } = getCoords(val, idx);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Create datasets
  let paths: { path: string; color: string; fillPath?: string; dots: { x: number; y: number; val: number; date: string }[] }[] = [];

  if (activeTab === 'bp') {
    const sysVals = vitals.map(v => v.systolic);
    const diaVals = vitals.map(v => v.diastolic);
    
    const sysDots = sysVals.map((val, idx) => ({ ...getCoords(val, idx), val, date: vitals[idx].date }));
    const diaDots = diaVals.map((val, idx) => ({ ...getCoords(val, idx), val, date: vitals[idx].date }));

    paths = [
      { path: buildPath(sysVals), color: '#14b8a6', dots: sysDots }, // Teal for Systolic
      { path: buildPath(diaVals), color: '#f59e0b', dots: diaDots }  // Amber for Diastolic
    ];
  } else {
    const singleVals = vitals.map(v => getVal(v) as number);
    const dots = singleVals.map((val, idx) => ({ ...getCoords(val, idx), val, date: vitals[idx].date }));
    
    // Add background fill area under single lines for rich visual look
    const fillBaseY = height - paddingBottom;
    let fillPath = '';
    if (dots.length > 0) {
      fillPath = `${buildPath(singleVals)} L ${dots[dots.length - 1].x} ${fillBaseY} L ${dots[0].x} ${fillBaseY} Z`;
    }

    paths = [
      { 
        path: buildPath(singleVals), 
        color: activeTab === 'hr' ? '#ef4444' : '#6366f1', // Red for HR, Indigo for Temp
        fillPath,
        dots 
      }
    ];
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sysNum = parseInt(systolic);
    const diaNum = parseInt(diastolic);
    const hrNum = parseInt(heartRate);
    const tempNum = parseFloat(temperature);

    if (!sysNum || sysNum < 50 || sysNum > 220) {
      setError('Please enter a valid systolic BP (50 - 220)');
      return;
    }
    if (!diaNum || diaNum < 30 || diaNum > 150) {
      setError('Please enter a valid diastolic BP (30 - 150)');
      return;
    }
    if (!hrNum || hrNum < 30 || hrNum > 200) {
      setError('Please enter a valid Heart Rate (30 - 200)');
      return;
    }
    if (!tempNum || tempNum < 90 || tempNum > 110) {
      setError('Please enter a valid Temperature (90 - 110 °F)');
      return;
    }

    onAddVital({
      systolic: sysNum,
      diastolic: diaNum,
      heartRate: hrNum,
      temperature: tempNum,
    });

    // Reset Form
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setTemperature('');
    setError('');
    setIsLogging(false);
  };

  const getActiveIndicatorLabel = () => {
    if (activeTab === 'hr') return 'Heart Rate (bpm)';
    if (activeTab === 'temp') return 'Body Temp (°F)';
    return 'Blood Pressure (mmHg)';
  };

  return (
    <div id="vitals-tracker-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Health Metrics & Vitals</h3>
            <p className="text-xs text-slate-500">Track and log clinical readings</p>
          </div>
        </div>

        <button
          onClick={() => setIsLogging(!isLogging)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
        >
          {isLogging ? 'Cancel Log' : 'Log Vitals'}
          {!isLogging && <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-5">
        <AnimatePresence mode="wait">
          {isLogging ? (
            <motion.form
              key="vitals-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="space-y-4 py-1"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Log New Clinical Assessment</h4>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="e.g., 120"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="e.g., 80"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g., 72"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="e.g., 98.6"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm transition shadow-xs"
              >
                Save Metrics
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="vitals-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Metric Quick Stats Row */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* BP Stat Card */}
                <button
                  onClick={() => setActiveTab('bp')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-[82px] cursor-pointer ${
                    activeTab === 'bp' ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-100' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-slate-500">Pressure</span>
                    <Heart className={`w-3.5 h-3.5 ${activeTab === 'bp' ? 'text-teal-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="mt-1">
                    <div className="text-[15px] font-bold text-slate-800">
                      {latest ? `${latest.systolic}/${latest.diastolic}` : 'N/A'} <span className="text-[10px] font-medium text-slate-400">mmHg</span>
                    </div>
                    {latest && (
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getBpCategory(latest.systolic, latest.diastolic).color}`}>
                        {getBpCategory(latest.systolic, latest.diastolic).label}
                      </span>
                    )}
                  </div>
                </button>

                {/* Heart Rate Stat Card */}
                <button
                  onClick={() => setActiveTab('hr')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-[82px] cursor-pointer ${
                    activeTab === 'hr' ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-100' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-slate-500">Pulse</span>
                    <Activity className={`w-3.5 h-3.5 ${activeTab === 'hr' ? 'text-red-500' : 'text-slate-400'}`} />
                  </div>
                  <div className="mt-1">
                    <div className="text-[15px] font-bold text-slate-800">
                      {latest ? latest.heartRate : 'N/A'} <span className="text-[10px] font-medium text-slate-400">bpm</span>
                    </div>
                    {latest && (
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getHrCategory(latest.heartRate).color}`}>
                        {getHrCategory(latest.heartRate).label}
                      </span>
                    )}
                  </div>
                </button>

                {/* Temp Stat Card */}
                <button
                  onClick={() => setActiveTab('temp')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-[82px] cursor-pointer ${
                    activeTab === 'temp' ? 'bg-slate-50 border-slate-300 ring-1 ring-slate-100' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-medium text-slate-500">Temp</span>
                    <Thermometer className={`w-3.5 h-3.5 ${activeTab === 'temp' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  </div>
                  <div className="mt-1">
                    <div className="text-[15px] font-bold text-slate-800">
                      {latest ? latest.temperature : 'N/A'} <span className="text-[10px] font-medium text-slate-400">°F</span>
                    </div>
                    {latest && (
                      <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded border font-semibold ${getTempCategory(latest.temperature).color}`}>
                        {getTempCategory(latest.temperature).label}
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Dynamic SVG Chart */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>7-Day Trend: {getActiveIndicatorLabel()}</span>
                  </div>
                  {activeTab === 'bp' && (
                    <div className="flex gap-2 text-[9px] font-semibold">
                      <span className="flex items-center gap-1 text-teal-600">
                        <span className="w-2 h-2 rounded-full bg-teal-500" /> Systolic
                      </span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Diastolic
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[320px]">
                    {/* Vertical grid lines */}
                    {vitals.map((item, idx) => {
                      const { x } = getCoords(minVal, idx);
                      return (
                        <line
                          key={`grid-x-${idx}`}
                          x1={x}
                          y1={paddingTop}
                          x2={x}
                          y2={height - paddingBottom}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                      );
                    })}

                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const value = minVal + ratio * (maxVal - minVal);
                      const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
                      return (
                        <g key={`grid-y-${idx}`}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={width - paddingRight}
                            y2={y}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                          <text
                            x={paddingLeft - 8}
                            y={y + 3}
                            fill="#94a3b8"
                            fontSize="9px"
                            fontWeight="500"
                            textAnchor="end"
                            className="font-mono"
                          >
                            {Math.round(value)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Plot Paths & Area Fill */}
                    {paths.map((p, pIdx) => (
                      <g key={`path-group-${pIdx}`}>
                        {p.fillPath && (
                          <path
                            d={p.fillPath}
                            fill={`${p.color}0c`} // very light transparency
                          />
                        )}
                        <motion.path
                          d={p.path}
                          fill="none"
                          stroke={p.color}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                        {/* Interactive circles */}
                        {p.dots.map((d, dIdx) => (
                          <g key={`dot-${pIdx}-${dIdx}`} className="group cursor-pointer">
                            <circle
                              cx={d.x}
                              cy={d.y}
                              r="4"
                              fill="#ffffff"
                              stroke={p.color}
                              strokeWidth="2"
                            />
                            {/* Hover highlight circle */}
                            <circle
                              cx={d.x}
                              cy={d.y}
                              r="8"
                              fill={p.color}
                              fillOpacity="0"
                              className="hover:fill-opacity-15 transition-all duration-200"
                            />
                            {/* Simple tooltip box (visible on hover) */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                              <rect
                                x={d.x - 30}
                                y={d.y - 28}
                                width="60"
                                height="18"
                                rx="4"
                                fill="#0f172a"
                              />
                              <text
                                x={d.x}
                                y={d.y - 16}
                                fill="#ffffff"
                                fontSize="9px"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="font-mono"
                              >
                                {d.val}{activeTab === 'temp' ? '°F' : ''}
                              </text>
                            </g>
                          </g>
                        ))}
                      </g>
                    ))}

                    {/* X Axis Labels */}
                    {vitals.map((item, idx) => {
                      const { x } = getCoords(minVal, idx);
                      return (
                        <text
                          key={`label-x-${idx}`}
                          x={x}
                          y={height - 12}
                          fill="#64748b"
                          fontSize="9px"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {item.date}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informative Footer */}
        <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-2.5 border border-slate-100 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-slate-600">
            {latest 
              ? `Your last logged health metrics were updated today at ${latest.time}. All core signs remain optimal.`
              : 'Log your vital signs daily to keep clinical history updated.'}
          </p>
        </div>
      </div>
    </div>
  );
}
