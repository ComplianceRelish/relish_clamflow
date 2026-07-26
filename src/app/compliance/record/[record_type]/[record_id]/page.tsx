'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import clamflowAPI from '../../../../../lib/clamflow-api';
import { ComplianceComment, NCRRecord, NCRStatus } from '../../../../../types/compliance';

function StatusBadge({ status }: { status: NCRStatus }) {
  const colors: Record<NCRStatus, string> = {
    DRAFT_NCR:          'bg-amber-100 text-amber-800',
    CONFIRMED_NCR:      'bg-orange-100 text-orange-800',
    ACTION_DISPATCHED:  'bg-blue-100 text-blue-800',
    EVIDENCE_SUBMITTED: 'bg-purple-100 text-purple-800',
    RESOLVED:           'bg-green-100 text-green-800',
    OVERDUE:            'bg-red-100 text-red-700 animate-pulse',
    BREACH:             'bg-red-200 text-red-900 animate-pulse font-bold',
    CLARIFICATION:      'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function RelatedRecordsNav({ record }: { record: any }) {
  const router = useRouter();
  const lotId: string = record.id;

  const [related, setRelated] = useState<{
    weightNotes: any[];
    depurationForms: any[];
    ppcForms: any[];
    fpForms: any[];
  }>({ weightNotes: [], depurationForms: [], ppcForms: [], fpForms: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [wn, ppc, fp, dep] = await Promise.allSettled([
        clamflowAPI.getWeightNotes(lotId),
        clamflowAPI.getPPCForms(lotId),
        clamflowAPI.getFPForms(lotId),
        clamflowAPI.getDepurationForms(lotId),
      ]);
      setRelated({
        weightNotes: wn.status === 'fulfilled'
          ? (Array.isArray(wn.value) ? wn.value : (wn.value as any)?.notes || (wn.value as any)?.data || [])
          : [],
        ppcForms: ppc.status === 'fulfilled'
          ? (Array.isArray(ppc.value) ? ppc.value : (ppc.value as any)?.forms || (ppc.value as any)?.data || [])
          : [],
        fpForms: fp.status === 'fulfilled'
          ? (Array.isArray(fp.value) ? fp.value : (fp.value as any)?.forms || (fp.value as any)?.data || [])
          : [],
        depurationForms: dep.status === 'fulfilled'
          ? (Array.isArray(dep.value) ? dep.value : (dep.value as any)?.forms || (dep.value as any)?.data || [])
          : [],
      });
      setLoading(false);
    };
    fetchAll();
  }, [lotId]);

  const sections = [
    {
      label: 'Weight Notes',
      icon: '⚖️',
      type: 'weight_notes',
      records: related.weightNotes,
      labelField: (r: any) =>
        r.noteNumber || r.note_number || r.id?.substring(0, 8),
      subField: (r: any) =>
        r.status ? `Status: ${r.status}` : null,
    },
    {
      label: 'Depuration Log (CCP2)',
      icon: '💧',
      type: 'depuration_forms',
      records: related.depurationForms,
      labelField: (r: any) =>
        r.tankNumber || r.tank_number ||
        r.sampleExtractionId?.substring(0, 8) ||
        r.id?.substring(0, 8),
      subField: (r: any) =>
        r.status === 'approved' ? 'Approved ✓' :
        r.status === 'pending'  ? 'Pending QC' :
        r.status || null,
    },
    {
      label: 'PPC Processing',
      icon: '🦪',
      type: 'ppc_forms',
      records: related.ppcForms,
      labelField: (r: any) =>
        r.formNumber || r.form_number || r.batchCode || r.id?.substring(0, 8),
      subField: (r: any) =>
        r.status ? `Status: ${r.status}` : null,
    },
    {
      label: 'Freezing Plant (CCP5/6/7)',
      icon: '❄️',
      type: 'fp_forms',
      records: related.fpForms,
      labelField: (r: any) =>
        r.formNumber || r.form_number || r.batchCode || r.id?.substring(0, 8),
      subField: (r: any) =>
        r.status ? `Status: ${r.status}` : null,
    },
  ];

  const hasAny = sections.some(s => s.records.length > 0);

  if (loading) return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">Loading linked records…</p>
    </div>
  );

  if (!hasAny) return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        No linked production records yet — records are created as the
        lot progresses through each processing stage.
      </p>
    </div>
  );

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
        Linked Production Records
      </p>
      <div className="space-y-3">
        {sections.map(section => (
          section.records.length > 0 && (
            <div key={section.type}>
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </p>
              <div className="space-y-1">
                {section.records.map((rec: any) => {
                  const id = rec.id || rec.formId;
                  const label = section.labelField(rec);
                  const sub = section.subField(rec);
                  return (
                    <button
                      key={id}
                      onClick={() => id && router.push(
                        `/compliance/record/${section.type}/${id}`
                      )}
                      className="w-full text-left flex items-center gap-2 px-3 py-2
                        rounded-lg border border-gray-200 hover:border-[#8B5CF6]
                        hover:bg-purple-50 transition-colors min-h-[44px] text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[#8B5CF6] font-medium truncate">{label}</p>
                        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
                      </div>
                      <span className="ml-auto text-gray-400 text-xs shrink-0">View →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default function RecordDetailPage({
  params,
}: {
  params: { record_type: string; record_id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [comments, setComments] = useState<ComplianceComment[]>([]);
  const [ncr, setNcr] = useState<NCRRecord | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const isEIA = user?.role === 'EIA Officer';

  const loadComments = useCallback(async () => {
    try {
      const res = await clamflowAPI.getCommentsForRecord(params.record_type, params.record_id);
      const list = Array.isArray(res) ? res : [];
      setComments(list);
      if (list.length > 0 && (list[0] as any).ncr?.id) {
        const ncrRes = await clamflowAPI.getNCR((list[0] as any).ncr.id);
        setNcr(ncrRes as NCRRecord);
      }
    } catch (e) { console.error(e); }
  }, [params.record_type, params.record_id]);

  const loadRecord = useCallback(async () => {
    try {
      let res: any;
      const id = params.record_id;
      if (params.record_type === 'lots') res = await clamflowAPI.getLot(id);
      else if (params.record_type === 'weight_notes') res = await clamflowAPI.getWeightNote(id);
      else if (params.record_type === 'ppc_forms') res = await clamflowAPI.getPPCForm(id);
      else if (params.record_type === 'fp_forms') res = await clamflowAPI.getFPForm(id);
      else if (params.record_type === 'depuration_forms') res = await clamflowAPI.getDepurationForm(id);
      if (res) setRecord(res);
    } catch (e) { console.error(e); }
  }, [params.record_type, params.record_id]);

  useEffect(() => {
    Promise.all([loadRecord(), loadComments()]).finally(() => setLoading(false));
  }, [loadRecord, loadComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await clamflowAPI.submitEIAComment({
        record_type: params.record_type,
        record_id: params.record_id,
        comment_text: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
    } catch {
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading record…</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-[#8B5CF6] hover:underline flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Record detail (read-only) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 capitalize text-sm">
              {params.record_type.replace(/_/g, ' ')} — Detail
            </h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Read Only</span>
          </div>
          {record ? (
            <dl className="divide-y divide-gray-100 text-sm">
              {Object.entries(record)
                .filter(([k]) => !['id', 'createdBy', 'updatedAt'].includes(k))
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 py-2.5 gap-4">
                    <dt className="text-xs text-gray-500 uppercase tracking-wide self-start pt-0.5">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                    </dt>
                    <dd className="text-gray-800 break-words">
                      {value === null || value === undefined
                        ? <span className="text-gray-300">—</span>
                        : typeof value === 'boolean'
                          ? (
                            <span className={value ? 'text-green-600 font-medium' : 'text-red-500'}>
                              {value ? '✓ Yes' : '✗ No'}
                            </span>
                          )
                          : typeof value === 'object'
                            ? (
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            )
                            : (() => {
                                // Detect ISO date strings and format them for display
                                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                                  return new Date(value).toLocaleString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit', hour12: true
                                  });
                                }
                                return String(value);
                              })()}
                    </dd>
                  </div>
                ))}
            </dl>
            {params.record_type === 'lots' && record && (
              <RelatedRecordsNav record={record} />
            )}
          ) : (
            <p className="text-gray-400 text-sm">Record not found or access denied.</p>
          )}
        </div>

        {/* Comment thread + NCR panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 text-sm mb-3">EIA Comments</h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {comments.length === 0 && (
                <p className="text-gray-400 text-xs">No comments on this record.</p>
              )}
              {comments.map(c => (
                <div key={c.id} className="border-l-2 border-[#8B5CF6] pl-3 py-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-[#8B5CF6]">EIA Officer</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.commentTime).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      c.status === 'OPEN'     ? 'bg-amber-100 text-amber-700' :
                                                'bg-gray-100 text-gray-500'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.commentText}</p>
                </div>
              ))}
            </div>

            {isEIA && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-amber-600 mb-2 leading-relaxed">
                  ⚠ Submitting creates a draft NCR. QC Lead must classify within 24 hours.
                </p>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Enter your observation or concern…"
                  className="w-full text-sm border border-gray-300 rounded-lg p-3 min-h-[80px]
                    resize-none focus:outline-none focus:border-[#8B5CF6] focus:ring-1
                    focus:ring-[#8B5CF6]/30"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="mt-2 w-full bg-[#8B5CF6] text-white text-sm py-2.5 rounded-lg
                    font-medium disabled:opacity-40 hover:bg-[#7C3AED] transition-colors
                    min-h-[44px]"
                >
                  {submitting ? 'Submitting…' : 'Submit Comment'}
                </button>
              </div>
            )}
          </div>

          {/* NCR status panel */}
          {ncr && <NCRPanel ncr={ncr} user={user} onRefresh={loadComments} />}
        </div>
      </div>
    </div>
  );
}

function NCRPanel({
  ncr,
  user,
  onRefresh,
}: {
  ncr: NCRRecord;
  user: any;
  onRefresh: () => void;
}) {
  const [showClassify, setShowClassify] = useState(false);
  const [showDispatch, setShowDispatch] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [localNcr, setLocalNcr] = useState(ncr);
  const isQCOrAdmin = ['QC Lead', 'Admin', 'Super Admin'].includes(user?.role || '');

  const refresh = async () => {
    try {
      const updated = await clamflowAPI.getNCR(ncr.id);
      setLocalNcr(updated as NCRRecord);
      onRefresh();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800 text-sm">NCR Status</h3>
        <span className="font-mono text-xs text-[#8B5CF6]">{localNcr.ncrNumber}</span>
      </div>

      {['OVERDUE', 'BREACH'].includes(localNcr.status) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-red-700 text-xs font-bold">
            {localNcr.status === 'BREACH'
              ? '🚨 BREACH — 48 h action deadline missed'
              : '⚠ OVERDUE — 24 h classify deadline missed'}
          </p>
        </div>
      )}

      <StatusBadge status={localNcr.status} />
      {localNcr.hoursRemaining !== undefined && localNcr.hoursRemaining > 0 && (
        <p className={`text-xs mt-1 ${localNcr.hoursRemaining < 6 ? 'text-red-500 font-semibold' : 'text-amber-600'}`}>
          {localNcr.hoursRemaining}h remaining
        </p>
      )}

      <div className="mt-4 space-y-2">
        {isQCOrAdmin && localNcr.status === 'DRAFT_NCR' && !showClassify && (
          <button
            onClick={() => setShowClassify(true)}
            className="w-full bg-[#8B5CF6] text-white text-sm py-2 rounded-lg min-h-[44px]"
          >
            Classify NCR
          </button>
        )}
        {isQCOrAdmin && showClassify && (
          <ClassifyForm ncrId={localNcr.id} onDone={() => { setShowClassify(false); refresh(); }} />
        )}

        {isQCOrAdmin && localNcr.status === 'CONFIRMED_NCR' && !showDispatch && (
          <button
            onClick={() => setShowDispatch(true)}
            className="w-full bg-[#F97316] text-white text-sm py-2 rounded-lg min-h-[44px]"
          >
            Dispatch Corrective Action
          </button>
        )}
        {isQCOrAdmin && showDispatch && (
          <DispatchForm ncrId={localNcr.id} onDone={() => { setShowDispatch(false); refresh(); }} />
        )}

        {localNcr.status === 'ACTION_DISPATCHED' && !showEvidence &&
         user?.role !== 'EIA Officer' && (
          <button
            onClick={() => setShowEvidence(true)}
            className="w-full border border-[#8B5CF6] text-[#8B5CF6] text-sm py-2 rounded-lg min-h-[44px]"
          >
            Submit Evidence
          </button>
        )}
        {showEvidence && (
          <EvidenceForm ncrId={localNcr.id} onDone={() => { setShowEvidence(false); refresh(); }} />
        )}

        {isQCOrAdmin && localNcr.status === 'EVIDENCE_SUBMITTED' && (
          <button
            onClick={async () => {
              await clamflowAPI.closeNCR(localNcr.id);
              refresh();
            }}
            className="w-full bg-[#10B981] text-white text-sm py-2 rounded-lg min-h-[44px]"
          >
            Verify &amp; Close NCR
          </button>
        )}
      </div>

      {localNcr.correctiveInstruction && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Corrective Instruction</p>
          <p className="text-sm text-gray-700">{localNcr.correctiveInstruction}</p>
        </div>
      )}
    </div>
  );
}

function ClassifyForm({ ncrId, onDone }: { ncrId: string; onDone: () => void }) {
  const [decision, setDecision] = useState<'CONFIRMED_NCR' | 'CLARIFICATION'>('CONFIRMED_NCR');
  const [severity, setSeverity] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MINOR');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await clamflowAPI.classifyNCR(ncrId, {
        decision,
        severity: decision === 'CONFIRMED_NCR' ? severity : undefined,
        description,
      });
      onDone();
    } catch {
      alert('Classification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
      <select
        value={decision}
        onChange={e => setDecision(e.target.value as 'CONFIRMED_NCR' | 'CLARIFICATION')}
        className="w-full text-sm border border-gray-300 rounded px-2 min-h-[44px]"
      >
        <option value="CONFIRMED_NCR">Confirm as NCR</option>
        <option value="CLARIFICATION">Clarification Only</option>
      </select>
      {decision === 'CONFIRMED_NCR' && (
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value as 'MINOR' | 'MAJOR' | 'CRITICAL')}
          className="w-full text-sm border border-gray-300 rounded px-2 min-h-[44px]"
        >
          <option value="MINOR">MINOR</option>
          <option value="MAJOR">MAJOR</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      )}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full text-sm border border-gray-300 rounded p-2 resize-none min-h-[60px]"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 bg-[#8B5CF6] text-white text-sm py-2 rounded min-h-[44px] disabled:opacity-40"
        >
          {submitting ? 'Saving…' : 'Confirm'}
        </button>
        <button
          onClick={onDone}
          className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DispatchForm({ ncrId, onDone }: { ncrId: string; onDone: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [instruction, setInstruction] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    clamflowAPI.getUsersList().then((res: any) => {
      const list = Array.isArray(res) ? res : res?.users || [];
      setUsers(list);
    }).catch(console.error);
  }, []);

  const submit = async () => {
    if (!assigneeId || !instruction || !dueDate) { alert('All fields required'); return; }
    setSubmitting(true);
    try {
      await clamflowAPI.dispatchCorrectiveAction(ncrId, {
        assignee_id: assigneeId,
        corrective_instruction: instruction,
        assignee_due_date: new Date(dueDate).toISOString(),
      });
      onDone();
    } catch {
      alert('Dispatch failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
      <select
        value={assigneeId}
        onChange={e => setAssigneeId(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 min-h-[44px]"
      >
        <option value="">Select staff member…</option>
        {users.map((u: any) => (
          <option key={u.id} value={u.id}>{u.fullName || u.full_name} ({u.role})</option>
        ))}
      </select>
      <textarea
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        placeholder="Describe the corrective action required…"
        className="w-full text-sm border border-gray-300 rounded p-2 resize-none min-h-[80px]"
      />
      <input
        type="datetime-local"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded px-2 min-h-[44px]"
      />
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="flex-1 bg-[#F97316] text-white text-sm py-2 rounded min-h-[44px] disabled:opacity-40"
        >
          {submitting ? 'Sending…' : 'Dispatch'}
        </button>
        <button
          onClick={onDone}
          className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EvidenceForm({ ncrId, onDone }: { ncrId: string; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      let evidenceUrl = url;
      if (file) {
        const res = await clamflowAPI.uploadEvidenceFile(ncrId, file);
        evidenceUrl = res.evidence_url;
      }
      if (!evidenceUrl) { alert('Provide a file or URL.'); return; }
      await clamflowAPI.submitEvidenceUrl(ncrId, evidenceUrl);
      onDone();
    } catch {
      alert('Evidence submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-3">
      <div>
        <label className="text-xs text-gray-600 block mb-1">Upload file (PDF/JPEG/PNG)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-gray-600 block mb-1">— or — paste a URL</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="w-full text-sm border border-gray-300 rounded px-2 min-h-[44px]"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting || (!file && !url)}
          className="flex-1 bg-[#8B5CF6] text-white text-sm py-2 rounded min-h-[44px] disabled:opacity-40"
        >
          {submitting ? 'Uploading…' : 'Submit Evidence'}
        </button>
        <button
          onClick={onDone}
          className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded min-h-[44px]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
