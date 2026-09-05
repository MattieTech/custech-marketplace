'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Loader2, 
  AlertTriangle, 
  AlertCircle, 
  Camera, 
  Check, 
  CreditCard, 
  FileText, 
  User,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatPrice } from '@/lib/utils';
import { VERIFICATION_FEE_KOBO } from '@/lib/constants';
import { submitVerification, getVerificationStatus } from './actions';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type VerificationStatus = 'unverified' | 'under_review' | 'verified' | 'rejected';
type VerificationMethod = 'id_card' | 'manual';

export default function VerificationPage() {
  const router = useRouter();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [method, setMethod] = useState<VerificationMethod>('id_card');

  // Mandatory Profile Picture (Required for BOTH methods)
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('100');

  // Fast Track Method (ID Card Upload)
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Manual Method Specific Fields
  const [faculty, setFaculty] = useState('Faculty of Computing');
  const [hostelAddress, setHostelAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const currentStatus = await getVerificationStatus();
        setStatus(currentStatus);
      } catch (err) {
        console.error('Failed to load status', err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Only image files (JPEG, PNG, WebP) are allowed.');
        toast.error('Only image files are allowed for your profile picture.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB.');
        toast.error('Profile picture must be under 5MB.');
        return;
      }
      setProfilePicture(file);
      setProfilePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Upload an image of your student ID.');
        toast.error('Please upload an image of your student ID.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('ID document must be less than 5MB.');
        toast.error('Document must be under 5MB.');
        return;
      }
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleNextStep = () => {
    setError(null);

    if (step === 1) {
      // Validate Mandatory Profile Picture
      if (!profilePicture) {
        const msg = 'Please upload your profile picture. Both verification methods require an official photo.';
        setError(msg);
        toast.error(msg, 'Profile Photo Required');
        return;
      }

      // Validate Basic Info
      if (!fullName.trim()) {
        setError('Full legal name is required.');
        toast.error('Full legal name is required.');
        return;
      }

      if (!phoneNumber.trim()) {
        setError('Phone number is required.');
        toast.error('Phone number is required.');
        return;
      }

      if (!matricNumber.trim()) {
        setError('Matriculation Number / Student ID is required.');
        toast.error('Matriculation Number is required.');
        return;
      }

      if (!department.trim()) {
        setError('Department is required.');
        toast.error('Department is required.');
        return;
      }

      // If manual method, validate additional student fields
      if (method === 'manual') {
        if (!hostelAddress.trim()) {
          setError('Hall of residence or off-campus lodge address is required.');
          toast.error('Hostel or off-campus lodge address is required for manual verification.');
          return;
        }
        if (!emergencyContact.trim()) {
          setError('Next of kin / Emergency contact number is required.');
          toast.error('Next of kin or emergency contact is required.');
          return;
        }
      }

      setStep(2);
    } else if (step === 2) {
      if (method === 'id_card' && !documentFile) {
        const msg = 'Please upload a clear photo of your School ID Card.';
        setError(msg);
        toast.error(msg);
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('verificationMethod', method);
      formData.append('fullName', fullName);
      formData.append('phoneNumber', phoneNumber);
      formData.append('whatsappNumber', whatsappNumber || phoneNumber);
      formData.append('matricNumber', matricNumber);
      formData.append('department', department);
      formData.append('faculty', faculty);
      formData.append('level', level);
      formData.append('hostelAddress', hostelAddress);
      formData.append('emergencyContact', emergencyContact);

      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      if (documentFile) {
        formData.append('document', documentFile);
      }

      toast.info('Initializing secure Paystack checkout...');
      const result = await submitVerification(formData);

      if (result.success && result.authorization_url) {
        toast.success('Redirecting to Paystack for payment...', 'Payment Initialized');
        window.location.href = result.authorization_url;
      } else {
        setError(result.error || 'Something went wrong.');
        toast.error(result.error || 'Failed to initialize verification.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred.');
      toast.error('An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CustechLogoLoader mode="in-app" size="md" message="Checking student verification status..." />
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
          <ShieldCheck className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">You Are CUSTECH Verified!</h1>
        <p className="text-gray-600 text-lg">
          Your identity and student status have been verified. Your profile now features the official CUSTECH Verified badge across all listings and services.
        </p>
      </div>
    );
  }

  if (status === 'under_review') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-6">
        <CustechLogoLoader
          mode="in-app"
          size="lg"
          message="Student Verification Under Review..."
        />
        <h1 className="text-3xl font-bold text-gray-900">Verification Under Review</h1>
        <p className="text-gray-600 text-lg">
          Your verification details and payment have been received! Our verification officers are reviewing your student credentials. You will receive a notification once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">CUSTECH Student Verification</h1>
        <p className="text-gray-600 mt-2 text-sm">
          Join trusted CUSTECH sellers and service providers. Choose your preferred verification method below.
        </p>
      </div>

      {status === 'rejected' && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Previous Attempt Rejected</h3>
              <p className="text-red-600 text-sm mt-1">
                Please make sure your details and profile photo match your real student identity before resubmitting.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Verification Method Switcher */}
      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setMethod('id_card'); setError(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              method === 'id_card'
                ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <School className="w-4 h-4 text-green-600" /> Fast Track (School ID)
              </span>
              <span className="text-[10px] bg-green-600 text-white font-semibold px-2 py-0.5 rounded-full">
                Fastest
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Upload your CUSTECH student ID card photo for expedited automated inspection.
            </p>
          </button>

          <button
            type="button"
            onClick={() => { setMethod('manual'); setError(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              method === 'manual'
                ? 'border-green-600 bg-green-50/60 ring-2 ring-green-600'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" /> Manual Student Details
              </span>
              <span className="text-[10px] bg-blue-600 text-white font-semibold px-2 py-0.5 rounded-full">
                No ID Card
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Type your matriculation number, lodge address, and emergency contact for manual officer review.
            </p>
          </button>
        </div>
      )}

      {/* Step Progress Bar */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 -z-10 transition-all duration-300" 
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
              step >= num ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {num}
          </div>
        ))}
      </div>

      <Card className="p-6 border-gray-200 shadow-sm">
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center text-xs font-medium">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* STEP 1: Personal Info & MANDATORY Profile Picture */}
        {step === 1 && (
          <div className="space-y-6">
            {/* MANDATORY PROFILE PICTURE UPLOAD BOX */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" /> Mandatory Profile Picture *
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Required for Profile</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Upload a clear portrait headshot. This photo will be set as your official profile avatar across CUSTECH Marketplace.
              </p>

              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500 overflow-hidden bg-white flex items-center justify-center flex-shrink-0 shadow-inner">
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="file"
                    id="profile-picture-input"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-picture-input"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-emerald-600 text-xs font-semibold rounded-lg text-emerald-700 hover:bg-emerald-100/60 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {profilePicture ? 'Change Picture' : 'Upload Headshot'}
                  </label>
                  <p className="text-[11px] text-gray-500 mt-1">JPEG, PNG or WebP up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Full Legal Name *</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ibrahim Musa"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Phone Number *</label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="080XXXXXXXX"
                    type="tel"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">WhatsApp Number</label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="080XXXXXXXX (or same as phone)"
                    type="tel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Matriculation Number / Student ID *</label>
                  <Input
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="CST/2023/1234"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Academic Level *</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Department *</label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Faculty</label>
                  <Input
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="e.g. Faculty of Computing"
                  />
                </div>
              </div>

              {/* Extra Fields for Manual Method */}
              {method === 'manual' && (
                <div className="space-y-4 pt-3 border-t border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Campus Hall of Residence / Off-Campus Lodge Address *
                    </label>
                    <Input
                      value={hostelAddress}
                      onChange={(e) => setHostelAddress(e.target.value)}
                      placeholder="e.g. Block B, Room 14, Main Campus Hostel or Osara Lodge"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Emergency Contact / Next of Kin Phone Line *
                    </label>
                    <Input
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Next of Kin Phone: 080XXXXXXXX"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700">
                Continue to Next Step
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Document Upload or Manual Review Confirmation */}
        {step === 2 && (
          <div className="space-y-5">
            {method === 'id_card' ? (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Upload School ID Card</h2>
                <p className="text-xs text-gray-600 mb-4">
                  Take a clear, glare-free photo of your CUSTECH student identification card or temporary matriculation slip.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocumentChange}
                    className="hidden"
                    id="id-upload"
                  />
                  <label htmlFor="id-upload" className="cursor-pointer flex flex-col items-center">
                    {documentPreview ? (
                      <div className="mb-3 max-h-48 overflow-hidden rounded-lg border">
                        <img src={documentPreview} alt="ID preview" className="max-h-48 object-contain" />
                      </div>
                    ) : (
                      <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    )}
                    <span className="text-sm font-semibold text-green-700">
                      {documentFile ? 'Replace ID photo' : 'Click to select School ID photo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">JPEG or PNG, up to 5MB</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Review Manual Student Submission</h2>
                <p className="text-xs text-gray-600 mb-4">
                  Because you are verifying without a physical ID card, our student verification officer will cross-check your matriculation number ({matricNumber}) against university records.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Student:</span>
                    <span className="font-semibold text-gray-900">{fullName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Matric No:</span>
                    <span className="font-semibold text-gray-900">{matricNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-semibold text-gray-900">{department} ({level} Level)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Lodge / Hostel:</span>
                    <span className="font-semibold text-gray-900">{hostelAddress}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Emergency Line:</span>
                    <span className="font-semibold text-gray-900">{emergencyContact}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={handlePrevStep}>Back</Button>
              <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700">
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment via Paystack */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Verification Processing Fee</h2>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-green-900">One-Time Verification Fee</span>
                <span className="text-2xl font-bold text-green-800">{formatPrice(VERIFICATION_FEE_KOBO)}</span>
              </div>
              <p className="text-xs text-green-700">
                Processed securely via Paystack with instant receipt. Covers manual ID verification, database lookup, and verified badge provisioning.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Benefits You Unlock:</h3>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Official CUSTECH Verified badge shown on all your listings</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Direct student bank transfer payment details on your listings</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Priority ranking in search and campus buyer recommendations</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>Back</Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="bg-green-600 hover:bg-green-700 min-w-[170px]"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><CreditCard className="w-4 h-4 mr-2" /> Pay ₦1,000 via Paystack</>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
