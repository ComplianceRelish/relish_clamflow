'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { onboardingAPI } from '@/lib/api-client';
import Image from 'next/image';

interface VendorOnboardingData {
  first_name: string;
  last_name: string;
  name_of_firm: string;
  address: string;
  contact_number: string;
  gst_number?: string;             // Optional
  aadhar_number: string;
  face_image?: string;             // Optional
  category: string;
  start_date?: string;             // Optional - ISO date string
  status: string;                  // Auto-set to "pending"
}

export default function VendorOnboardingPage() {
  const { userProfile, userRole } = useAuth();
  const router = useRouter();
  
  // ⭐ EXACT ROLE-BASED ACCESS CONTROL FROM BACKEND
  useEffect(() => {
    const authorizedRoles = ['Super Admin', 'Admin', 'Production Lead', 'Staff Lead'];
    
    if (!userRole || !authorizedRoles.includes(userRole)) {
      alert('Access Denied: Only Super Admin, Admin, Production Lead, or Staff Lead can onboard vendors.');
      router.push('/dashboard');
      return;
    }
  }, [userRole, router]);

  const [formData, setFormData] = useState<VendorOnboardingData>({
    first_name: '',
    last_name: '',
    name_of_firm: '',
    address: '',
    contact_number: '',
    gst_number: '',
    aadhar_number: '',
    face_image: '',
    category: '',
    start_date: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // ⭐ VENDOR CATEGORIES
  const vendorCategories = [
    { value: 'Equipment Supplier', label: 'Equipment Supplier', description: 'Machinery, tools, and equipment' },
    { value: 'Maintenance Services', label: 'Maintenance Services', description: 'Repair and maintenance providers' },
    { value: 'Transportation', label: 'Transportation', description: 'Logistics and transportation services' },
    { value: 'Packaging Materials', label: 'Packaging Materials', description: 'Boxes, labels, packaging supplies' },
    { value: 'Laboratory Services', label: 'Laboratory Services', description: 'Testing and analysis services' },
    { value: 'Utilities', label: 'Utilities', description: 'Power, water, waste management' },
    { value: 'IT Services', label: 'IT Services', description: 'Technology and software services' },
    { value: 'Chemicals & Consumables', label: 'Chemicals & Consumables', description: 'Processing chemicals and consumables' },
    { value: 'Security Services', label: 'Security Services', description: 'Security and surveillance services' },
    { value: 'Other', label: 'Other', description: 'Other vendor services' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ⭐ EXACT BACKEND SCHEMA MAPPING
      const submissionData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        name_of_firm: formData.name_of_firm,
        address: formData.address,
        contact_number: formData.contact_number,
        gst_number: formData.gst_number || null,
        aadhar_number: formData.aadhar_number,
        face_image: formData.face_image || null,
        category: formData.category,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        status: 'pending'
      };
      
      await onboardingAPI.submitVendor(submissionData);
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          first_name: '',
          last_name: '',
          name_of_firm: '',
          address: '',
          contact_number: '',
          gst_number: '',
          aadhar_number: '',
          face_image: '',
          category: '',
          start_date: '',
          status: 'pending'
        });
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vendor onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-relish-cream py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-relish.png"
              alt="Relish Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ClamFlow</h1>
          <p className="text-lg text-relish-purple font-semibold mb-2">Quality • Productivity • Assured</p>
          <h2 className="text-2xl font-bold text-gray-800">Vendor Onboarding</h2>
          <p className="text-gray-600">Register new service provider / vendor</p>
          <div className="mt-2 text-sm text-gray-500">
            Submitted by: {userProfile?.full_name || userProfile?.username} ({userRole})
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Vendor onboarding submitted successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>The vendor registration has been sent to admin for approval.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Contact person's first name"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    required
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Contact person's last name"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar Number *
                </label>
                <input
                  type="text"
                  id="aadhar_number"
                  name="aadhar_number"
                  required
                  pattern="[0-9]{12}"
                  value={formData.aadhar_number}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={12}
                />
                <p className="text-xs text-gray-500 mt-1">12-digit Aadhar number of contact person</p>
              </div>
            </div>

            {/* Firm Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Firm Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="name_of_firm" className="block text-sm font-medium text-gray-700 mb-2">
                    Name of Firm *
                  </label>
                  <input
                    type="text"
                    id="name_of_firm"
                    name="name_of_firm"
                    required
                    value={formData.name_of_firm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Enter company/firm name"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                  >
                    <option value="">Select Vendor Category</option>
                    {vendorCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {formData.category && (
                    <p className="text-xs text-gray-600 mt-1">
                      {vendorCategories.find(cat => cat.value === formData.category)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst_number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Enter GST number (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">15-digit GST number (optional)</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Enter complete business address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      id="contact_number"
                      name="contact_number"
                      required
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                      Business Start Date
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Face Image Upload */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person Photo (Optional)</h3>
              
              <div>
                <label htmlFor="face_image" className="block text-sm font-medium text-gray-700 mb-2">
                  Face Image URL
                </label>
                <input
                  type="url"
                  id="face_image"
                  name="face_image"
                  value={formData.face_image}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                  placeholder="https://example.com/contact-person-photo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: URL to contact person's photo for identification</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-relish-purple"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 btn-primary text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit for Approval'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Information Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Vendor Categories
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Choose the category that best describes your services</li>
                  <li>GST number is optional but recommended for tax compliance</li>
                  <li>Contact person details are required for communication</li>
                  <li>All vendor registrations require admin approval</li>
                  <li>Approved vendors will receive login credentials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}