// src/components/hardware/DeviceRFIDWriter.tsx
// RFID Tag Writer & Programmer — for IT Staff to register, link, and verify RFID tags
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import clamflowAPI, { RFIDLinkRequest, RFIDTagResponse } from '../../lib/clamflow-api';

// ============================================
// TYPES & CONSTANTS
// ============================================

type WriterTab = 'program' | 'asset' | 'employee-badge' | 'verify' | 'batch';
type BatchType = 'product-box' | 'asset';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  rfid_tag?: string;
}

interface BatchEntry {
  id: string;
  tagId: string;
  // product-box fields
  boxNumber?: string;
  lotId?: string;
  productType?: string;
  grade?: string;
  weight?: number;
  // asset fields
  assetName?: string;
  assetId?: string;
  assetCategory?: string;
  department?: string;
  condition?: string;
  type: BatchType;
  status: 'pending' | 'success' | 'error';
  error?: string;
  result?: RFIDTagResponse;
}

interface ProgramForm {
  tagId: string;
  boxNumber: string;
  lotId: string;
  productType: string;
  grade: string;
  weight: string;
}

interface AssetForm {
  tagId: string;
  assetCategory: string;
  assetName: string;
  assetId: string;
  manufacturer: string;
  model: string;
  department: string;
  location: string;
  assignedTo: string;
  purchaseDate: string;
  condition: string;
  notes: string;
}

const PRODUCT_TYPES = ['Clam', 'Oyster', 'Mussel', 'Scallop', 'Other'];
const GRADES        = ['A', 'B', 'C', 'Premium', 'Standard', 'Export'];

const ASSET_CATEGORIES = [
  'Computer (Desktop)', 'Laptop', 'Tablet', 'Monitor / Display',
  'RFID Reader', 'RFID Writer', 'Label Printer', 'Barcode Scanner',
  'Processing Equipment', 'Quality Instrument', 'Weighing Scale',
  'Network Equipment (Router/Switch)', 'UPS / Power Supply',
  'Camera / CCTV', 'Forklift / Vehicle', 'Hand Tool', 'Furniture', 'Other',
];

const CONDITIONS  = ['New', 'Good', 'Fair', 'Poor', 'Needs Repair'];
const DEPARTMENTS = [
  'IT', 'Production', 'Quality Control', 'Administration',
  'Security', 'Maintenance', 'Logistics', 'Management',
];

// ============================================
// MAIN COMPONENT
// ============================================

const DeviceRFIDWriter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<WriterTab>('program');

  // — Program Tab —
  const [form, setForm] = useState<ProgramForm>({
    tagId: '', boxNumber: '', lotId: '', productType: '', grade: '', weight: '',
  });
  const [scanning, setScanning] = useState(false);
  const [programLoading, setProgramLoading] = useState(false);
  const [programResult, setProgramResult] = useState<RFIDTagResponse | null>(null);
  const [programError, setProgramError] = useState<string | null>(null);

  // — Asset Tab —
  const [assetForm, setAssetForm] = useState<AssetForm>({
    tagId: '', assetCategory: '', assetName: '', assetId: '',
    manufacturer: '', model: '', department: '', location: '',
    assignedTo: '', purchaseDate: '', condition: '', notes: '',
  });
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetSuccess, setAssetSuccess] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);

  // — Verify Tab —
  const [verifyTagId, setVerifyTagId] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<RFIDTagResponse | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // — Batch Tab —
  const [batchType, setBatchType] = useState<BatchType>('product-box');
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLotId, setBatchLotId] = useState('');
  const [batchProductType, setBatchProductType] = useState('');
  const [batchGrade, setBatchGrade] = useState('');
  const [batchAssetCategory, setBatchAssetCategory] = useState('');
  const [batchDepartment, setBatchDepartment] = useState('');
  const [batchCondition, setBatchCondition] = useState('Good');
  const [batchInput, setBatchInput] = useState('');

  // — Employee Badge Tab —
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [badgeTagId, setBadgeTagId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeSuccess, setBadgeSuccess] = useState<string | null>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  const scanInputRef  = useRef<HTMLInputElement>(null);
  const assetScanRef  = useRef<HTMLInputElement>(null);
  const badgeScanRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'employee-badge' || activeTab === 'asset') fetchStaff();
  }, [activeTab]);

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await clamflowAPI.get<{ items?: StaffMember[]; data?: StaffMember[] } | StaffMember[]>('/api/staff/');
      const data = res.data;
      if (Array.isArray(data)) setStaffList(data);
      else if (data && 'items' in data && Array.isArray(data.items)) setStaffList(data.items);
      else if (data && 'data' in data && Array.isArray(data.data)) setStaffList(data.data);
    } catch {
      // non-critical — staff list is a convenience picker
    } finally {
      setStaffLoading(false);
    }
  };

  // ── Simulate RFID hardware scan (USB HID reader injects UID as keystrokes) ──
  const simulateScan = (ref: React.RefObject<HTMLInputElement>) => {
    setScanning(true);
    ref.current?.focus();
    setTimeout(() => setScanning(false), 3000);
  };

  // ── Program a product-box RFID tag ──
  const handleProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setProgramLoading(true);
    setProgramResult(null);
    setProgramError(null);

    const payload: RFIDLinkRequest = {
      tagId: form.tagId.trim().toUpperCase(),
      boxNumber: form.boxNumber.trim(),
      lotId: form.lotId.trim(),
      productType: form.productType,
      grade: form.grade,
      weight: parseFloat(form.weight) || 0,
      staffId: user.id,
    };

    try {
      const res = await clamflowAPI.linkRFIDTag(payload);
      if (res.data) {
        setProgramResult(res.data);
        setForm({ tagId: '', boxNumber: '', lotId: '', productType: '', grade: '', weight: '' });
      } else {
        setProgramError(res.error ?? 'Unexpected response from server');
      }
    } catch (err) {
      setProgramError(err instanceof Error ? err.message : 'Failed to program RFID tag');
    } finally {
      setProgramLoading(false);
    }
  };

  // ── Register asset RFID tag ──
  const handleAssetRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssetLoading(true); setAssetSuccess(null); setAssetError(null);
    try {
      await clamflowAPI.post('/api/assets/rfid-register', {
        rfid_tag:       assetForm.tagId.trim().toUpperCase(),
        asset_category: assetForm.assetCategory,
        asset_name:     assetForm.assetName.trim(),
        asset_id:       assetForm.assetId.trim(),
        manufacturer:   assetForm.manufacturer.trim(),
        model:          assetForm.model.trim(),
        department:     assetForm.department,
        location:       assetForm.location.trim(),
        assigned_to:    assetForm.assignedTo || null,
        purchase_date:  assetForm.purchaseDate || null,
        condition:      assetForm.condition,
        notes:          assetForm.notes.trim(),
        registered_by:  user?.id,
      });
      setAssetSuccess(`Asset "${assetForm.assetName}" tagged: ${assetForm.tagId.toUpperCase()}`);
      setAssetForm({
        tagId: '', assetCategory: '', assetName: '', assetId: '',
        manufacturer: '', model: '', department: '', location: '',
        assignedTo: '', purchaseDate: '', condition: '', notes: '',
      });
    } catch (err) {
      setAssetError(err instanceof Error ? err.message : 'Failed to register asset');
    } finally {
      setAssetLoading(false);
    }
  };

  // ── Verify / read a tag ──
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTagId.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await clamflowAPI.scanRFIDTag(verifyTagId.trim().toUpperCase());
      if (res.data) setVerifyResult(res.data);
      else setVerifyError(res.error ?? 'Tag not found in system');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to read RFID tag');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Parse batch CSV / newline input ──
  const parseBatch = () => {
    const lines = batchInput.split(/[\n,;]+/).map(l => l.trim()).filter(Boolean);
    if (batchType === 'product-box') {
      if (!batchLotId.trim() || !batchProductType || !batchGrade) {
        alert('Set Lot ID, Product Type, and Grade before adding batch entries.');
        return;
      }
      const newEntries: BatchEntry[] = lines.map((line, i) => {
        const parts = line.split(/\s+/);
        return {
          id: `${Date.now()}-${i}`, type: 'product-box', status: 'pending',
          tagId: parts[0]?.toUpperCase() ?? '',
          boxNumber: parts[1] ?? `BOX-${String(i + 1).padStart(3, '0')}`,
          lotId: batchLotId.trim(), productType: batchProductType, grade: batchGrade,
          weight: parseFloat(parts[2] ?? '') || 0,
        };
      });
      setBatchEntries(prev => [...prev, ...newEntries]);
    } else {
      if (!batchAssetCategory || !batchDepartment) {
        alert('Set Asset Category and Department before adding batch entries.');
        return;
      }
      const newEntries: BatchEntry[] = lines.map((line, i) => {
        const parts = line.split(/\t|\s{2,}/);
        return {
          id: `${Date.now()}-${i}`, type: 'asset', status: 'pending',
          tagId: parts[0]?.toUpperCase() ?? '',
          assetName: parts[1] ?? `Asset-${i + 1}`,
          assetId: parts[2] ?? '',
          assetCategory: batchAssetCategory, department: batchDepartment, condition: batchCondition,
        };
      });
      setBatchEntries(prev => [...prev, ...newEntries]);
    }
    setBatchInput('');
  };

  const removeBatchEntry = (id: string) =>
    setBatchEntries(prev => prev.filter(e => e.id !== id));

  const runBatch = async () => {
    if (!user?.id || batchEntries.length === 0) return;
    setBatchRunning(true);
    for (const entry of batchEntries) {
      if (entry.status !== 'pending') continue;
      try {
        if (entry.type === 'product-box') {
          const res = await clamflowAPI.linkRFIDTag({
            tagId: entry.tagId, boxNumber: entry.boxNumber!, lotId: entry.lotId!,
            productType: entry.productType!, grade: entry.grade!,
            weight: entry.weight ?? 0, staffId: user.id,
          });
          setBatchEntries(prev => prev.map(e => e.id === entry.id
            ? { ...e, status: res.data ? 'success' : 'error', result: res.data ?? undefined, error: res.error ?? 'Failed' }
            : e));
        } else {
          await clamflowAPI.post('/api/assets/rfid-register', {
            rfid_tag: entry.tagId, asset_name: entry.assetName, asset_id: entry.assetId ?? '',
            asset_category: entry.assetCategory, department: entry.department,
            condition: entry.condition, registered_by: user.id,
          });
          setBatchEntries(prev => prev.map(e => e.id === entry.id ? { ...e, status: 'success' } : e));
        }
      } catch (err) {
        setBatchEntries(prev => prev.map(e => e.id === entry.id
          ? { ...e, status: 'error', error: err instanceof Error ? err.message : 'Failed' }
          : e));
      }
      await new Promise(r => setTimeout(r, 250));
    }
    setBatchRunning(false);
  };

  // ── Register staff RFID badge ──
  const handleBadgeRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBadgeLoading(true);
    setBadgeSuccess(null);
    setBadgeError(null);
    try {
      // Backend endpoint: POST /api/staff/{id}/rfid-badge  (pending backend implementation)
      // Using generic post until the endpoint is confirmed
      await clamflowAPI.post(`/api/staff/${selectedStaffId}/rfid-badge`, {
        rfid_tag: badgeTagId.trim().toUpperCase(),
        registered_by: user?.id,
      });
      const member = staffList.find(s => s.id === selectedStaffId);
      setBadgeSuccess(`RFID badge ${badgeTagId.toUpperCase()} registered for ${member?.full_name ?? selectedStaffId}`);
      setBadgeTagId('');
      setSelectedStaffId('');
      fetchStaff();
    } catch (err) {
      setBadgeError(err instanceof Error ? err.message : 'Failed to register badge');
    } finally {
      setBadgeLoading(false);
    }
  };

  // ── Helpers ──
  const batchCounts = {
    total: batchEntries.length,
    pending: batchEntries.filter(e => e.status === 'pending').length,
    done: batchEntries.filter(e => e.status === 'success').length,
    failed: batchEntries.filter(e => e.status === 'error').length,
  };

  const tabClass = (id: WriterTab) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
      activeTab === id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`;
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-5 text-white shadow-md flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <img src="/icons/rfid-icon.svg" alt="" aria-hidden className="w-7 h-7" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-2xl" aria-hidden>✍️</span>
        </div>
        <div>
          <p className="text-violet-200 text-xs font-semibold uppercase tracking-widest">IT Staff · Hardware</p>
          <h2 className="text-xl font-bold">RFID Tag Writer</h2>
          <p className="text-violet-200 text-sm">Program tags for product boxes, assets &amp; employee ID cards</p>
        </div>
        {/* Writer hardware status pill */}
        <div className="ml-auto flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          <span>USB Writer: Connect device</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
        <button className={tabClass('program')}        onClick={() => setActiveTab('program')}>📦 Product Box</button>
        <button className={tabClass('asset')}          onClick={() => setActiveTab('asset')}>🖥️ Asset Tag</button>
        <button className={tabClass('employee-badge')} onClick={() => setActiveTab('employee-badge')}>🪪 Employee ID</button>
        <button className={tabClass('verify')}         onClick={() => setActiveTab('verify')}>🔍 Verify / Read</button>
        <button className={tabClass('batch')}          onClick={() => setActiveTab('batch')}>⚡ Batch Write</button>
      </div>

      {/* ─── PROGRAM TAB ─── */}
      {activeTab === 'program' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Program Product-Box RFID Tag</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Place the blank tag on the USB RFID writer, scan or enter the UID, fill in product details, then submit.
              </p>
            </div>
            <button
              onClick={() => simulateScan(scanInputRef)}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-60 transition-colors"
            >
              {scanning ? (
                <><span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> Waiting for tag…</>
              ) : (
                <><span>📡</span> Scan UID</>
              )}
            </button>
          </div>

          <form onSubmit={handleProgram} className="p-5 space-y-5">
            {/* Tag UID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag UID <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal">(auto-filled by USB reader, or type manually)</span>
              </label>
              <input
                ref={scanInputRef}
                type="text"
                required
                value={form.tagId}
                onChange={e => setForm(f => ({ ...f, tagId: e.target.value.toUpperCase() }))}
                placeholder="e.g. A1B2C3D4E5F6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Lot ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lot ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.lotId}
                  onChange={e => setForm(f => ({ ...f, lotId: e.target.value }))}
                  placeholder="e.g. LOT-2026-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Box Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Box Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.boxNumber}
                  onChange={e => setForm(f => ({ ...f, boxNumber: e.target.value }))}
                  placeholder="e.g. BOX-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.productType}
                  onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">— Select —</option>
                  {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">— Select —</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.weight}
                  onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Error / Success */}
            {programError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>{programError}</span>
              </div>
            )}
            {programResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <span>✅</span> Tag programmed successfully
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-green-700">
                  <dt className="font-medium">Tag ID</dt>    <dd className="font-mono">{programResult.tagId}</dd>
                  <dt className="font-medium">Box</dt>        <dd>{programResult.boxNumber}</dd>
                  <dt className="font-medium">Lot</dt>        <dd>{programResult.lotId}</dd>
                  <dt className="font-medium">Grade</dt>      <dd>{programResult.grade}</dd>
                  <dt className="font-medium">Weight</dt>     <dd>{programResult.weight} kg</dd>
                  <dt className="font-medium">Status</dt>     <dd className="capitalize">{programResult.status}</dd>
                </dl>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={programLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {programLoading
                  ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Programming…</>
                  : <><span>✍️</span> Program Tag</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── ASSET TAG TAB ─── */}
      {activeTab === 'asset' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Register Asset RFID Tag</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Tag computers, laptops, tablets, equipment, instruments &amp; any physical asset for inventory tracking.
              </p>
            </div>
            <button onClick={() => simulateScan(assetScanRef)} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-60 transition-colors">
              {scanning ? <><span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> Waiting…</> : <><span>📡</span> Scan UID</>}
            </button>
          </div>
          <form onSubmit={handleAssetRegister} className="p-5 space-y-6">
            {/* Tag UID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag UID <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal">(scan blank tag or type manually)</span>
              </label>
              <input ref={assetScanRef} type="text" required value={assetForm.tagId}
                onChange={e => setAssetForm(f => ({ ...f, tagId: e.target.value.toUpperCase() }))}
                placeholder="e.g. FF00AA11BB22"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {/* Asset Identification */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
              <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asset Identification</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Category <span className="text-red-500">*</span></label>
                  <select required value={assetForm.assetCategory} onChange={e => setAssetForm(f => ({ ...f, assetCategory: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={assetForm.assetName} onChange={e => setAssetForm(f => ({ ...f, assetName: e.target.value }))}
                    placeholder="e.g. HP EliteBook 840 G9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID / Serial No. <span className="text-red-500">*</span></label>
                  <input type="text" required value={assetForm.assetId} onChange={e => setAssetForm(f => ({ ...f, assetId: e.target.value }))}
                    placeholder="SN-2024-00123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input type="text" value={assetForm.manufacturer} onChange={e => setAssetForm(f => ({ ...f, manufacturer: e.target.value }))}
                    placeholder="e.g. HP, Dell, Zebra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input type="text" value={assetForm.model} onChange={e => setAssetForm(f => ({ ...f, model: e.target.value }))}
                    placeholder="e.g. EliteBook 840 G9"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </fieldset>
            {/* Location & Assignment */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
              <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location &amp; Assignment</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                  <select required value={assetForm.department} onChange={e => setAssetForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (Building / Room)</label>
                  <input type="text" value={assetForm.location} onChange={e => setAssetForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Main Plant, Floor 2, Room 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                  {staffLoading
                    ? <div className="flex items-center gap-2 text-gray-500 text-sm py-2"><span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Loading staff…</div>
                    : <select value={assetForm.assignedTo} onChange={e => setAssetForm(f => ({ ...f, assignedTo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">— Not assigned —</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                      </select>
                  }
                </div>
              </div>
            </fieldset>
            {/* Condition & History */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
              <legend className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Condition &amp; History</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition <span className="text-red-500">*</span></label>
                  <select required value={assetForm.condition} onChange={e => setAssetForm(f => ({ ...f, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                  <input type="date" value={assetForm.purchaseDate} onChange={e => setAssetForm(f => ({ ...f, purchaseDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={2} value={assetForm.notes} onChange={e => setAssetForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Warranty info, accessories, known issues…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
            </fieldset>
            {assetError   && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2"><span>⚠️</span>{assetError}</div>}
            {assetSuccess && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex gap-2"><span>✅</span>{assetSuccess}</div>}
            <div className="flex justify-end">
              <button type="submit" disabled={assetLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm">
                {assetLoading
                  ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering…</>
                  : <><span>🖥️</span> Register Asset Tag</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── VERIFY TAB ─── */}
      {activeTab === 'verify' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Verify / Read RFID Tag</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Scan or enter a tag UID to read its programmed data from the system.
            </p>
          </div>

          <form onSubmit={handleVerify} className="p-5">
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={verifyTagId}
                onChange={e => setVerifyTagId(e.target.value.toUpperCase())}
                placeholder="Enter or scan Tag UID…"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={verifyLoading}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {verifyLoading
                  ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : '🔍'} Verify
              </button>
            </div>

            {verifyError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <span>⚠️</span>
                <span>{verifyError}</span>
              </div>
            )}
          </form>

          {verifyResult && (
            <div className="mx-5 mb-5 rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-indigo-50 px-4 py-3 flex items-center gap-3 border-b border-indigo-100">
                <span className="text-2xl">📌</span>
                <div>
                  <p className="font-semibold text-indigo-900 font-mono">{verifyResult.tagId}</p>
                  <p className="text-xs text-indigo-600 capitalize">Status: {verifyResult.status}</p>
                </div>
              </div>
              <dl className="divide-y divide-gray-100">
                {([
                  ['Box Number', verifyResult.boxNumber],
                  ['Lot ID', verifyResult.lotId],
                  ['Product Type', verifyResult.productType],
                  ['Grade', verifyResult.grade],
                  ['Weight', `${verifyResult.weight} kg`],
                  ['Linked At', verifyResult.linkedAt ? new Date(verifyResult.linkedAt).toLocaleString() : '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-2.5 text-sm">
                    <dt className="w-32 font-medium text-gray-500 shrink-0">{label}</dt>
                    <dd className="text-gray-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* ─── BATCH WRITE TAB ─── */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          {/* Batch type selector */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Batch Tag Type</h3>
            <div className="flex gap-3">
              {(['product-box', 'asset'] as BatchType[]).map(t => (
                <button key={t} type="button"
                  onClick={() => { setBatchType(t); setBatchEntries([]); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${batchType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                  {t === 'product-box' ? '📦 Product Boxes' : '🖥️ Assets'}
                </button>
              ))}
            </div>
          </div>

          {/* Batch defaults */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Batch Defaults <span className="text-xs text-gray-500 font-normal">(applied to all entries)</span></h3>
            {batchType === 'product-box' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lot ID <span className="text-red-500">*</span></label>
                  <input type="text" value={batchLotId} onChange={e => setBatchLotId(e.target.value)} placeholder="LOT-2026-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <select value={batchProductType} onChange={e => setBatchProductType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {PRODUCT_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select value={batchGrade} onChange={e => setBatchGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Category <span className="text-red-500">*</span></label>
                  <select value={batchAssetCategory} onChange={e => setBatchAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                  <select value={batchDepartment} onChange={e => setBatchDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <select value={batchCondition} onChange={e => setBatchCondition(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Batch input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tag UIDs{' '}
                <span className="text-xs text-gray-400 font-normal">
                  {batchType === 'product-box'
                    ? '(one per line — format: UID  BoxNumber  Weight)'
                    : '(one per line — format: UID  AssetName  SerialNo)'}
                </span>
              </label>
              <textarea rows={4} value={batchInput} onChange={e => setBatchInput(e.target.value)}
                placeholder={batchType === 'product-box'
                  ? 'A1B2C3D4  BOX-001  12.5\nE5F6G7H8  BOX-002  11.0'
                  : 'FF00AA11  HP EliteBook 840  SN-001\nBB22CC33  Dell OptiPlex  SN-002'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="mt-3 flex gap-3">
              <button onClick={parseBatch}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                ➕ Add to Queue
              </button>
              <button onClick={() => setBatchEntries([])}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                🗑 Clear All
              </button>
            </div>
          </div>

          {/* Queue table */}
          {batchEntries.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600">{batchCounts.total} tags</span>
                  {batchCounts.done > 0 && <span className="text-green-600 font-medium">✓ {batchCounts.done} done</span>}
                  {batchCounts.failed > 0 && <span className="text-red-600 font-medium">✗ {batchCounts.failed} failed</span>}
                  {batchCounts.pending > 0 && <span className="text-gray-500">{batchCounts.pending} pending</span>}
                </div>
                <button
                  onClick={runBatch}
                  disabled={batchRunning || batchCounts.pending === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {batchRunning
                    ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Writing…</>
                    : '▶ Run Batch Write'}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag UID</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {batchType === 'product-box' ? 'Box / Weight' : 'Asset Name / Serial'}
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {batchEntries.map(entry => (
                      <tr key={entry.id} className={entry.status === 'error' ? 'bg-red-50' : entry.status === 'success' ? 'bg-green-50' : ''}>
                        <td className="px-4 py-2.5 font-mono font-medium text-gray-900">{entry.tagId || <span className="text-red-400 italic">missing</span>}</td>
                        <td className="px-4 py-2.5 text-gray-700">
                          {entry.type === 'product-box'
                            ? <>{entry.boxNumber}{entry.weight ? <span className="ml-2 text-gray-400">{entry.weight} kg</span> : null}</>
                            : <>{entry.assetName}{entry.assetId ? <span className="ml-2 text-gray-400 font-mono text-xs">{entry.assetId}</span> : null}</>
                          }
                        </td>
                        <td className="px-4 py-2.5">
                          {entry.status === 'pending' && <span className="inline-flex items-center gap-1 text-gray-500">⏳ Pending</span>}
                          {entry.status === 'success' && <span className="inline-flex items-center gap-1 text-green-700 font-medium">✅ Written</span>}
                          {entry.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-red-700" title={entry.error}>⚠️ Error</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {entry.status !== 'success' && (
                            <button onClick={() => removeBatchEntry(entry.id)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batchEntries.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">{batchType === 'product-box' ? '📦' : '🖥️'}</p>
              <p className="text-sm">No tags in queue. Add UIDs above and click &ldquo;Add to Queue&rdquo;.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── EMPLOYEE ID TAB ─── */}
      {activeTab === 'employee-badge' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Issue Employee RFID ID Card</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Link a blank RFID card to a staff member for gate attendance &amp; station check-in.
              </p>
            </div>
            <button onClick={() => simulateScan(badgeScanRef)} disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 disabled:opacity-60 transition-colors">
              {scanning ? <><span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> Waiting…</> : <><span>📡</span> Scan UID</>}
            </button>
          </div>

          <form onSubmit={handleBadgeRegister} className="p-5 space-y-5">
            {/* Tag UID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Badge UID <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal">(scan new blank card on USB reader)</span>
              </label>
              <input
                ref={badgeScanRef}
                type="text"
                required
                value={badgeTagId}
                onChange={e => setBadgeTagId(e.target.value.toUpperCase())}
                placeholder="e.g. FF00AA11BB22"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Staff selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Staff Member <span className="text-red-500">*</span>
              </label>
              {staffLoading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Loading staff…
                </div>
              ) : (
                <select
                  required
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select staff member —</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role}){s.rfid_tag ? ' · has badge' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {badgeError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <span>⚠️</span>
                <div>
                  <p>{badgeError}</p>
                  <p className="text-xs mt-1 text-red-500">Note: Staff badge registration requires backend endpoint <code className="bg-red-100 px-1 rounded">/api/staff/&#123;id&#125;/rfid-badge</code>. Please ensure the backend has this route.</p>
                </div>
              </div>
            )}
            {badgeSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <span>✅</span> {badgeSuccess}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={badgeLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm"
              >
                {badgeLoading
                  ? <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering…</>
                  : <><span>🪪</span> Register Badge</>}
              </button>
            </div>
          </form>

          {/* Current badges list */}
          {staffList.filter(s => s.rfid_tag).length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Registered Badges
              </div>
              <ul className="divide-y divide-gray-100">
                {staffList.filter(s => s.rfid_tag).map(s => (
                  <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{s.full_name}</p>
                      <p className="text-xs text-gray-500">{s.role}</p>
                    </div>
                    <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">
                      {s.rfid_tag}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* How-it-works info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">💡 How RFID Programming Works</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-700">
          <li>Connect a USB RFID writer/reader (ACR122U, FEIG, or compatible) to this PC.</li>
          <li>Most USB readers act as <strong>keyboard emulators</strong> — they type the tag UID into the active input field.</li>
          <li>Click <strong>Scan UID</strong> to focus the UID field, then tap the tag on the reader.</li>
          <li>For write-back (encoding data onto the tag chip), use the writer&apos;s own companion software — this panel records the association in ClamFlow.</li>
        </ul>
      </div>
    </div>
  );
};

export default DeviceRFIDWriter;
