'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
  Shield,
  Users,
  KeyRound,
} from 'lucide-react';
import { optimizeImageFile, OptimizedImageResult } from '@/lib/services/imageOptimizer';
import { isValidPhoneNumber, PHONE_HTML_PATTERN, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';

interface EditStudentModalProps {
  isOpen: boolean;
  student: any | null;
  onClose: () => void;
  onSuccess: (updatedStudent: any) => void;
}

export default function EditStudentModal({
  isOpen,
  student,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('');
  const [monthlyRent, setMonthlyRent] = useState<number | string>('');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Father');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when student prop changes or modal opens
  useEffect(() => {
    if (student && isOpen) {
      setFullName(student.fullName || '');
      setPhone(student.phone || '');
      setGender(student.gender || 'Male');
      setDob(student.dob || '');
      setMonthlyRent(student.monthlyRent ?? 0);
      setAddress(student.address || '');
      setGuardianName(student.guardianName || '');
      setGuardianPhone(student.guardianPhone || '');
      setGuardianRelation(student.guardianRelation || 'Father');
      setIdProofType(student.idProofType || 'Aadhaar');
      setIdProofNumber(student.idProofNumber || '');
      setPhotoUrl(student.photoUrl || '');
      setNewPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const result: OptimizedImageResult = await optimizeImageFile(file, 50, 800);
      setPhotoUrl(result.dataUrl);
    } catch (err: any) {
      setErrorMsg(`Photo processing error: ${err.message}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Mandatory validation
    if (!fullName.trim()) {
      setErrorMsg('Student Full Name is mandatory.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setErrorMsg('Student Mobile Number is mandatory for resident app login.');
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone)) {
      setErrorMsg(`Student ${PHONE_ERROR_MESSAGE.toLowerCase()}`);
      return;
    }

    if (guardianPhone.trim() && !isValidPhoneNumber(guardianPhone.trim())) {
      setErrorMsg(`Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: student.id,
          fullName: fullName.trim(),
          phone: trimmedPhone,
          gender,
          dob,
          monthlyRent: Number(monthlyRent || 0),
          address: address.trim(),
          guardianName: guardianName.trim(),
          guardianPhone: guardianPhone.trim(),
          guardianRelation,
          idProofType,
          idProofNumber: idProofNumber.trim(),
          photoUrl,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update student details.');
      }

      setSuccessMsg('Resident information updated successfully.');
      setTimeout(() => {
        onSuccess(data.student);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                  Edit Student Data
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {student.studentId}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Update resident profile, contact mobile, room rent, and personal data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Student Photo and Core Identifiers */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-dashed border-indigo-300 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {fullName ? fullName.slice(0, 2).toUpperCase() : 'ST'}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-xs font-bold text-slate-800">Student Profile Photo</div>
              <p className="text-[11px] text-slate-500">
                Upload or update resident picture (auto-compressed to &lt;50 KB)
              </p>
              <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  Change Photo
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-right text-xs">
              <div className="text-slate-400 text-[10px]">Current Room & Bed</div>
              <div className="font-bold text-slate-900 font-display">
                Room {student.roomNumber} • Bed {student.bedNumber}
              </div>
              <div className="text-indigo-600 font-medium text-[11px] mt-0.5">
                {student.blockName || 'Hostel Wing'}
              </div>
            </div>
          </div>

          {/* Section: Basic Particulars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Personal Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Mobile (Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern={PHONE_HTML_PATTERN}
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile (e.g. 9876543210)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Mandatory. 10 digits starting with 6-9 (used for login).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Rent (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="e.g. 8500"
                    className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Home Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No, Street, City, State, PIN"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Resident Portal Password</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current (Default: student123)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Reset password for resident mobile login (min 4 chars).
                </span>
              </div>
            </div>
          </div>

          {/* Section: Guardian & Emergency Contact */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Parent / Guardian Details <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guardian Mobile
                </label>
                <input
                  type="tel"
                  pattern={PHONE_HTML_PATTERN}
                  maxLength={10}
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile (Optional)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Optional. 10 digits starting with 6-9 if entered.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relation
                </label>
                <select
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: ID Verification Document */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              ID Verification Document <span className="text-slate-400 font-normal normal-case">(Optional)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="College ID">College / Student ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other Official ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving Changes...' : 'Save Student Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
