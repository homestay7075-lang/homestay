'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Bed,
  Shield,
  Upload,
  Camera,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
  FileCheck,
  RotateCcw,
  History,
  MessageCircle,
  Copy,
  Check,
  LayoutDashboard,
  Share2,
  Printer,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useHostelSettings } from '@/lib/context/SettingsContext';
import { optimizeImageFile, OptimizedImageResult } from '@/lib/services/imageOptimizer';
import { generateNextStudentId } from '@/lib/services/studentIdGenerator';
import { isValidPhoneNumber, PHONE_HTML_PATTERN, PHONE_ERROR_MESSAGE } from '@/lib/utils/phoneValidator';
import { formatDateDMY } from '@/lib/utils/dateFormatter';

interface MultiStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillData?: {
    fullName?: string;
    phone?: string;
    address?: string;
    joiningDate?: string;
    email?: string;
    bookingId?: string;
  } | null;
}

export default function MultiStepStudentRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  prefillData,
}: MultiStepModalProps) {
  const router = useRouter();
  const { settings, hostelName } = useHostelSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredStudent, setRegisteredStudent] = useState<any | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('2004-06-15');
  const [address, setAddress] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Father');
  const [idProofType, setIdProofType] = useState('Aadhaar');
  const [idProofNumber, setIdProofNumber] = useState('');

  // Owner Check & Booking prefill state
  const [ownerChecked, setOwnerChecked] = useState(true);
  const isFromBooking = Boolean(prefillData && (prefillData.fullName || prefillData.phone || prefillData.address || prefillData.bookingId));

  // Photo, Live Camera & Compression (Optional)
  const [photoPreview, setPhotoPreview] = useState('');
  const [compressionMetrics, setCompressionMetrics] = useState<{
    originalKb: number;
    compressedKb: number;
    ratio: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Step 2: Allocation & Joining-Date Billing
  const [roomsData, setRoomsData] = useState<{
    buildings: any[];
    blocks: any[];
    floors: any[];
    rooms: any[];
    beds: any[];
  } | null>(null);

  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-09-09'); // Prompt joining date demonstration
  const [monthlyRent, setMonthlyRent] = useState(9000);
  const [depositAmount, setDepositAmount] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);

  // Student ID Preview
  const [generatedIdPreview, setGeneratedIdPreview] = useState('');

  // Step 3: Terms acceptance & History Detection
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [historicalRecords, setHistoricalRecords] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRegisteredStudent(null);
      setCopiedMessage(false);
      setCustomPassword('');
      setDepositAmount(settings?.defaultDeposit !== undefined ? settings.defaultDeposit : 0);

      // Handle prefill data from booking approval
      if (prefillData) {
        if (prefillData.fullName) setFullName(prefillData.fullName);
        if (prefillData.phone) setPhone(prefillData.phone.replace(/\D/g, '').slice(0, 10));
        if (prefillData.address) setAddress(prefillData.address);
        if (prefillData.joiningDate) setJoiningDate(prefillData.joiningDate);
        setOwnerChecked(true);
        setStep(1);
      }
      fetch('/api/rooms')
        .then(res => res.json())
        .then(data => {
          setRoomsData(data);
          if (data.blocks && data.blocks.length > 0) {
            setSelectedBlockId(data.blocks[0].id);
          }
        })
        .catch(console.error);

      // Fetch existing students to calculate next sequence and fetch stay history
      fetch('/api/students')
        .then(res => res.json())
        .then(data => {
          const ids = (data.students || []).map((s: any) => s.studentId);
          const nextId = generateNextStudentId(joiningDate, ids, {
            blockId: selectedBlockId,
            bedId: selectedBedId,
            blocks: roomsData?.blocks,
            floors: roomsData?.floors,
            rooms: roomsData?.rooms,
            beds: roomsData?.beds,
          });
          setGeneratedIdPreview(nextId);
          if (data.studentHistory && data.studentHistory.length > 0) {
            setHistoricalRecords(data.studentHistory);
          }
        })
        .catch(console.error);

      // Also query reports API to get all historical stay archives
      fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
          if (data.studentHistory && data.studentHistory.length > 0) {
            setHistoricalRecords(data.studentHistory);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, joiningDate, selectedBlockId, selectedBedId, roomsData]);

  // Synchronize video stream when camera is active
  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [isCameraActive, cameraStream]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // History detection by phone number (Strictly shown only in Step 3: Terms & Confirmation)
  const cleanPhone = phone.replace(/\D/g, '');
  const matchedHistory = historicalRecords.filter((h: any) => {
    if (!cleanPhone || cleanPhone.length < 10) return false;
    const hPhone = (h.phone || '').replace(/\D/g, '');
    return hPhone.length >= 10 && (hPhone.endsWith(cleanPhone) || cleanPhone.endsWith(hPhone));
  });

  // Filter rooms based on selected block
  const availableRooms = roomsData?.rooms.filter(r => r.blockId === selectedBlockId) || [];
  // Filter beds based on selected room
  const availableBeds = roomsData?.beds.filter(b => b.roomId === selectedRoomId && b.status === 'Available') || [];

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = roomsData?.rooms.find(r => r.id === roomId);
    if (room) {
      setMonthlyRent(room.baseRateMonthly || 8500);
    }
    const beds = roomsData?.beds.filter(b => b.roomId === roomId && b.status === 'Available') || [];
    if (beds.length > 0) {
      setSelectedBedId(beds[0].id);
    } else {
      setSelectedBedId('');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      const result: OptimizedImageResult = await optimizeImageFile(file, 50, 800);
      setPhotoPreview(result.dataUrl);
      setCompressionMetrics({
        originalKb: result.originalSizeKb,
        compressedKb: result.compressedSizeKb,
        ratio: result.compressionRatioPercent,
      });
    } catch (err: any) {
      alert(`Image optimization notice: ${err.message}`);
    }
  };

  // Live Camera Capture
  const startCamera = async () => {
    try {
      setErrorMsg('');
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        setCameraStream(stream);
        setIsCameraActive(true);
      } else {
        cameraInputRef.current?.click();
      }
    } catch (err: any) {
      console.warn('Direct webcam access failed or was dismissed, falling back to device camera capture', err);
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopCamera();

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `resident_live_${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        const result: OptimizedImageResult = await optimizeImageFile(file, 50, 800);
        setPhotoPreview(result.dataUrl);
        setCompressionMetrics({
          originalKb: result.originalSizeKb,
          compressedKb: result.compressedSizeKb,
          ratio: result.compressionRatioPercent,
        });
      } catch (err: any) {
        console.error('Image compression failed', err);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleClose = () => {
    stopCamera();
    setRegisteredStudent(null);
    setCopiedMessage(false);
    onClose();
  };

  const handleDoneGotoDashboard = () => {
    stopCamera();
    setRegisteredStudent(null);
    setCopiedMessage(false);
    onClose();
    router.push('/dashboard');
  };

  const handleStayOnDirectory = () => {
    stopCamera();
    setRegisteredStudent(null);
    setCopiedMessage(false);
    onClose();
  };

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Full Name is required to proceed.';
    if (!phone.trim()) return 'Student Mobile Number is mandatory.';
    if (!isValidPhoneNumber(phone)) {
      return `Student ${PHONE_ERROR_MESSAGE.toLowerCase()}`;
    }
    if (isFromBooking && !address.trim()) {
      return 'Permanent / Home Address is required.';
    }
    if (isFromBooking && !ownerChecked) {
      return 'Please check and confirm Owner Verification before proceeding.';
    }
    if (guardianPhone.trim() && !isValidPhoneNumber(guardianPhone)) {
      return `Guardian ${PHONE_ERROR_MESSAGE.toLowerCase()}`;
    }
    return null;
  };

  const validateStep2 = () => {
    if (!selectedBedId) return 'Please select an available bed.';
    if (!joiningDate) return 'Joining date is required for the billing cycle.';
    return null;
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
      stopCamera();
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitFinal = async () => {
    if (!termsAccepted) {
      setErrorMsg('Please confirm acceptance of the hostel admission terms.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          photoUrl: photoPreview,
          photoOriginalSizeKb: compressionMetrics?.originalKb,
          photoCompressedSizeKb: compressionMetrics?.compressedKb,
          gender,
          phone,
          email: '', // Email removed from admission form
          dob,
          address,
          guardianName,
          guardianPhone,
          guardianRelation,
          idProofType,
          idProofNumber,
          buildingId: roomsData?.blocks.find(b => b.id === selectedBlockId)?.buildingId || 'bld-1',
          blockId: selectedBlockId,
          roomId: selectedRoomId,
          bedId: selectedBedId,
          joiningDate,
          monthlyRent,
          depositAmount,
          otherCharges,
          password: customPassword.trim() || 'student123',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (prefillData?.bookingId) {
          fetch('/api/bookings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: prefillData.bookingId, status: 'Allocated' }),
          }).catch(console.error);
        }
        stopCamera();
        onSuccess();
        const studentInfo = {
          ...(data.student || {
            fullName,
            studentId: generatedIdPreview,
            phone,
            guardianName,
            guardianPhone,
            guardianRelation,
            roomNumber: roomsData?.rooms.find(r => r.id === selectedRoomId)?.roomNumber || 'Room',
            bedNumber: roomsData?.beds.find(b => b.id === selectedBedId)?.bedNumber || 'Bed',
            blockName: roomsData?.blocks.find(b => b.id === selectedBlockId)?.name || 'Hostel Wing',
            joiningDate,
            monthlyRent,
            depositAmount,
            otherCharges,
            photoUrl: photoPreview,
          }),
          initialPassword: data.initialPassword || customPassword.trim() || 'student123',
        };
        setRegisteredStudent(studentInfo);

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore if canvas unavailable
        }
      } else {
        setErrorMsg(data.error || 'Failed to register student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Post-Registration Screen: Send Profile on WhatsApp & Done Go to Dashboard
  if (registeredStudent) {
    const studentPhoneClean = (registeredStudent.phone || '').replace(/\D/g, '');
    const guardianPhoneClean = (registeredStudent.guardianPhone || '').replace(/\D/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const residentPortalUrl = `${origin}/app`;
    const studentPassword = registeredStudent.initialPassword || customPassword.trim() || 'student123';

    const studentWhatsAppText = `🏢 *${hostelName} - Official Admission Confirmation & Receipt*

Dear *${registeredStudent.fullName}*,
Welcome to ${hostelName}! Your hostel admission, bed allocation, and registration receipt have been confirmed.

📋 *Student Admission Particulars:*
• Student ID: *${registeredStudent.studentId}*
• Allocated Bed: Room ${registeredStudent.roomNumber} (${registeredStudent.bedNumber})
• Wing / Block: ${registeredStudent.blockName || 'Hostel Wing'}
• Joining Date: ${formatDateDMY(registeredStudent.joiningDate)}
• Monthly Rent: ₹${registeredStudent.monthlyRent?.toLocaleString('en-IN')}/month
• Registered Mobile: ${registeredStudent.phone}

🔑 *Your Student Mobile App Login Credentials:*
👉 Resident Portal Link: ${residentPortalUrl}
• Username / Mobile: *${registeredStudent.phone}* (or *${registeredStudent.studentId}*)
• Password: *${studentPassword}*

📱 *Resident App Features:*
Log in to view monthly rent invoices, download verified payment receipts, show your active digital resident pass, and chat with management.

Hostel Administration Contact: ${settings.phone || '9876543210'}
${hostelName}`;

    const guardianWhatsAppText = `🏢 *${hostelName} - Student Admission Confirmation & Receipt*

Dear Parent / Guardian,
This is to inform you that *${registeredStudent.fullName}* has been successfully registered and admitted to *${hostelName}*.

📋 *Admission Particulars:*
• Student ID: *${registeredStudent.studentId}*
• Allocated Bed: Room ${registeredStudent.roomNumber} (${registeredStudent.bedNumber})
• Wing / Block: ${registeredStudent.blockName || 'Hostel Wing'}
• Joining Date: ${formatDateDMY(registeredStudent.joiningDate)}
• Monthly Rent: ₹${registeredStudent.monthlyRent?.toLocaleString('en-IN')}/month
• Student Mobile: ${registeredStudent.phone}

🔑 *Student Resident Portal Access Credentials:*
👉 Portal Link: ${residentPortalUrl}
• Login ID: *${registeredStudent.phone}*
• Initial Password: *${studentPassword}*

Hostel Administration Contact: ${settings.phone || '9876543210'}
${hostelName}, ${settings.city || 'Campus'}`;

    const handleSendWhatsApp = (phoneDigits: string, text: string) => {
      const normalized = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
      const url = `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    };

    const handlePrintAdmissionReceipt = () => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Admission_Receipt_${registeredStudent.studentId}</title>
              <style>
                @page { size: A4 portrait; margin: 12mm; }
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }
                .receipt-box { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 680px; margin: 0 auto; }
                .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
                .title { font-size: 20px; font-weight: 800; color: #1e1b4b; text-transform: uppercase; }
                .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
                .badge { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
                .card-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
                .label { color: #64748b; }
                .value { font-weight: 600; color: #0f172a; }
                .credentials { background: #eef2ff; border: 1.5px dashed #6366f1; border-radius: 8px; padding: 12px; margin-top: 16px; }
                .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 12px; }
              </style>
            </head>
            <body>
              <div class="receipt-box">
                <div class="header">
                  <div>
                    <div class="title">${hostelName}</div>
                    <div class="subtitle">Official Hostel Admission Confirmation & Allocation Receipt</div>
                  </div>
                  <div class="badge">ADMISSION CONFIRMED</div>
                </div>

                <div class="grid-2">
                  <div class="card">
                    <div class="card-title">Resident Particulars</div>
                    <div class="row"><span class="label">Full Name:</span><span class="value">${registeredStudent.fullName}</span></div>
                    <div class="row"><span class="label">Student ID:</span><span class="value">${registeredStudent.studentId}</span></div>
                    <div class="row"><span class="label">Mobile Number:</span><span class="value">${registeredStudent.phone}</span></div>
                    <div class="row"><span class="label">Joining Date:</span><span class="value">${formatDateDMY(registeredStudent.joiningDate)}</span></div>
                  </div>

                  <div class="card">
                    <div class="card-title">Room & Bed Allocation</div>
                    <div class="row"><span class="label">Hostel Wing:</span><span class="value">${registeredStudent.blockName || 'Main Wing'}</span></div>
                    <div class="row"><span class="label">Room Number:</span><span class="value">Room ${registeredStudent.roomNumber}</span></div>
                    <div class="row"><span class="label">Bed Allocated:</span><span class="value">${registeredStudent.bedNumber}</span></div>
                    <div class="row"><span class="label">Monthly Tariff:</span><span class="value">₹${registeredStudent.monthlyRent?.toLocaleString('en-IN')}/mo</span></div>
                  </div>
                </div>

                <div class="card">
                  <div class="card-title">Admission Financial Details</div>
                  <div class="row"><span class="label">Monthly Room Rent:</span><span class="value">₹${registeredStudent.monthlyRent?.toLocaleString('en-IN')}</span></div>
                  ${registeredStudent.depositAmount > 0 ? `<div class="row"><span class="label">Security Deposit:</span><span class="value">₹${registeredStudent.depositAmount?.toLocaleString('en-IN')}</span></div>` : ''}
                  ${registeredStudent.otherCharges > 0 ? `<div class="row"><span class="label">Maintenance / Other Charges:</span><span class="value">₹${registeredStudent.otherCharges?.toLocaleString('en-IN')}</span></div>` : ''}
                  <div class="row" style="border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px; font-weight: 700;">
                    <span>Total Admission Dues:</span>
                    <span>₹${((registeredStudent.monthlyRent || 0) + (registeredStudent.depositAmount || 0) + (registeredStudent.otherCharges || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div class="credentials">
                  <div style="font-weight: 700; color: #3730a3; font-size: 12px; margin-bottom: 4px;">🔑 Student Mobile Portal Access Credentials</div>
                  <div class="row"><span class="label">Web App Portal Link:</span><span class="value">${residentPortalUrl}</span></div>
                  <div class="row"><span class="label">Login Username / Mobile:</span><span class="value">${registeredStudent.phone} (or ${registeredStudent.studentId})</span></div>
                  <div class="row"><span class="label">Initial Password:</span><span class="value">${studentPassword}</span></div>
                  <div style="font-size: 10px; color: #4338ca; margin-top: 4px;">Resident can log in anytime to view rent invoices, gate pass, and receipts.</div>
                </div>

                <div class="footer">
                  Official Admission Record • ${hostelName} • Phone: ${settings.phone || '9876543210'}
                </div>
              </div>
            </body>
          </html>
        `);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch (e) {}
          }, 1000);
        }, 300);
      } catch (e) {
        console.error('Print receipt failed:', e);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Registration Successful
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 font-display">
                  Student Profile & Credentials Created!
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Student Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
              {registeredStudent.photoUrl ? (
                <img
                  src={registeredStudent.photoUrl}
                  alt={registeredStudent.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
                  {registeredStudent.fullName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 font-display truncate">
                    {registeredStudent.fullName}
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                    {registeredStudent.studentId}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800">
                    Room {registeredStudent.roomNumber} ({registeredStudent.bedNumber})
                  </span>
                  <span>•</span>
                  <span>{registeredStudent.blockName || 'Wing'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                  <span>📱 {registeredStudent.phone}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-700">₹{registeredStudent.monthlyRent?.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
            </div>

            {/* Student Login Credentials Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 font-display">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Resident App Login Credentials
                </span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                  Included in WhatsApp Receipt
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 block">Login ID / Mobile</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{registeredStudent.phone}</span>
                  <span className="text-[9px] text-indigo-600 block font-mono mt-0.5">or {registeredStudent.studentId}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] font-semibold text-slate-500 block">Initial Password</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">{studentPassword}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Changeable in app</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Send Profile & Credentials Section */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-50/60 to-teal-50 border border-emerald-200/80 space-y-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Send Receipt & Login Credentials on WhatsApp
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    Instantly delivers admission details, room & bed allocation, resident portal link, and login credentials to the student.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {/* Send to Student Button */}
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(studentPhoneClean, studentWhatsAppText)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send Receipt & Credentials to Student WhatsApp ({registeredStudent.phone})</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </button>

                {/* Send to Guardian Button (if provided) */}
                {registeredStudent.guardianPhone && (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(guardianPhoneClean, guardianWhatsAppText)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Send to Guardian WhatsApp ({registeredStudent.guardianPhone})</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                )}

                {/* Copy Message button */}
                <button
                  type="button"
                  onClick={() => handleCopy(studentWhatsAppText)}
                  className="w-full py-2 px-3 rounded-xl bg-white/80 border border-slate-200 hover:bg-white text-slate-700 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Admission Receipt & Credentials Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Admission Receipt & Credentials Text</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStayOnDirectory}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Students Roster
              </button>

              <button
                type="button"
                onClick={handlePrintAdmissionReceipt}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Print or Save PDF Admission Receipt"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Print Receipt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDoneGotoDashboard}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Done • Go to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Admission Wizard
            </span>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Multi-Step Student Registration
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200/80 flex items-center justify-between text-xs">
          <div className={`flex items-center gap-2 font-semibold ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>Personal Details</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className={`flex items-center gap-2 font-semibold ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>Hostel Allocation</span>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <div className={`flex items-center gap-2 font-semibold ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              3
            </span>
            <span>Terms & Confirmation</span>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: PERSONAL DETAILS ================= */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* If opened from web booking, show banner & owner check */}
              {isFromBooking && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5 text-indigo-200" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Web Bed Booking Application
                        </span>
                        {prefillData?.bookingId && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-200/70 text-indigo-800">
                            #{prefillData.bookingId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Student-entered booking details pre-filled. Verify all student registration details below, check Owner Approval, and click Next Step to allocate room & bed.
                      </p>
                    </div>
                  </div>

                  {/* Owner Verification Check */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ownerChecked}
                        onChange={(e) => setOwnerChecked(e.target.checked)}
                        className="w-5 h-5 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-950">
                            Hostel Owner Check & Approval
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-800">
                            Verified by Owner
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Owner has verified student data and authorizes advancing to Hostel Room & Bed Allocation.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
              {/* Photo Options: Upload or Take Live Photo with Camera */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                {isCameraActive ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-indigo-600 animate-pulse" />
                        Live Camera Preview (Pose & Click Snapshot)
                      </span>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="relative w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden bg-black border-2 border-indigo-500 shadow-md">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {photoPreview ? (
                      <div className="relative group shrink-0">
                        <img
                          src={photoPreview}
                          alt="Student preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview('');
                            setCompressionMetrics(null);
                          }}
                          className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md transition"
                          title="Remove Photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <User className="w-8 h-8 text-slate-400" />
                        <span className="text-[10px] text-slate-400 mt-0.5 font-medium">No Photo</span>
                      </div>
                    )}
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <span className="text-xs font-bold text-slate-800">Student Photo</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Optional
                        </span>
                      </div>

                      {/* Hidden File and Camera Inputs */}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        ref={cameraInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Take Live Photo
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-600" />
                          Upload from Device
                        </button>

                        {photoPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPreview('');
                              setCompressionMetrics(null);
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-medium transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {compressionMetrics ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium justify-center sm:justify-start">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Optimized: {compressionMetrics.originalKb} KB → {compressionMetrics.compressedKb} KB (
                            {compressionMetrics.ratio}% reduction)
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400">
                          {photoPreview
                            ? 'Student photo compressed to <50 KB.'
                            : 'Student photo is optional. You can capture via camera, upload a file, or skip.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Name and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone and Date of Birth (Email removed) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Mobile (Used for Login) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern={PHONE_HTML_PATTERN}
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Mandatory. Must be 10 digits starting with 6, 7, 8, or 9.
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, Pincode (Optional)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Guardian Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Name <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Parent / Guardian"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Phone <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    pattern={PHONE_HTML_PATTERN}
                    maxLength={10}
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile (Optional)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Optional. 10 digits starting with 6-9 if provided.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relation <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
              </div>

              {/* ID Proof Type & Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Document Type <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={idProofType}
                    onChange={(e) => setIdProofType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="College ID">College / Work ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ID Document Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={idProofNumber}
                    onChange={(e) => setIdProofNumber(e.target.value)}
                    placeholder="e.g. 1234 5678 9012"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: HOSTEL ALLOCATION ================= */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Generated Student ID Preview (Rule 9) */}
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                    Automatic Sequence (Rule 9)
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    Allocated Student ID: <span className="text-indigo-600 font-mono font-extrabold">{generatedIdPreview}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format: STU + 2-digit Year (26) + Sequence (105). Unique & permanent.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  ID
                </div>
              </div>

              {/* Block and Room Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel Block / Wing
                  </label>
                  <select
                    value={selectedBlockId}
                    onChange={(e) => {
                      setSelectedBlockId(e.target.value);
                      const filteredRooms = roomsData?.rooms.filter(r => r.blockId === e.target.value) || [];
                      if (filteredRooms.length > 0) {
                        handleRoomChange(filteredRooms[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {roomsData?.blocks.map((blk: any) => (
                      <option key={blk.id} value={blk.id}>
                        {blk.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room Number
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    <option value="">-- Choose Room --</option>
                    {availableRooms.map((rm: any) => (
                      <option key={rm.id} value={rm.id}>
                        Room {rm.roomNumber} ({rm.type} • ₹{rm.baseRateMonthly}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bed Selector with Live Availability Check (Rule 11) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bed Allocation <span className="text-rose-500">*</span>
                </label>
                {availableBeds.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                    No vacant beds available in the selected room. Please choose another room or block.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableBeds.map((bed: any) => (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={() => setSelectedBedId(bed.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedBedId === bed.id
                            ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500'
                            : 'border-slate-200 hover:border-indigo-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{bed.bedNumber}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="text-[11px] text-slate-500">{bed.roomNumber}</div>
                        <div className="text-xs font-semibold text-indigo-600 mt-1">₹{bed.monthlyRate}/mo</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Joining Date (CRITICAL RULE 12: Billing anchors on this day!) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    Actual Joining Date (Anchors Billing Cycle)
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                    Rule 12
                  </span>
                </div>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white font-semibold"
                />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Monthly billing will start strictly on <strong>{joiningDate}</strong>, recurring on the same day every month. Dues are NOT generated prior to this joining date.
                </p>
              </div>

              {/* Financial Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    One-Time Charges (₹)
                  </label>
                  <input
                    type="number"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: REVIEW & CONFIRMATION ================= */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Admission Review Summary
                </h4>

                <div className="flex items-center gap-4 pb-3 border-b border-slate-200">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={fullName}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 text-base shrink-0">
                      {fullName ? fullName.charAt(0).toUpperCase() : <User className="w-6 h-6 text-indigo-400" />}
                    </div>
                  )}
                  <div>
                    <div className="text-base font-bold text-slate-900">{fullName}</div>
                    <div className="text-xs text-indigo-600 font-mono font-bold">{generatedIdPreview}</div>
                    <div className="text-xs text-slate-500">{phone} • {gender}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Room & Bed:</span>
                    <span className="font-semibold text-slate-800">
                      Room {roomsData?.rooms.find(r => r.id === selectedRoomId)?.roomNumber} • Bed {roomsData?.beds.find(b => b.id === selectedBedId)?.bedNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Joining Date:</span>
                    <span className="font-semibold text-indigo-600">{formatDateDMY(joiningDate)}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Monthly Rent:</span>
                    <span className="font-semibold text-slate-800">₹{(monthlyRent || 0).toLocaleString('en-IN')}/mo</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Total Admission Due:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{((monthlyRent || 0) + (depositAmount || 0) + (otherCharges || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prior Stay History (Auto-Detected using Phone Number - Rule: Only shown in Terms & Confirmation) */}
              {matchedHistory.length > 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300/80 space-y-3 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                        <History className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          Prior Stay History Detected ({matchedHistory.length} Previous Stay{matchedHistory.length > 1 ? 's' : ''})
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          Matched mobile number <span className="font-mono font-bold text-amber-950">{phone}</span> with hostel history archives.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      Returning Student
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {matchedHistory.map((hist: any) => (
                      <div
                        key={hist.id}
                        className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-900 font-bold">
                            Previous ID: <span className="text-indigo-600 font-mono">{hist.studentId}</span> ({hist.fullName})
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Stay: {formatDateDMY(hist.joiningDate)} → {hist.checkoutDate ? formatDateDMY(hist.checkoutDate) : 'Checked Out'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400">Previous Allocation:</span>{' '}
                            <span className="font-semibold text-slate-800">
                              Room {hist.roomNumber}, Bed {hist.bedNumber} ({hist.blockName})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Checkout Reason:</span>{' '}
                            <span className="font-semibold text-slate-800">
                              {hist.checkoutReason || 'Completed Studies / Relocation'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Total Rent Paid:</span>{' '}
                            <span className="font-semibold text-emerald-600">
                              ₹{(hist.totalPaid || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Exit Balance:</span>{' '}
                            <span
                              className={`font-semibold ${
                                hist.finalOutstanding > 0 ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {hist.finalOutstanding > 0
                                ? `₹${hist.finalOutstanding} Dues Pending`
                                : '₹0 (Cleared)'}
                            </span>
                          </div>
                        </div>

                        {hist.notes && (
                          <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-100">
                            Warden Remarks: "{hist.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">New Resident Verification:</span>
                      <span className="text-slate-500 ml-1.5 text-[11px]">
                        No prior hostel stay records found for mobile <strong>{phone}</strong>. Initializing fresh student profile.
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-bold shrink-0">
                    New Resident
                  </span>
                </div>
              )}

              {/* Student App Login Credentials Configuration */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    Resident App Login Password (Optional)
                  </span>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                    Included in WhatsApp Receipt
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="student123 (Default)"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomPassword(phone.replace(/\D/g, '').slice(-6))}
                    disabled={phone.replace(/\D/g, '').length < 6}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                    title="Quick preset: last 6 digits of student phone number"
                  >
                    Mobile Last 6
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Default password is <strong>student123</strong>. Student logs in with mobile (<strong>{phone || 'mobile'}</strong>) or Student ID.
                </p>
              </div>

              {/* Terms Acceptance */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5"
                  />
                  <div className="text-xs text-slate-700 leading-relaxed">
                    I confirm that the resident's personal details, joining date (<strong>{joiningDate}</strong>), and bed allocation are verified.{' '}
                    {matchedHistory.length > 0
                      ? 'Prior stay history record has been reviewed by the Hostel Owner.'
                      : 'The student will be given access via phone login.'}
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold text-xs"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={loading || !termsAccepted}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating ID & Enrolling...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Register Student
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
