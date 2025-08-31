# ClamFlow Frontend - Comprehensive User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
3. [Authentication System](#authentication-system)
4. [Operational Workflow](#operational-workflow)
5. [Backend Integrations](#backend-integrations)
6. [Hardware Configurations](#hardware-configurations)
7. [Database Structure](#database-structure)
8. [Feature Documentation](#feature-documentation)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

**ClamFlow Frontend** is a comprehensive Next.js 14 application with TypeScript, designed for clam processing plant management. The system provides role-based access control for 8 different user types, real-time operational tracking, and hardware integration capabilities.

### Key Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Authentication**: JWT with Railway backend + fallback credentials
- **Database**: PostgreSQL with Supabase
- **Styling**: Tailwind CSS
- **PWA**: Progressive Web App capabilities
- **Backend API**: FastAPI on Railway (https://clamflowbackend-production.up.railway.app)

---

## Role-Based Access Control (RBAC)

### 1. User Roles Hierarchy

The system implements 8 distinct user roles with specific permissions:

#### **Super Admin** (Highest Level)
- **Access**: Full system control
- **Permissions**: 
  - User management (create, edit, delete)
  - System configuration
  - Hardware configuration
  - All dashboards and modules
  - Onboarding management (staff, vendors, suppliers)
  - Shift scheduling and station assignment
- **Dashboard**: Super Admin Dashboard with system health monitoring
- **Navigation**: All modules available

#### **Admin** (Second Level)
- **Access**: Administrative functions without system configuration
- **Permissions**:
  - User management (limited)
  - Dashboard access
  - Reports and analytics
  - Onboarding management
  - Shift scheduling
- **Dashboard**: Admin Dashboard with user management panels
- **Navigation**: Most modules except system configuration

#### **Production Lead**
- **Access**: Production management and oversight
- **Permissions**:
  - Lot management
  - Weight notes supervision
  - Staff onboarding
  - Shift scheduling
  - RFID tracking
  - Production dashboards
- **Navigation**: Production-focused modules

#### **QC Lead** (Quality Control Lead)
- **Access**: Quality control oversight
- **Permissions**:
  - PPC and FP form management
  - Quality control dashboards
  - Shift scheduling
  - RFID tracking
  - Sample extraction oversight
- **Navigation**: QC-focused modules

#### **Staff Lead**
- **Access**: Staff management
- **Permissions**:
  - Staff onboarding
  - Basic operational tools
  - Limited dashboard access
- **Navigation**: Staff management modules

#### **Production Staff**
- **Access**: Operational tasks
- **Permissions**:
  - Weight notes entry
  - Lot management (limited)
  - Washing and depuration operations
  - Basic inventory access
- **Navigation**: Operational modules only

#### **QC Staff** (Quality Control Staff)
- **Access**: Quality control tasks
- **Permissions**:
  - PPC and FP form completion
  - Sample extraction
  - Quality inspections
  - Basic inventory access
- **Navigation**: QC operational modules

#### **Security Guard**
- **Access**: Security and access control
- **Permissions**:
  - Access monitoring
  - Basic system interaction
  - Limited operational visibility
- **Navigation**: Security-focused modules

### 2. Role-Based Navigation

Navigation is dynamically filtered based on user roles:

```typescript
// Example from Sidebar.tsx
const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['all'] },
  { href: '/weight-notes', label: 'Weight Notes', icon: '⚖️', roles: ['production_staff', 'gatekeeper'] },
  { href: '/lots', label: 'Lot Management', icon: '📦', roles: ['production_staff', 'production_lead'] },
  { href: '/ppc', label: 'PPC Forms', icon: '📋', roles: ['qc_staff', 'qc_lead'] },
  { href: '/fp', label: 'FP Forms', icon: '📄', roles: ['qc_staff', 'qc_lead'] },
  { href: '/rfid', label: 'RFID Tracking', icon: '🏷️', roles: ['production_lead', 'qc_lead'] },
]
```

### 3. Authorization Enforcement

Authorization is enforced at multiple levels:
- **Middleware Level**: Route protection in `middleware/auth.ts`
- **Component Level**: Role checks in individual components
- **Page Level**: Role verification before rendering
- **API Level**: Backend validation for all operations

---

## Authentication System

### 1. Authentication Flow

#### Primary Authentication (Railway Backend)
1. User submits credentials via login form
2. Frontend sends POST request to Railway backend API
3. Backend validates credentials against PostgreSQL database
4. Returns JWT token + user profile data
5. Frontend stores token and user data in localStorage
6. AuthContext provides authentication state across app

#### Fallback Authentication (Enterprise Credentials)
If Railway backend is unavailable, system falls back to hardcoded enterprise credentials:

```typescript
const enterpriseCredentials = [
  { username: 'SA_Motty', password: 'Phes0061', role: 'Super Admin', fullName: 'Super Admin - Motty' },
  { username: 'admin', password: 'admin123', role: 'Admin', fullName: 'System Administrator' },
  { username: 'demo', password: 'demo123', role: 'QC Lead', fullName: 'Demo User' }
]
```

### 2. Authentication Components

#### AuthContext (`src/context/AuthContext.tsx`)
- **Purpose**: Central authentication state management
- **Features**:
  - JWT token management
  - User profile storage
  - Login/logout functionality
  - Automatic token validation
  - Role-based access control

#### Login Page (`src/app/login/page.tsx`)
- **Features**:
  - Responsive login form
  - Error handling and validation
  - Loading states
  - Automatic redirect after login
  - PWA-optimized design

#### Middleware Protection (`src/middleware/auth.ts`)
- **Purpose**: Server-side route protection
- **Features**:
  - Role-based route access
  - Session validation
  - Automatic login redirects
  - Public route handling

### 3. Session Management
- **Storage**: localStorage for persistence
- **Validation**: JWT token expiration checking
- **Refresh**: Automatic token refresh on API calls
- **Logout**: Complete session cleanup

---

## Operational Workflow

### 1. Daily Operations Flow

#### Morning Startup
1. **Staff Login**: Biometric or credential-based authentication
2. **Shift Assignment**: Production/QC Leads assign staff to stations
3. **Equipment Check**: Hardware status verification
4. **Lot Initialization**: Create new production lots for the day

#### Production Process
1. **Weight Notes Creation**: Staff record incoming material weights
2. **Lot Management**: Track materials through processing stages
3. **Station Operations**: 
   - Washing stations (Production Staff)
   - Depuration tanks (Production Staff)
   - Quality control checkpoints (QC Staff)

#### Quality Control
1. **PPC Forms**: Pre-Processing Control forms by QC Staff
2. **FP Forms**: Final Product forms by QC Staff
3. **Sample Extraction**: Automated or manual sampling
4. **RFID Tracking**: Product tracking through facility

#### End of Day
1. **Inventory Updates**: Final counts and reconciliation
2. **Shift Reports**: Production and QC summaries
3. **Data Backup**: Automatic backend synchronization

### 2. Station-Based Workflow

#### **Washing Stations (T1-T4)**
- **Staff**: Production Staff
- **Operations**: 
  - Clam washing and cleaning
  - Weight documentation
  - Quality inspection
- **Forms**: Weight notes, basic QC checks

#### **Processing Stations (T5-T8)**
- **Staff**: Production Staff + QC oversight
- **Operations**:
  - Advanced processing
  - Size grading
  - Packaging preparation
- **Forms**: PPC forms, processing logs

#### **Quality Control Stations**
- **Staff**: QC Staff, QC Lead
- **Operations**:
  - Sample collection
  - Laboratory testing
  - Final product approval
- **Forms**: FP forms, quality certificates

#### **Packaging & Shipping**
- **Staff**: Production Staff + QC final approval
- **Operations**:
  - Final packaging
  - RFID label application
  - Shipping documentation
- **Forms**: Shipping manifests, quality certificates

### 3. Approval Workflows

#### Production Approvals
1. **Initial QC**: QC Staff performs first-level checks
2. **Lead Review**: QC Lead reviews and approves/rejects
3. **Final Approval**: Admin/Super Admin final sign-off
4. **Documentation**: Digital signatures and timestamps

#### Administrative Approvals
1. **User Onboarding**: Staff Lead initiates, Admin approves
2. **System Changes**: Super Admin exclusive approval
3. **Emergency Override**: Super Admin emergency access

---

## Backend Integrations

### 1. Railway Backend API

#### **Base URL**: `https://clamflowbackend-production.up.railway.app`

#### **Authentication Endpoints**
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `GET /auth/profile` - User profile retrieval
- `POST /auth/refresh` - Token refresh

#### **Core Endpoints**
- `GET/POST /lots` - Lot management
- `GET/POST /weight-notes` - Weight tracking
- `GET/POST /ppc-forms` - Pre-processing control
- `GET/POST /fp-forms` - Final product forms
- `GET/POST /users` - User management
- `GET/POST /hardware-configs` - Hardware management

#### **Real-time Features**
- WebSocket connections for live updates
- Server-sent events for notifications
- Automatic data synchronization

### 2. Supabase Integration

#### **Primary Use**: Backup and additional data services
- Real-time subscriptions
- File storage for documents
- Database triggers and functions
- Row-level security

#### **Configuration**: `src/lib/supabase.ts`
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. API Client Architecture

#### **Centralized Client**: `src/lib/api-client.ts`
- Automatic authentication header injection
- Error handling and retry logic
- Request/response interceptors
- Loading state management

#### **Service Layer**: Individual service files
- `src/services/fp-service.ts` - FP form operations
- `src/services/ppc-service.ts` - PPC form operations
- `src/services/weight-note-service.ts` - Weight tracking
- `src/services/inventory-service.ts` - Inventory management

---

## Hardware Configurations

### 1. Biometric Authentication (ClamFlowSecure)

#### **Face Recognition System**
- **Purpose**: Staff authentication at workstations
- **Configuration**: Admin-controlled via hardware dashboard
- **Integration**: `src/components/integrations/ClamFlowSecure.tsx`
- **Features**:
  - Real-time face detection
  - Confidence scoring
  - Multi-user enrollment
  - Automatic session management

#### **Fingerprint Scanners**
- **Purpose**: Secondary authentication method
- **Locations**: Entry points and critical stations
- **Management**: Centralized through admin panel

### 2. RFID System

#### **Components**
- **RFID Readers**: Station-mounted for product tracking
- **RFID Tags**: Product labeling and tracking
- **Integration**: `src/components/integrations/RFIDScanner.tsx`

#### **Functionality**
- Product lot tracking
- Station-to-station movement
- Inventory automation
- Quality control checkpoints

#### **Management**
- Admin configuration of RFID readers
- Tag assignment and tracking
- Real-time location monitoring

### 3. QR Code System

#### **Label Generation**: `src/components/integrations/QRLabelGenerator.tsx`
- Dynamic QR code creation
- Product information encoding
- Batch processing capabilities
- Custom label formats

#### **Scanning Integration**
- Mobile device compatibility
- Instant product lookup
- Inventory verification
- Quality control validation

### 4. Hardware Status Monitoring

#### **System Health Dashboard**
- Real-time hardware status
- Connection monitoring
- Error reporting and alerts
- Maintenance scheduling

#### **Configuration Management**
- Hardware device registration
- Settings synchronization
- Firmware update management
- Performance analytics

---

## Database Structure

### 1. Core Tables

#### **user_profiles**
- Primary user authentication and profile data
- Role assignment and permissions
- Department and plant associations
- Activity tracking and session management

#### **lots**
- Production lot tracking
- Material source and destination
- Processing stage management
- Quality control checkpoints

#### **weight_notes**
- Material weight documentation
- Incoming and outgoing weights
- Staff recording and verification
- Integration with lot management

#### **ppc_forms** (Pre-Processing Control)
- Quality control before processing
- Inspection checklists and results
- Staff assignments and approvals
- Regulatory compliance tracking

#### **fp_forms** (Final Product)
- End-product quality control
- Certification and approval workflows
- Shipping and packaging documentation
- Customer quality assurance

#### **attendance_logs**
- Staff check-in/check-out tracking
- Biometric authentication records
- Shift scheduling and assignments
- Labor cost calculation

#### **hardware_configurations**
- Device registration and settings
- Status monitoring and alerts
- Maintenance schedules and logs
- Performance metrics and analytics

### 2. Relationships

#### **User-Centric Relations**
- Users → Lots (creator/assigned)
- Users → Weight Notes (recorder)
- Users → Forms (creator/approver)
- Users → Attendance (staff member)

#### **Production Flow Relations**
- Lots → Weight Notes (material tracking)
- Lots → PPC Forms (quality control)
- Lots → FP Forms (final approval)
- Hardware → All Operations (device tracking)

### 3. Data Flow

#### **Operational Data**
1. Staff authentication → User profiles
2. Material receipt → Weight notes → Lot creation
3. Processing stages → PPC forms → Quality checkpoints
4. Final processing → FP forms → Product approval
5. Hardware interactions → Configuration logs

#### **Reporting Data**
- Aggregated production metrics
- Quality control statistics
- Staff performance tracking
- Hardware utilization reports

---

## Feature Documentation

### 1. Interactive Shift Scheduling

#### **Purpose**: Visual staff assignment and shift management

#### **Features**:
- **Drag-and-Drop Interface**: Intuitive staff assignment
- **Calendar View**: Weekly and monthly shift planning
- **Role-Based Filtering**: Show relevant staff by department
- **Availability Tracking**: Real-time staff availability
- **Skill Matching**: Assign staff based on station requirements

#### **Access Control**:
- **Authorized Roles**: Production Lead, QC Lead, Admin, Super Admin
- **Functionality**: Create, modify, and delete shift assignments
- **Restrictions**: Staff cannot modify their own schedules

#### **File Location**: `src/app/shift-scheduling/page.tsx`

### 2. Interactive Station Assignment

#### **Purpose**: Real-time station staffing and management

#### **Features**:
- **Plant Selection**: Switch between PPC and FP plants
- **Station Mapping**: Visual representation of production floor
- **Staff Allocation**: Assign staff to specific stations
- **Skill Verification**: Ensure staff qualifications match station requirements
- **Real-time Updates**: Live status of station assignments

#### **Access Control**:
- **Authorized Roles**: Production Lead, QC Lead, Admin, Super Admin
- **Functionality**: Station assignment and monitoring
- **Restrictions**: Role-based station access

#### **File Location**: `src/components/InteractiveStationAssignment.tsx`

### 3. Onboarding Systems

#### **Staff Onboarding** (`src/pages/onboarding/staff.tsx`)
- **Purpose**: New employee registration and setup
- **Features**: Personal information, role assignment, system access
- **Access**: Super Admin, Admin, Production Lead, Staff Lead

#### **Vendor Onboarding** (`src/pages/onboarding/vendor.tsx`)
- **Purpose**: Vendor registration and compliance tracking
- **Features**: Company information, certifications, quality standards
- **Access**: Super Admin, Admin, Production Lead, Staff Lead

#### **Supplier Onboarding** (`src/pages/onboarding/supplier.tsx`)
- **Purpose**: Raw material supplier registration
- **Features**: Supplier details, quality requirements, delivery schedules
- **Access**: Super Admin, Admin, Production Lead, Staff Lead

### 4. Dashboard Systems

#### **Super Admin Dashboard**
- **System Health Monitoring**: Hardware status, API connectivity
- **User Management**: Create, edit, delete user accounts
- **System Configuration**: Application settings and parameters
- **Analytics and Reporting**: Comprehensive system metrics

#### **Admin Dashboard**
- **User Management Panel**: User administration (limited)
- **Operational Oversight**: Production and quality metrics
- **Report Generation**: Standard operational reports
- **System Monitoring**: Basic health checks

### 5. Form Management

#### **PPC Forms** (Pre-Processing Control)
- **Digital Forms**: Tablet/mobile optimized
- **Validation Rules**: Automatic data validation
- **Approval Workflow**: Multi-level approval process
- **Integration**: Automatic lot and weight note linking

#### **FP Forms** (Final Product)
- **Quality Certification**: Final product approval
- **Regulatory Compliance**: Food safety requirements
- **Digital Signatures**: Electronic approval process
- **Export Capabilities**: PDF generation and archiving

### 6. Hardware Integration

#### **ClamFlowSecure Biometric**
- **Face Recognition**: Real-time authentication
- **Session Management**: Automatic login/logout
- **Security Events**: Logging and monitoring
- **Multi-device Support**: Multiple authentication points

#### **RFID Integration**
- **Product Tracking**: Real-time location monitoring
- **Inventory Management**: Automatic stock updates
- **Quality Control**: Checkpoint verification
- **Reporting**: Movement and location reports

#### **QR Code System**
- **Label Generation**: Dynamic QR code creation
- **Product Information**: Embedded data encoding
- **Mobile Scanning**: Smartphone compatibility
- **Inventory Verification**: Quick stock checks

---

## Troubleshooting Guide

### 1. Authentication Issues

#### **Problem**: Cannot log in with valid credentials
**Solution**:
1. Check internet connectivity
2. Verify Railway backend status
3. Try fallback credentials if backend is down
4. Clear browser cache and localStorage
5. Check console for error messages

#### **Problem**: Session expires frequently
**Solution**:
1. Check JWT token expiration settings
2. Verify localStorage permissions
3. Ensure stable internet connection
4. Contact system administrator for token refresh settings

### 2. Hardware Integration Issues

#### **Problem**: Biometric authentication not working
**Solution**:
1. Check hardware connection status
2. Verify device drivers and software
3. Test with known good user profile
4. Check hardware configuration in admin panel
5. Restart ClamFlowSecure service

#### **Problem**: RFID scanner not detecting tags
**Solution**:
1. Check scanner power and connectivity
2. Verify RFID tag compatibility
3. Test scanner with known good tags
4. Check scanner configuration settings
5. Verify antenna positioning and range

### 3. Performance Issues

#### **Problem**: Slow application loading
**Solution**:
1. Check internet connection speed
2. Clear browser cache
3. Disable unnecessary browser extensions
4. Check backend API response times
5. Verify database connection status

#### **Problem**: Form submission failures
**Solution**:
1. Check required field validation
2. Verify network connectivity
3. Check backend API status
4. Review form data for conflicts
5. Try submitting with different user role

### 4. Role and Permission Issues

#### **Problem**: Access denied for authorized features
**Solution**:
1. Verify user role assignment
2. Check role permissions in admin panel
3. Log out and log back in
4. Contact administrator for role verification
5. Check middleware route protection settings

#### **Problem**: Navigation items missing
**Solution**:
1. Verify user role matches required permissions
2. Check role-based navigation configuration
3. Clear browser cache and reload
4. Verify user account is active
5. Contact administrator for role review

### 5. Data Synchronization Issues

#### **Problem**: Data not updating in real-time
**Solution**:
1. Check WebSocket connection status
2. Verify backend API connectivity
3. Refresh browser page
4. Check for JavaScript errors in console
5. Verify database connection health

#### **Problem**: Form data not saving
**Solution**:
1. Check required field validation
2. Verify backend API endpoints
3. Check network connectivity
4. Review browser console for errors
5. Try resubmitting with valid data

---

## System Administration

### 1. User Management
- **Creation**: Admin/Super Admin can create new users
- **Role Assignment**: Proper role hierarchy enforcement
- **Deactivation**: Soft delete maintains data integrity
- **Permission Updates**: Real-time permission changes

### 2. Hardware Management
- **Device Registration**: Add new hardware to system
- **Configuration**: Centralized settings management
- **Monitoring**: Real-time status and health checks
- **Maintenance**: Scheduled maintenance and updates

### 3. System Monitoring
- **Health Checks**: Automated system health monitoring
- **Performance Metrics**: Response time and throughput tracking
- **Error Logging**: Comprehensive error tracking and reporting
- **Usage Analytics**: User activity and feature utilization

### 4. Data Backup and Recovery
- **Automated Backups**: Regular data backup to multiple locations
- **Recovery Procedures**: Step-by-step data recovery processes
- **Data Integrity**: Validation and consistency checks
- **Disaster Recovery**: Emergency procedures and protocols

---

## Security Considerations

### 1. Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Policies**: Strong password requirements
- **Session Management**: Secure session handling and timeouts
- **Biometric Security**: Hardware-level authentication

### 2. Data Protection
- **Encryption**: Data encryption in transit and at rest
- **Access Control**: Role-based data access restrictions
- **Audit Logging**: Comprehensive activity logging
- **Privacy Compliance**: GDPR and food safety compliance

### 3. Network Security
- **HTTPS**: Secure communication protocols
- **API Security**: Authenticated and authorized API access
- **Firewall Configuration**: Network-level security measures
- **Intrusion Detection**: Monitoring and alerting systems

---

## Contact and Support

### Technical Support
- **System Administrator**: Contact for user account and permission issues
- **Hardware Support**: For biometric, RFID, and scanner issues
- **Application Support**: For software functionality and bug reports

### Emergency Procedures
- **System Down**: Fallback authentication and manual procedures
- **Hardware Failure**: Backup authentication methods
- **Data Loss**: Recovery procedures and backup restoration

---

*Last Updated: December 2024*
*Version: 1.0*
*ClamFlow Frontend User Manual*
