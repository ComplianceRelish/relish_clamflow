'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { onboardingAPI } from '@/lib/api-client';
import Image from 'next/image';

interface SupplierOnboardingData {
  type: string;                    // "Boat Owner" or "Agent"
  first_name: string;
  last_name: string;
  address: string;
  contact_number: string;
  aadhar_number: string;
  face_image?: string;             // Optional
  boat_registration_number: string;
  gst_number?: string;             // Optional
  linked_boat_owners: string[];    // Array of UUIDs (for Agents)
  start_date?: string;             // Optional - ISO date string
  status: string;                  // Auto-set to "pending"
}

export default function SupplierOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // ⭐ EXACT ROLE-BASED ACCESS CONTROL FROM BACKEND
  useEffect(() => {
    const authorizedRoles = ['Super Admin', 'Admin', 'Production Lead', 'Staff Lead'];
    
    if (!user?.role || !authorizedRoles.includes(user.role)) {
      alert('Access Denied: Only Super Admin, Admin, Production Lead, or Staff Lead can onboard suppliers.');
      router.push('/dashboard');
      return;
    }
  }, [user?.role, router]);

  const [formData, setFormData] = useState<SupplierOnboardingData>({
    type: '',
    first_name: '',
    last_name: '',
    address: '',
    contact_number: '',
    aadhar_number: '',
    face_image: '',
    boat_registration_number: '',
    gst_number: '',
    linked_boat_owners: [],
    start_date: '',
    status: 'pending'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [linkedBoatOwnerInput, setLinkedBoatOwnerInput] = useState('');

  // ⭐ SUPPLIER TYPES (Boat Owners & Agents)
  const supplierTypes = [
    { value: 'Boat Owner', label: 'Boat Owner', description: 'Direct boat owner supplying clams' },
    { value: 'Agent', label: 'Agent', description: 'Agent representing multiple boat owners' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle linked boat owners (for Agents)
  const addLinkedBoatOwner = () => {
    if (linkedBoatOwnerInput.trim()) {
      setFormData(prev => ({
        ...prev,
        linked_boat_owners: [...prev.linked_boat_owners, linkedBoatOwnerInput.trim()]
      }));
      setLinkedBoatOwnerInput('');
    }
  };

  const removeLinkedBoatOwner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      linked_boat_owners: prev.linked_boat_owners.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation for Agent type
      if (formData.type === 'Agent' && formData.linked_boat_owners.length === 0) {
        throw new Error('Agents must have at least one linked boat owner');
      }

      // ⭐ EXACT BACKEND SCHEMA MAPPING
      const submissionData = {
        type: formData.type,
        first_name: formData.first_name,
        last_name: formData.last_name,
        address: formData.address,
        contact_number: formData.contact_number,
        aadhar_number: formData.aadhar_number,
        face_image: formData.face_image || null,
        boat_registration_number: formData.boat_registration_number,
        gst_number: formData.gst_number || null,
        linked_boat_owners: formData.type === 'Agent' ? formData.linked_boat_owners : [],
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        status: 'pending'
      };
      
      await onboardingAPI.submitSupplier(submissionData);
      
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          type: '',
          first_name: '',
          last_name: '',
          address: '',
          contact_number: '',
          aadhar_number: '',
          face_image: '',
          boat_registration_number: '',
          gst_number: '',
          linked_boat_owners: [],
          start_date: '',
          status: 'pending'
        });
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit supplier onboarding');
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
          <h2 className="text-2xl font-bold text-gray-800">Supplier Onboarding</h2>
          <p className="text-gray-600">Register new clam supplier (Boat Owner / Agent)</p>
          <div className="mt-2 text-sm text-gray-500">
            Submitted by: {user?.full_name || user?.username} ({user?.role})
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
                  Supplier onboarding submitted successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>The supplier registration has been sent to admin for approval.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Supplier Type Selection */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supplier Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supplierTypes.map((type) => (
                  <div key={type.value} className="relative">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={handleInputChange}
                        className="sr-only"
                        required
                      />
                      <div className={`p-4 border-2 rounded-lg transition-colors ${
                        formData.type === type.value 
                          ? 'border-relish-purple bg-purple-50' 
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            formData.type === type.value 
                              ? 'border-relish-purple bg-relish-purple' 
                              : 'border-gray-300'
                          }`}>
                            {formData.type === type.value && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{type.label}</div>
                            <div className="text-sm text-gray-600">{type.description}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              
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
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Enter full address"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                      placeholder="XXXX XXXX XXXX"
                      maxLength={12}
                    />
                    <p className="text-xs text-gray-500 mt-1">12-digit Aadhar number</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="boat_registration_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Boat Registration Number *
                  </label>
                  <input
                    type="text"
                    id="boat_registration_number"
                    name="boat_registration_number"
                    required
                    value={formData.boat_registration_number}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                    placeholder="Enter boat registration number"
                  />
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

              <div className="mt-6">
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Business Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                />
              </div>
            </div>

            {/* Linked Boat Owners (Only for Agents) */}
            {formData.type === 'Agent' && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Linked Boat Owners *
                  <span className="text-sm font-normal text-gray-600 ml-2">(Required for Agents)</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={linkedBoatOwnerInput}
                      onChange={(e) => setLinkedBoatOwnerInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-relish-purple focus:border-relish-purple"
                      placeholder="Enter boat owner ID or name"
                    />
                    <button
                      type="button"
                      onClick={addLinkedBoatOwner}
                      className="px-4 py-2 bg-relish-orange text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      Add
                    </button>
                  </div>

                  {formData.linked_boat_owners.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Linked Boat Owners:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.linked_boat_owners.map((owner, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-relish-purple text-white text-sm rounded-full"
                          >
                            {owner}
                            <button
                              type="button"
                              onClick={() => removeLinkedBoatOwner(index)}
                              className="ml-2 text-white hover:text-gray-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Face Image Upload */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Face Image (Optional)</h3>
              
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
                  placeholder="https://example.com/face-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: URL to face image for identification</p>
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
                Supplier Types Explained
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Boat Owner:</strong> Direct owner of fishing boat, supplies own catch</li>
                  <li><strong>Agent:</strong> Represents multiple boat owners, aggregates supply</li>
                  <li>All suppliers require boat registration number for traceability</li>
                  <li>GST number is optional but recommended for tax compliance</li>
                  <li>Agents must specify which boat owners they represent</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}