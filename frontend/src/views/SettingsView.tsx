import React, { useState } from 'react';
import { Server, Save, Check, Database, ShieldCheck, Radio, Cloud, Lock, Droplets } from 'lucide-react';

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
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="nature-card p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
            Platform Stewardship
          </span>
        </div>
        <h1 className="text-base font-medium text-white tracking-wide">
          Thresholds of Care & Sensing Parameters
        </h1>
        <p className="text-xs text-[#a4aca0] font-light mt-0.5">
          Calibrating sediment tolerances, water velocity baselines, and cloud storage infrastructure
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Sensor Thresholds */}
        <div className="nature-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Radio className="w-4 h-4 text-[#86efac]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-white font-medium">
              Acoustic Sediment & Water Velocity Baselines
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className="text-[#eef3e7]">
                  Sediment Warning Baseline
                </label>
                <span className="text-rose-400 font-medium">
                  {siltThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                value={siltThreshold}
                onChange={(e) => setSiltThreshold(Number(e.target.value))}
                className="w-full accent-[#86efac] bg-[#242720]"
              />
              <span className="text-[11px] text-[#a4aca0] mt-1.5 block font-light">
                Waterways with acoustic sediment exceeding this threshold trigger automated field stewardship orders.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 font-mono">
                <label className="text-[#eef3e7]">
                  Stagnation Velocity Baseline
                </label>
                <span className="text-amber-400 font-medium">
                  {velocityThreshold} m/s
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={velocityThreshold}
                onChange={(e) => setVelocityThreshold(Number(e.target.value))}
                className="w-full accent-[#86efac] bg-[#242720]"
              />
              <span className="text-[11px] text-[#a4aca0] mt-1.5 block font-light">
                Inflow velocity dropping below this baseline indicates an acute downstream culvert obstruction.
              </span>
            </div>
          </div>
        </div>

        {/* AWS Cloud Architecture Telemetry */}
        <div className="nature-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Cloud className="w-4 h-4 text-[#86efac]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-white font-medium">
              Cloud Infrastructure & Field Synchronisation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#242720] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#a4aca0] uppercase">API Dispatch Engine</div>
                <div className="text-white font-medium mt-0.5">AWS Lambda (ap-south-1)</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#242720] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#a4aca0] uppercase">Catchment Tables</div>
                <div className="text-white font-medium mt-0.5">4 Production Tables</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                SYNCHRONIZED
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#242720] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#a4aca0] uppercase">Media Vault</div>
                <div className="text-white font-medium mt-0.5">drainsentinel-photos</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                VAULT SECURE
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#242720] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#a4aca0] uppercase">Stewardship Alerts</div>
                <div className="text-white font-medium mt-0.5">DrainSentinel-Alerts</div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                READY
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 pill-button rounded-full text-xs font-medium cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-[#23261f]" />
                <span>Parameters Saved</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#23261f]" />
                <span>Save Parameters</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
