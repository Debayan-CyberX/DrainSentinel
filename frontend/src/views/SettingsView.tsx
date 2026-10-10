import React, { useState } from 'react';
import { Server, Save, Check } from 'lucide-react';

interface SettingsViewProps {
  backendStatus: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ backendStatus }) => {
  const [siltThreshold, setSiltThreshold] = useState<number>(70);
  const [velocityThreshold, setVelocityThreshold] = useState<number>(0.25);
  const [departmentName, setDepartmentName] = useState<string>(
    'Brihanmumbai Municipal Corporation (BMC) - Stormwater Drains (SWD) Dept'
  );
  const [jurisdiction, setJurisdiction] = useState<string>(
    'Greater Mumbai Metropolitan Region (Island City & Suburban Wards)'
  );
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          Platform Configuration & Telemetry Thresholds
        </h1>
        <p className="text-xs text-slate-500">
          Calibrate Mumbai monsoon triage sensitivities, sensor calibration ranges, and dispatch routing parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sensor Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">
            Acoustic Silt & Hydraulic Velocity Alarms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Critical Silt Alarm Threshold ({siltThreshold}%)
              </label>
              <input
                type="range"
                min="40"
                max="90"
                value={siltThreshold}
                onChange={(e) => setSiltThreshold(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Drains with silt exceeding this percentage trigger automated Priority 1 work orders.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Stagnation Velocity Alarm ({velocityThreshold} m/s)
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={velocityThreshold}
                onChange={(e) => setVelocityThreshold(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Inflow velocity dropping below this baseline indicates a downstream culvert choke.
              </span>
            </div>
          </div>
        </div>

        {/* Municipality Profile */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800">
            Municipal Entity & Jurisdiction
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Operating Municipal Department
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Administrative Jurisdiction
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Backend Connectivity Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800">
                FastAPI Microservice Communication
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active local endpoints: <code className="text-slate-700 font-mono">/api/v1/drains</code>, <code className="text-slate-700 font-mono">/api/v1/reports</code>, <code className="text-slate-700 font-mono">/api/v1/tasks</code>
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              backendStatus === 'operational'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {backendStatus === 'operational' ? 'Connected (200 OK)' : 'Offline / Reconnecting'}
          </span>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 items-center">
          {saved && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Threshold parameters saved</span>
            </span>
          )}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
