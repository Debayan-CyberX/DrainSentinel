import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  MapPin,
  Camera,
  CheckCircle2,
  Send,
  Info,
} from 'lucide-react';
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
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>(
    'high'
  );
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<CitizenReport | null>(
    null
  );

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
      // Find drain coordinates or fallback to central Mumbai
      const targetDrain = drains.find((d) => d.id === selectedDrainId);
      const lat = targetDrain ? targetDrain.location.lat : 19.0142;
      const lng = targetDrain ? targetDrain.location.lng : 72.8423;
      const ward = targetDrain ? targetDrain.location.ward : 'Ward F-South (Parel)';

      const payload: ReportCreate = {
        drain_id: selectedDrainId || undefined,
        location: {
          lat,
          lng,
          address: address || (targetDrain ? targetDrain.location.address : 'Mumbai Stormwater Line'),
          ward,
        },
        issue_type: issueType,
        severity,
        description,
        photo_url: photoUrl.trim() || undefined,
        reporter_name: reporterName.trim() || 'Citizen Reporter (BMC 311)',
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Report Suspected Storm-Drain Blockage
              </h2>
              <p className="text-[11px] text-slate-500">
                Submit field observation to Brihanmumbai Municipal Corporation (BMC) triage
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {submissionResult ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Incident Report Filed Successfully
              </h3>
              <div className="mt-1 font-mono text-xs font-semibold text-teal-700 bg-teal-50 py-1 px-3 rounded-full inline-block border border-teal-200">
                Report ID: {submissionResult.id}
              </div>
            </div>

            {submissionResult.is_duplicate && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-left text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Potential Duplicate Flagged:</span>
                  This location matches an active pending incident (
                  <span className="font-mono">{submissionResult.duplicate_of}</span>
                  ). Your corroborating report has been linked to boost risk confidence.
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Verification Status:</span>
                <span className="font-semibold capitalize text-slate-800">
                  {submissionResult.status} (Pending BMC Audit)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Severity Tier:</span>
                <span className="font-semibold capitalize text-slate-800">
                  {submissionResult.severity}
                </span>
              </div>
              {submissionResult.linked_task_id && (
                <div className="flex justify-between text-teal-800 font-medium">
                  <span>Work Order Generated:</span>
                  <span className="font-mono">{submissionResult.linked_task_id}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Select Drain or Enter Location */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Storm-Drain Asset (Optional / Nearest):
              </label>
              <select
                value={selectedDrainId}
                onChange={(e) => handleDrainSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">-- Auto-detect from Location Coordinates --</option>
                {drains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} &bull; {d.name} ({d.location.ward})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Street Address / Mumbai Landmark:
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Hindmata Cinema flyover or Milan Subway dip"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Obstruction Issue Type:
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Silt Accumulation">Silt Accumulation</option>
                  <option value="Plastic & Trash Choke">Plastic & Trash Choke</option>
                  <option value="Broken / Missing Grate">Broken / Missing Grate</option>
                  <option value="Water Stagnation / Sag">Water Stagnation / Sag</option>
                  <option value="Construction Debris Inflow">Construction Debris Inflow</option>
                  <option value="Tree Root / Vegetative Obstruction">Tree Root Obstruction</option>
                  <option value="Structural Wall Collapse">Structural Wall Collapse</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observed Severity:
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="critical">Critical (Flooding / Road Block)</option>
                  <option value="high">High (&gt;70% Capacity Blocked)</option>
                  <option value="medium">Medium (Moderate Inflow Slowdown)</option>
                  <option value="low">Low (Surface Litter Only)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Detailed Observation:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe water accumulation depth, plastic/debris volume, odor or nearby traffic disruption..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Optional Photo URL:
                </label>
                <div className="relative">
                  <Camera className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reporter Name / Source:
                </label>
                <input
                  type="text"
                  placeholder="e.g. BMC 311 Citizen / Traffic Constable"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || description.trim().length < 5}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting to BMC...' : 'Submit Incident Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
