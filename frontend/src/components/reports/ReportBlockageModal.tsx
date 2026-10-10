import React, { useState } from 'react';
import { X, Droplets, Send, CheckCircle2, Info, Camera, MapPin, AlertCircle } from 'lucide-react';
import { Drain, CitizenReport, ReportCreate } from '../../types';
import { submitReport } from '../../services/api';

interface ReportBlockageModalProps {
  isOpen: boolean;
  onClose: () => void;
  drains: Drain[];
  initialDrain?: Drain | null;
  onReportSubmitted: (report: CitizenReport) => void;
}

export const ReportBlockageModal: React.FC<ReportBlockageModalProps> = ({
  isOpen,
  onClose,
  drains,
  initialDrain,
  onReportSubmitted,
}) => {
  const [selectedDrainId, setSelectedDrainId] = useState<string>(
    initialDrain ? initialDrain.id : ''
  );
  const [address, setAddress] = useState<string>(
    initialDrain ? initialDrain.location.address : ''
  );
  const [issueType, setIssueType] = useState<string>('Silt Accumulation');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('Municipal Reporter');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<CitizenReport | null>(null);

  if (!isOpen) return null;

  const handleDrainSelect = (drainId: string) => {
    setSelectedDrainId(drainId);
    const found = drains.find((d) => d.id === drainId);
    if (found) {
      setAddress(found.location.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const targetDrain = drains.find((d) => d.id === selectedDrainId);
      const lat = targetDrain ? targetDrain.location.lat : 19.0142;
      const lng = targetDrain ? targetDrain.location.lng : 72.8423;
      const ward = targetDrain ? targetDrain.location.ward : 'Ward F-South (Parel)';

      const payload: ReportCreate = {
        drain_id: selectedDrainId || undefined,
        location: {
          lat,
          lng,
          address: address || (targetDrain ? targetDrain.location.address : 'Stormwater Drain Mainline'),
          ward,
        },
        issue_type: issueType,
        severity,
        description,
        photo_url: photoUrl.trim() || undefined,
        reporter_name: reporterName.trim() || 'Municipal Field Reporter',
        is_citizen: true,
      };

      const result = await submitReport(payload);
      setSubmissionResult(result);
      onReportSubmitted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmissionResult(null);
    setDescription('');
    setPhotoUrl('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#242720]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_80px_rgba(10,18,12,0.9)] border border-white/10 max-w-lg w-full overflow-hidden text-[#eef3e7] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#1b1d19]/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 text-[#86efac] rounded-xl border border-white/10">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#86efac]">
                  Community Ground Telemetry &bull; Catchment Care
                </span>
              </div>
              <h2 className="text-sm font-medium text-white uppercase tracking-wide">
                Report a Waterway Obstruction
              </h2>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full text-[#a4aca0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {submissionResult ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_20px_rgba(74,222,128,0.2)]">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-medium text-white">
                Observation Logged Successfully
              </h3>
              <div className="mt-2 font-mono text-xs font-medium text-[#86efac] bg-white/5 py-1 px-3 rounded-full border border-white/10 inline-block">
                Report ID: {submissionResult.id}
              </div>
            </div>

            {submissionResult.is_duplicate && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-left text-xs text-amber-300 flex items-start gap-2.5 font-mono">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase text-amber-200">Corroborating Note Attached:</span>
                  This location matches an active pending observation (
                  <span className="text-white font-medium">{submissionResult.duplicate_of}</span>
                  ). Corroborating evidence attached to increase confidence score.
                </div>
              </div>
            )}

            <div className="p-3.5 bg-[#1b1d19] rounded-xl border border-white/10 text-left text-xs font-mono space-y-2 text-[#d5dbc9]">
              <div className="flex justify-between">
                <span className="text-[#a4aca0]">Verification Status:</span>
                <span className="font-medium text-white uppercase">
                  {submissionResult.status} (Audit Pending)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#a4aca0]">Observed Severity:</span>
                <span className="font-medium text-[#86efac] uppercase">
                  {submissionResult.severity}
                </span>
              </div>
              {submissionResult.linked_task_id && (
                <div className="flex justify-between text-white">
                  <span className="text-[#a4aca0]">Care Order Dispatched:</span>
                  <span className="font-medium text-[#86efac]">{submissionResult.linked_task_id}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 pill-button rounded-full text-xs font-medium tracking-wider uppercase cursor-pointer"
            >
              Done & Return to Catchments
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-mono">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Drain or Enter Location */}
            <div>
              <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                Waterway / Channel (Optional / Nearest):
              </label>
              <select
                value={selectedDrainId}
                onChange={(e) => handleDrainSelect(e.target.value)}
                className="w-full bg-[#1b1d19] border border-white/10 rounded-full px-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 transition-colors"
              >
                <option value="" className="bg-[#242720]">-- Auto-detect from coordinates --</option>
                {drains.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#242720]">
                    {d.id} &bull; {d.name} ({d.location.ward})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                Location / Catchment Address:
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#a4aca0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Hindmata junction or Milan subway dip"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#1b1d19] border border-white/10 rounded-full pl-8 pr-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] transition-colors font-light"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                  Observed Obstruction:
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-[#1b1d19] border border-white/10 rounded-full px-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 transition-colors"
                >
                  <option value="Silt Accumulation" className="bg-[#242720]">Sediment Accumulation</option>
                  <option value="Plastic & Trash Choke" className="bg-[#242720]">Plastic & Litter Choke</option>
                  <option value="Broken / Missing Grate" className="bg-[#242720]">Broken / Missing Grate</option>
                  <option value="Water Stagnation / Sag" className="bg-[#242720]">Water Stagnation</option>
                  <option value="Construction Debris Inflow" className="bg-[#242720]">Construction Debris</option>
                  <option value="Tree Root Obstruction" className="bg-[#242720]">Tree Root Obstruction</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                  Observed Severity:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-[#1b1d19] border border-white/10 rounded-full px-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 transition-colors"
                >
                  <option value="critical" className="bg-[#242720]">Critical (Overtopping / Inundation Risk)</option>
                  <option value="high" className="bg-[#242720]">High (&gt;70% Capacity Choked)</option>
                  <option value="medium" className="bg-[#242720]">Moderate (Sluggish Flow)</option>
                  <option value="low" className="bg-[#242720]">Low (Surface Litter)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                Field Observations & Context:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe standing water depth, plastic accumulation, water clarity, or overflow..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#1b1d19] border border-white/10 rounded-xl p-2.5 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] resize-none transition-colors font-light"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                  Photo Evidence URL:
                </label>
                <div className="relative">
                  <Camera className="w-3.5 h-3.5 text-[#a4aca0] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-[#1b1d19] border border-white/10 rounded-full pl-8 pr-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] transition-colors font-light"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-medium text-[#d5dbc9] mb-1.5">
                  Your Name / Organization:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward Resident / Community Steward"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-[#1b1d19] border border-white/10 rounded-full px-3 py-2 text-xs text-[#eef3e7] focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] transition-colors font-light"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-white/10 hover:border-white/20 text-[#a4aca0] hover:text-white rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || description.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-5 py-2 pill-button rounded-full text-xs uppercase tracking-wider font-medium cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5 text-[#23261f]" />
                <span>{isSubmitting ? 'Transmitting...' : 'Submit Observation'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
