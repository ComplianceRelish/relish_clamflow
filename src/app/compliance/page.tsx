'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import clamflowAPI from '../../lib/clamflow-api';
import { NCRRecord, NCRStatus } from '../../types/compliance';
import { ShieldCheck } from 'lucide-react';

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, hours }: { status: NCRStatus; hours?: number }) {
  const cfg: Record<NCRStatus, { cls: string; label: string }> = {
    DRAFT_NCR:          { cls: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Draft NCR' },
    CONFIRMED_NCR:      { cls: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Confirmed' },
    ACTION_DISPATCHED:  { cls: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Action Sent' },
    EVIDENCE_SUBMITTED: { cls: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Evidence In' },
    RESOLVED:           { cls: 'bg-green-100 text-green-800 border-green-300', label: 'Resolved' },
    OVERDUE:            { cls: 'bg-red-100 text-red-700 border-red-400 animate-pulse', label: 'OVERDUE' },
    BREACH:             { cls: 'bg-red-200 text-red-900 border-red-500 animate-pulse font-bold', label: 'BREACH' },
    CLARIFICATION:      { cls: 'bg-gray-100 text-gray-600 border-gray-300', label: 'Clarification' },
  };
  const { cls, label } = cfg[status] || { cls: 'bg-gray-100 text-gray-500', label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${cls}`}>
      {label}
      {hours !== undefined && hours > 0 &&
        !['RESOLVED', 'CLARIFICATION', 'BREACH', 'OVERDUE'].includes(status) && (
        <span className="opacity-70">({hours}h)</span>
      )}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const RECORD_TYPES = [
  { value: 'lots',             label: 'Lots',           icon: '📦' },
  { value: 'weight_notes',     label: 'Weight Notes',   icon: '⚖️' },
  { value: 'ppc_forms',        label: 'PPC Processing', icon: '🦪' },
  { value: 'fp_forms',         label: 'Freezing Plant', icon: '❄️' },
  { value: 'depuration_forms', label: 'Depuration',     icon: '💧' },
] as const;

function RecordTypeList({
  recordType,
  onNavigate
}: {
  recordType: string;
  onNavigate: (type: string, id: string) => void;
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fetch = async () => {
      try {
        let res: any;
        if (recordType === 'lots') {
          res = await clamflowAPI.getLots();
          const arr = Array.isArray(res) ? res : res?.lots || res?.data || [];
          setRecords(arr);
        } else if (recordType === 'weight_notes') {
          res = await clamflowAPI.getWeightNotes?.();
          const arr = Array.isArray(res) ? res : res?.notes || res?.data || [];
          setRecords(arr);
        } else if (recordType === 'ppc_forms') {
          res = await clamflowAPI.getPPCForms?.();
          const arr = Array.isArray(res) ? res : res?.forms || res?.data || [];
          setRecords(arr);
        } else if (recordType === 'fp_forms') {
          res = await clamflowAPI.getFPForms?.();
          const arr = Array.isArray(res) ? res : res?.forms || res?.data || [];
          setRecords(arr);
        } else if (recordType === 'depuration_forms') {
          res = await clamflowAPI.getDepurationForms?.();
          const arr = Array.isArray(res) ? res : res?.forms || res?.data || [];
          setRecords(arr);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load records');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [recordType]);

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8
      text-center text-gray-400 text-sm">
      Loading…
    </div>
  );

  if (error) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8
      text-center text-red-400 text-sm">
      {error}
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {records.length} record{records.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="divide-y divide-gray-100">
        {records.length === 0 && (
          <p className="p-8 text-center text-gray-400 text-sm">
            No records found for this category.
          </p>
        )}
        {records.map((rec: any) => {
          const id = rec.id || rec.lotId || rec.formId || rec.noteId;
          const label =
            rec.lotNumber || rec.lot_number ||
            rec.noteNumber || rec.note_number ||
            rec.formNumber || rec.form_number ||
            rec.batchCode || rec.batch_code ||
            id?.substring(0, 8) + '…';
          const sub =
            rec.status
              ? `Status: ${rec.status}`
              : rec.lotId
              ? `Lot: ${rec.lotId?.substring(0, 8)}…`
              : '';
          const date = rec.createdAt || rec.created_at || rec.arrivalDate;

          return (
            <div
              key={id}
              onClick={() => id && onNavigate(recordType, id)}
              className="flex items-center justify-between px-4 py-3
                hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <p className="font-medium text-[#8B5CF6] text-sm">{label}</p>
                {sub && (
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {date && (
                  <span className="text-xs text-gray-400">
                    {new Date(date).toLocaleDateString('en-IN')}
                  </span>
                )}
                <span className="text-[#8B5CF6] text-xs">View →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'records' | 'ncr'>('records');
  const [lots, setLots] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<NCRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordType, setRecordType] = useState<
    'lots' | 'weight_notes' | 'ppc_forms' | 'fp_forms' | 'depuration_forms'
  >('lots');
  const [typeRecords, setTypeRecords] = useState<any[]>([]);
  const isEIA = user?.role === 'EIA Officer';
  const isQCOrAdmin = ['QC Lead', 'Admin', 'Super Admin'].includes(user?.role || '');

  const loadData = useCallback(async () => {
    try {
      const lotsRes = await clamflowAPI.getLots();
      if (lotsRes) setLots(Array.isArray(lotsRes) ? lotsRes : (lotsRes as any).lots || []);
    } catch (e) { console.error(e); }
    if (isQCOrAdmin || isEIA) {
      try {
        const ncrRes = await clamflowAPI.listNCRs();
        setNcrs(Array.isArray(ncrRes) ? ncrRes : []);
      } catch (e) { console.error(e); }
    }
    setLoading(false);
  }, [isQCOrAdmin, isEIA]);

  useEffect(() => { loadData(); }, [loadData]);

  const priorityOrder: NCRStatus[] = [
    'BREACH', 'OVERDUE', 'DRAFT_NCR', 'CONFIRMED_NCR', 'ACTION_DISPATCHED',
    'EVIDENCE_SUBMITTED', 'CLARIFICATION', 'RESOLVED',
  ];
  const sortedNCRs = [...ncrs].sort(
    (a, b) => priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status)
  );
  const urgentCount = ncrs.filter(n => ['BREACH', 'OVERDUE', 'DRAFT_NCR'].includes(n.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      Loading compliance records…
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#8B5CF6]" />
          EIA / EIC Compliance Records
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEIA
            ? 'Select any record to view details and add observations.'
            : 'Monitor EIA comments and manage corrective actions.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('records')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'records' ? 'border-[#8B5CF6] text-[#8B5CF6]' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          Production Records
        </button>
          <button
            onClick={() => setTab('ncr')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
              tab === 'ncr' ? 'border-[#8B5CF6] text-[#8B5CF6]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            NCR Register
            {urgentCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {urgentCount}
              </span>
            )}
          </button>
      </div>

      {/* Production Records tab */}
      {tab === 'records' && (
        <>
          {/* Record type selector */}
          <div className="flex gap-2 flex-wrap mb-4">
            {RECORD_TYPES.map(rt => (
              <button
                key={rt.value}
                onClick={() => setRecordType(rt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-sm border transition-colors min-h-[36px] ${
                  recordType === rt.value
                    ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#8B5CF6]'
                }`}
              >
                <span>{rt.icon}</span>
                <span>{rt.label}</span>
              </button>
            ))}
          </div>

          {/* Record list — changes based on recordType */}
          <RecordTypeList
            recordType={recordType}
            onNavigate={(type, id) => router.push(`/compliance/record/${type}/${id}`)}
          />
        </>
      )}

      {/* NCR Register tab */}
      {tab === 'ncr' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">NCR Number</th>
                <th className="px-4 py-3 text-left">Record</th>
                <th className="px-4 py-3 text-left">Severity</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Raised</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedNCRs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No NCRs raised yet.
                  </td>
                </tr>
              )}
              {sortedNCRs.map(ncr => (
                <tr
                  key={ncr.id}
                  onClick={() => router.push(`/compliance/record/${ncr.sourceRecordType}/${ncr.sourceRecordId}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#8B5CF6]">{ncr.ncrNumber}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs capitalize">
                    {ncr.sourceRecordType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    {ncr.severity && (
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        ncr.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-300' :
                        ncr.severity === 'MAJOR'    ? 'bg-orange-100 text-orange-700 border-orange-300' :
                                                      'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }`}>{ncr.severity}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ncr.status} hours={ncr.hoursRemaining} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(ncr.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-[#8B5CF6]">Open →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
