import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, Heart, Thermometer, TrendingUp } from 'lucide-react';
import { VitalRecord } from '../types';

interface VitalsRechartsProps {
  vitals: VitalRecord[];
}

type ChartMetric = 'bp' | 'hr' | 'temp';

export default function VitalsRecharts({ vitals }: VitalsRechartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('bp');

  // Custom styling for the tooltip to match City General Hospital's brand theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-md text-xs font-sans">
          <p className="font-bold text-slate-400 mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3 justify-between">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-mono font-bold text-white">
                  {entry.value}
                  {entry.name.includes('Temperature') ? '°F' : entry.name.includes('Pulse') ? ' bpm' : ' mmHg'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="vitals-recharts-section" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 tracking-tight">Interactive Vitals Trends</h3>
            <p className="text-xs text-slate-500">Advanced temporal charting using Recharts</p>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setSelectedMetric('bp')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedMetric === 'bp'
                ? 'bg-white text-teal-600 shadow-3xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Blood Pressure
          </button>
          <button
            onClick={() => setSelectedMetric('hr')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedMetric === 'hr'
                ? 'bg-white text-rose-600 shadow-3xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Pulse
          </button>
          <button
            onClick={() => setSelectedMetric('temp')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedMetric === 'temp'
                ? 'bg-white text-indigo-600 shadow-3xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Temp
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-5">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vitals} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                {/* BP Gradients */}
                <linearGradient id="sysColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="diaColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                {/* HR Gradient */}
                <linearGradient id="hrColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                {/* Temp Gradient */}
                <linearGradient id="tempColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={10}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                domain={
                  selectedMetric === 'bp' ? [50, 160] :
                  selectedMetric === 'hr' ? [50, 120] :
                  [95, 102]
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconSize={8}
                iconType="circle"
                wrapperStyle={{
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'sans-serif',
                }}
              />

              {selectedMetric === 'bp' && (
                <>
                  <Area
                    type="monotone"
                    name="Systolic"
                    dataKey="systolic"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sysColor)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    name="Diastolic"
                    dataKey="diastolic"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#diaColor)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </>
              )}

              {selectedMetric === 'hr' && (
                <Area
                  type="monotone"
                  name="Pulse Rate"
                  dataKey="heartRate"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#hrColor)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}

              {selectedMetric === 'temp' && (
                <Area
                  type="monotone"
                  name="Body Temperature"
                  dataKey="temperature"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tempColor)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
