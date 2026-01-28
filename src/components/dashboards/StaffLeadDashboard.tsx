"use client"

import React, { useState } from 'react'
import { User } from '../../types/auth'
import SupplierOnboardingPanel from './stafflead/SupplierOnboardingPanel'
import SupervisionOverview from './stafflead/SupervisionOverview'
import SecuritySurveillance from './operations/SecuritySurveillance'
import StaffLeadStaffPanel from './stafflead/StaffLeadStaffPanel'

interface StaffLeadDashboardProps {
  currentUser: User | null
}

type StaffLeadView = 'overview' | 'suppliers' | 'security' | 'staff'

// Access Restricted Component for Admin-only sections
const AccessRestrictedPanel: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">Access Restricted</p>
    </div>
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h3 className="text-xl font-semibold text-amber-800 mb-2">Admin Access Required</h3>
      <p className="text-amber-700 max-w-md mx-auto">
        {description}
      </p>
      <p className="text-sm text-amber-600 mt-4">
        Contact your system administrator if you need access to this section.
      </p>
    </div>
  </div>
)

const StaffLeadDashboard: React.FC<StaffLeadDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<StaffLeadView>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ✅ UPDATED: Staff Lead now has access to Security & Staff Management per backend RBAC update
  const navigationItems = [
    { id: 'overview', label: 'Supervision Overview', icon: '📊', restricted: false },
    { id: 'suppliers', label: 'Supplier Onboarding', icon: '🚚', restricted: false },
    { id: 'security', label: 'Security & Surveillance', icon: '📹', restricted: false },
    { id: 'staff', label: 'Staff Management', icon: '👥', restricted: false },
  ]

  const handleNavClick = (view: StaffLeadView) => {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return <SupervisionOverview currentUser={currentUser} onNavigate={setActiveView} />
      case 'suppliers':
        return <SupplierOnboardingPanel currentUser={currentUser} />
      case 'security':
        // ✅ UPDATED: Staff Lead now has access to Security & Surveillance
        return <SecuritySurveillance />
      case 'staff':
        // ✅ UPDATED: Staff Lead now has access to Staff Attendance & Locations (but not Performance)
        return <StaffLeadStaffPanel />
      default:
        return <SupervisionOverview currentUser={currentUser} onNavigate={setActiveView} />
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-orange-600 to-orange-500 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div>
          <h1 className="text-lg font-bold text-white">🔶 STAFF LEAD</h1>
          <p className="text-xs text-orange-100">{currentUser?.full_name}</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white p-2 hover:bg-orange-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        fixed md:relative
        top-0 md:top-0
        left-0
        w-64 
        h-full
        bg-gradient-to-b from-orange-600 to-orange-500
        shadow-2xl
        transform transition-transform duration-300 ease-in-out
        z-40
        overflow-y-auto
      `}>
        {/* Desktop Header */}
        <div className="hidden md:block p-6 border-b border-orange-400">
          <h1 className="text-xl font-bold text-white">🔶 STAFF LEAD</h1>
          <p className="text-sm text-orange-100">Supervision & Onboarding</p>
        </div>

        {/* Mobile Close Button */}
        <div className="md:hidden p-4 border-b border-orange-400 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-white">Menu</h1>
            <p className="text-xs text-orange-100">{currentUser?.username}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-white p-2 hover:bg-orange-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-4">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as StaffLeadView)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-all ${
                activeView === item.id
                  ? 'bg-orange-700 text-white border-l-4 border-yellow-400 shadow-lg'
                  : item.restricted 
                    ? 'text-orange-200 hover:bg-orange-700/50 opacity-75'
                    : 'text-orange-100 hover:bg-orange-700 hover:shadow-md'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm md:text-base flex-1">{item.label}</span>
              {item.restricted && <span className="text-xs opacity-75">🔐</span>}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-orange-400">
          <div className="text-white text-sm">
            <p className="font-medium">{currentUser?.full_name || 'Staff Lead'}</p>
            <p className="text-orange-200 text-xs">{currentUser?.username}</p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6 mt-0 md:mt-0">
        {renderContent()}
      </div>
    </div>
  )
}

export default StaffLeadDashboard
