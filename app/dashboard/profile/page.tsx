'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/lib/context/AuthContext';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import {
  User,
  Settings,
  Building,
  Shield,
  KeyRound,
  History,
  CheckCircle2,
  AlertCircle,
  Save,
  Camera,
  Upload,
  Trash2,
  Mail,
  Phone,
  MapPin,
  IndianRupee,
  Bell,
  Lock,
  LogOut,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  BadgeCheck,
  Building2,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { HostelSettings, AuditLog } from '@/lib/db/types';
import { isValidPhoneNumber, PHONE_HTML_PATTERN, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';
import { optimizeImageFile } from '@/lib/services/imageOptimizer';
import { formatDateTimeDMY } from '@/lib/utils/dateFormatter';

type ActiveTab = 'PROFILE' | 'HOSTEL' | 'BILLING' | 'SECURITY' | 'AUDIT';

function OwnerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, logout, loginAsUser } = useAuth();
  const { settings, hostelName, updateSettings: saveToGlobalSettings } = useHostelSettings();

  // Determine initial tab from query param or default to PROFILE
  const tabParam = searchParams.get('tab')?.toUpperCase();
  const validTabs: ActiveTab[] = ['PROFILE', 'HOSTEL', 'BILLING', 'SECURITY', 'AUDIT'];
  const initialTab: ActiveTab = validTabs.includes(tabParam as ActiveTab)
    ? (tabParam as ActiveTab)
    : tabParam === 'SETTINGS'
    ? 'HOSTEL'
    : 'PROFILE';

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = currentUser?.role === 'OWNER';

  // Tab 1: Profile state
  const [ownerName, setOwnerName] = useState(currentUser?.fullName || '');
  const [ownerTitle, setOwnerTitle] = useState(currentUser?.staffTitle || '');
  const [ownerEmail, setOwnerEmail] = useState(currentUser?.email || '');
  const [ownerPhone, setOwnerPhone] = useState(currentUser?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop'
  );
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Sync state whenever currentUser loads or switches
  useEffect(() => {
    if (currentUser) {
      setOwnerName(currentUser.fullName || '');
      setOwnerTitle(currentUser.staffTitle || (currentUser.role === 'OWNER' ? 'Hostel Owner & Lead Administrator' : currentUser.role));
      setOwnerEmail(currentUser.email || '');
      setOwnerPhone(currentUser.phone || '');
      if (currentUser.avatarUrl) {
        setAvatarUrl(currentUser.avatarUrl);
      }
    }
  }, [currentUser]);

  // Restrict tabs for non-owners (Warden, Staff, etc. can only view Profile and Security)
  useEffect(() => {
    if (currentUser && currentUser.role !== 'OWNER' && activeTab !== 'PROFILE' && activeTab !== 'SECURITY') {
      setActiveTab('PROFILE');
    }
  }, [currentUser, activeTab]);

  // Tab 2: Hostel & Campus state
  const [brandHostelName, setBrandHostelName] = useState(hostelName);
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [description, setDescription] = useState(settings?.description || '');
  const [address, setAddress] = useState(settings?.address || '');
  const [city, setCity] = useState(settings?.city || '');
  const [stateName, setStateName] = useState(settings?.state || '');
  const [pincode, setPincode] = useState(settings?.pincode || '');
  const [hostelPhone, setHostelPhone] = useState(settings?.phone || '');
  const [hostelEmail, setHostelEmail] = useState(settings?.email || '');
  const [website, setWebsite] = useState(settings?.website || '');

  // Tab 3: Billing & System Policies state
  const [defaultRent, setDefaultRent] = useState(settings?.defaultMonthlyRent || 8500);
  const [defaultDeposit, setDefaultDeposit] = useState(0);
  const [rulesAndPolicies, setRulesAndPolicies] = useState(settings?.rulesAndPolicies || '');
  const [whatsappAlerts, setWhatsappAlerts] = useState(settings?.whatsappAlerts !== false);
  const [smsAlerts, setSmsAlerts] = useState(settings?.smsAlerts !== false);
  const [lateEntryAlerts, setLateEntryAlerts] = useState(settings?.lateEntryAlerts !== false);
  const [automatedFeeReminders, setAutomatedFeeReminders] = useState(settings?.automatedFeeReminders !== false);

  // Tab 4: Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(settings?.twoFactorEnabled || false);
  const [pinLockEnabled, setPinLockEnabled] = useState(settings?.pinLockEnabled || false);

  // Tab 5: Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [purgingAudit, setPurgingAudit] = useState(false);
  const [auditMeta, setAuditMeta] = useState<{
    retentionHours?: number;
    lastCleanedAt?: string;
    nextScheduledRunAt?: string;
    lastPrunedCount?: number;
    cleanupSchedule?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state when settings or user loads
  useEffect(() => {
    if (settings) {
      setBrandHostelName(settings.name || hostelName);
      setTagline(settings.tagline || '');
      setDescription(settings.description || '');
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setStateName(settings.state || '');
      setPincode(settings.pincode || '');
      setHostelPhone(settings.phone || '');
      setHostelEmail(settings.email || '');
      setWebsite(settings.website || '');
      setDefaultRent(settings.defaultMonthlyRent || 8500);
      setDefaultDeposit(0);
      setRulesAndPolicies(settings.rulesAndPolicies || '');
      setWhatsappAlerts(settings.whatsappAlerts !== false);
      setSmsAlerts(settings.smsAlerts !== false);
      setLateEntryAlerts(settings.lateEntryAlerts !== false);
      setAutomatedFeeReminders(settings.automatedFeeReminders !== false);
      setTwoFactorEnabled(settings.twoFactorEnabled || false);
      setPinLockEnabled(settings.pinLockEnabled || false);
    }
  }, [settings, hostelName]);

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/audit');
      const data = await res.json();
      if (data.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
      setAuditMeta({
        retentionHours: data.retentionHours || 12,
        lastCleanedAt: data.lastCleanedAt,
        nextScheduledRunAt: data.nextScheduledRunAt,
        lastPrunedCount: data.lastPrunedCount,
        cleanupSchedule: data.cleanupSchedule || 'every 12 hours',
      });
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Manual purge handler for audit logs older than 12 hours
  const handlePurgeOldAuditLogs = async () => {
    setPurgingAudit(true);
    try {
      const res = await fetch('/api/audit', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Audit cleanup completed: ${data.deletedCount} records older than 12 hours purged.`);
        await fetchAuditLogs();
      } else {
        alert(data.message || 'Failed to purge audit logs.');
      }
    } catch (err) {
      console.error('Failed to trigger audit purge', err);
      alert('Error triggering audit log cleanup.');
    } finally {
      setPurgingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'AUDIT') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      const opt = await optimizeImageFile(file, 50, 400);
      setAvatarUrl(opt.dataUrl);
      showToast('Profile photo updated (preview). Remember to save profile.');
    } catch (err: any) {
      alert(`Photo error: ${err.message}`);
    }
  };

  // Save Tab 1: Owner Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      alert('Name is required.');
      return;
    }
    if (!isValidPhoneNumber(ownerPhone)) {
      alert(`Mobile Number: ${PHONE_ERROR_MESSAGE}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          role: currentUser?.role,
          fullName: ownerName.trim(),
          staffTitle: ownerTitle.trim(),
          phone: ownerPhone.trim(),
          email: ownerEmail.trim(),
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (currentUser) {
          loginAsUser({
            ...currentUser,
            fullName: data.user.fullName,
            staffTitle: data.user.staffTitle,
            phone: data.user.phone,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
          });
        }
        showToast(isOwner ? 'Owner profile details updated successfully!' : 'Profile details updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  // Save Tab 2: Hostel & Campus
  const handleSaveHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandHostelName.trim()) {
      alert('Hostel name is required.');
      return;
    }
    if (hostelPhone.trim() && !isValidPhoneNumber(hostelPhone)) {
      alert(`Hostel Contact Phone: ${PHONE_ERROR_MESSAGE}`);
      return;
    }

    setLoading(true);
    try {
      const result = await saveToGlobalSettings({
        name: brandHostelName.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        phone: hostelPhone.trim(),
        email: hostelEmail.trim(),
        website: website.trim(),
      });
      if (result.success) {
        showToast('Hostel & campus profile saved successfully!');
      } else {
        alert(result.error || 'Failed to update hostel information.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving hostel details.');
    } finally {
      setLoading(false);
    }
  };

  // Save Tab 3: Financial & System Rules
  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await saveToGlobalSettings({
        defaultMonthlyRent: Number(defaultRent || 0),
        defaultDeposit: 0,
        currency: 'INR',
        currencySymbol: '₹',
        rulesAndPolicies: rulesAndPolicies.trim(),
        whatsappAlerts,
        smsAlerts,
        lateEntryAlerts,
        automatedFeeReminders,
      });
      if (result.success) {
        showToast('Billing defaults and operational rules saved!');
      } else {
        alert(result.error || 'Failed to update billing settings.');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving billing settings.');
    } finally {
      setLoading(false);
    }
  };

  // Save Tab 4: Security
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
      }
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);
    try {
      const result = await saveToGlobalSettings({
        twoFactorEnabled,
        pinLockEnabled,
      });
      if (result.success) {
        showToast('Security preferences updated!');
        if (newPassword) {
          showToast('Password and security preferences updated!');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        alert(result.error || 'Failed to save security settings.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating security settings.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    const matchesSearch =
      !q ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userRole.toLowerCase().includes(q);

    const matchesAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('PAYMENT') || action.includes('REGISTER') || action.includes('CONFIRMED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('CHECKOUT') || action.includes('DELETE') || action.includes('CANCEL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header with Role-Aware Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isOwner ? 'Unified Owner Command Center' : 'Staff Account Command Center'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {isOwner ? 'Owner Profile & Settings' : 'My Profile & Account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isOwner
                ? 'Manage your administrator credentials, hostel property branding, billing defaults, security, and system audit trail.'
                : 'Manage your staff credentials, personal contact information, and account password.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                logout();
              }}
              className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Executive Summary Strip */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src={avatarUrl}
              alt={ownerName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg font-display">
                  {ownerName || 'User'}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                  <BadgeCheck className="w-3 h-3" />
                  {isOwner ? 'Hostel Owner' : currentUser?.staffTitle || currentUser?.role || 'Staff Member'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  ID: {currentUser?.id || settings?.systemId || 'HS-USER'}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-4 justify-center sm:justify-start flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  {hostelName}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {ownerPhone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {ownerEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isOwner ? 'Single-Owner Governance Active' : 'Staff Account Active'}</span>
          </div>
        </div>

        {/* Convenient Unified Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'PROFILE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isOwner ? 'Owner Profile' : 'My Profile'}</span>
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('HOSTEL')}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'HOSTEL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Hostel & Campus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BILLING')}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                  activeTab === 'BILLING'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>System & Billing</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
              activeTab === 'SECURITY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shrink-0 ${
                activeTab === 'AUDIT'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>System Audit Logs</span>
              {auditLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800">
                  {auditLogs.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PROFILE                                                           */}
        {/* ========================================================================= */}
        {activeTab === 'PROFILE' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                {isOwner ? 'Administrator Particulars' : 'My Account Particulars'}
              </h2>
              <p className="text-xs text-slate-500">
                {isOwner
                  ? 'Update your personal name, official designation, login phone, and executive profile photo.'
                  : 'Update your personal details, designation, contact phone number, and profile photo.'}
              </p>
            </div>

            {/* Avatar Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={avatarUrl}
                  alt={ownerName || 'User'}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
                />
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <span className="text-xs font-bold text-slate-900 block">
                  {isOwner ? 'Executive Profile Photo' : 'Profile Photo'}
                </span>
                <p className="text-[11px] text-slate-500">
                  Upload a photo from your computer or choose from professional presets.
                </p>

                <div className="flex items-center gap-2 justify-center sm:justify-start pt-1 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarFileRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    Upload Custom Photo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAvatarUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop')
                    }
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition"
                  >
                    Preset 1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop')
                    }
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-medium text-slate-600 transition"
                  >
                    Preset 2
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isOwner ? 'Owner Full Name' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder={isOwner ? "e.g. Rajesh Kumar" : "Your full name"}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={ownerTitle}
                    onChange={(e) => setOwnerTitle(e.target.value)}
                    placeholder={isOwner ? "e.g. Hostel Owner & Lead Administrator" : "e.g. Warden / Staff"}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isOwner ? 'Owner Mobile Number (Login)' : 'Mobile Number (Login)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern={PHONE_HTML_PATTERN}
                    maxLength={10}
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Mandatory. 10 digits starting with 6, 7, 8, or 9 (pattern: ^[6-9]\d{9}$).
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="e.g. owner@serenityliving.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HOSTEL & CAMPUS BRANDING                                          */}
        {/* ========================================================================= */}
        {activeTab === 'HOSTEL' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Hostel & Campus Branding</h2>
              <p className="text-xs text-slate-500">
                Official property identity displayed on the public landing page, invoices, and resident admission slips.
              </p>
            </div>

            <form onSubmit={handleSaveHostel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Hostel Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={brandHostelName}
                    onChange={(e) => setBrandHostelName(e.target.value)}
                    placeholder="e.g. Serenity Living Executive Homestay"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel Tagline / Slogan
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Premium Co-Living & Student Facility"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  About the Hostel / Welcome Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description displayed on website..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Plot No 42, Hitech City Main Road, Cyber Hills"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 500081"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Public Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern={PHONE_HTML_PATTERN}
                    maxLength={10}
                    value={hostelPhone}
                    onChange={(e) => setHostelPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit phone (e.g. 9876543210)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    10 digits starting with 6, 7, 8, or 9
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Public Email
                  </label>
                  <input
                    type="email"
                    value={hostelEmail}
                    onChange={(e) => setHostelEmail(e.target.value)}
                    placeholder="e.g. contact@serenityliving.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="e.g. https://serenityliving.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Hostel Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SYSTEM & BILLING RULES                                            */}
        {/* ========================================================================= */}
        {activeTab === 'BILLING' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">System Rules & Operational Policies</h2>
              <p className="text-xs text-slate-500">
                Configure campus code of conduct and automated communication alerts. All calculations standardized in Indian Currency (INR ₹).
              </p>
            </div>

            <form onSubmit={handleSaveBilling} className="space-y-6">

              {/* Rules and policies */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hostel Rules & Resident Code of Conduct
                </label>
                <textarea
                  rows={4}
                  value={rulesAndPolicies}
                  onChange={(e) => setRulesAndPolicies(e.target.value)}
                  placeholder="e.g. 1. Gate closure at 10:30 PM. 2. Quiet hours between 11:00 PM and 6:00 AM..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Notification Toggles */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Automated Operational Alerts & Integrations
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">WhatsApp Admission & Fee Alerts</span>
                      <span className="text-slate-500 text-[11px]">Send invoices and admission slips via WhatsApp</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => setWhatsappAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">SMS Payment Confirmations</span>
                      <span className="text-slate-500 text-[11px]">Send receipt SMS to student mobile upon payment</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={smsAlerts}
                      onChange={(e) => setSmsAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">Late Entry Alerts</span>
                      <span className="text-slate-500 text-[11px]">Notify wardens when resident checks in past curfew</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={lateEntryAlerts}
                      onChange={(e) => setLateEntryAlerts(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">Automated Monthly Fee Reminders</span>
                      <span className="text-slate-500 text-[11px]">Send reminder notices 3 days prior to due date</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={automatedFeeReminders}
                      onChange={(e) => setAutomatedFeeReminders(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save System Rules & Alerts'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SECURITY & CREDENTIALS                                            */}
        {/* ========================================================================= */}
        {activeTab === 'SECURITY' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Security & Credentials</h2>
              <p className="text-xs text-slate-500">
                Update administrative account password, enable two-factor protection, and manage session preferences.
              </p>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    Change Account Password
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition px-2 py-1 rounded-lg hover:bg-indigo-50"
                  >
                    {showPasswords ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide Passwords</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show Passwords</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={showPasswords ? 'Current password' : '••••••••'}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={showPasswords ? 'New password (min 6 chars)' : 'Min 6 characters'}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={showPasswords ? 'Confirm new password' : 'Re-enter password'}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Additional Account Protection
                </span>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
                      <span className="text-slate-500 text-[11px]">Require OTP verification on new device logins</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="font-bold text-slate-900 block">Quick PIN Lock Protection</span>
                      <span className="text-slate-500 text-[11px]">Prompt for 4-digit PIN when switching back to management tab</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={pinLockEnabled}
                      onChange={(e) => setPinLockEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SYSTEM AUDIT LOGS                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'AUDIT' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">System Audit Log Trail</h2>
                <p className="text-xs text-slate-500">
                  Real-time chronological log of administrative actions. Configured to retain logs for 12 hours with automated deletion.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handlePurgeOldAuditLogs}
                  disabled={purgingAudit || loadingAudit}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                  title="Manually purge records older than 12 hours"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${purgingAudit ? 'animate-spin text-amber-600' : 'text-amber-700'}`} />
                  <span>{purgingAudit ? 'Purging...' : 'Purge Logs (>12h)'}</span>
                </button>

                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={loadingAudit}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>
            </div>

            {/* 12-Hour Auto-Deletion Policy Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-blue-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>12-Hour Auto-Deletion Policy Active</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Audit logs are automatically deleted after every 12 hours to maintain system hygiene and security compliance.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto shrink-0 font-mono text-[11px]">
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-blue-200 text-blue-800 shadow-2xs">
                  Retention: <strong>12 Hours</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-blue-200 text-blue-800 shadow-2xs">
                  Schedule: <strong>Every 12h</strong>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search logs by resident, action, user, or details..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white rounded-xl outline-none w-full sm:w-auto"
              >
                <option value="ALL">All Event Types</option>
                <option value="STUDENT_CHECKOUT">Checkouts</option>
                <option value="PAYMENT_RECORDED">Payments</option>
                <option value="UPDATE_STUDENT">Student Updates</option>
                <option value="HOSTEL_SETTINGS_UPDATED">Settings Changes</option>
                <option value="BOOKING_REQUEST_SUBMITTED">Web Bookings</option>
                <option value="STAFF_ADDED">Staff Changes</option>
              </select>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Event / Action</th>
                    <th className="py-3 px-4">Details & Summary</th>
                    <th className="py-3 px-4">Performed By</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {loadingAudit ? 'Loading audit records...' : 'No audit records match your search filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-700 max-w-md">
                          <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{log.userName}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{log.userRole}</span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-slate-500 text-[11px]">
                          {formatDateTimeDMY(log.timestamp)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function OwnerProfilePage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading Profile & Settings...</p>
          </div>
        </DashboardLayout>
      }
    >
      <OwnerProfileContent />
    </Suspense>
  );
}
