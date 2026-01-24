# ClamFlow Frontend - Backend API Integration Guide

**Document Version**: 3.0  
**Last Updated**: January 24, 2026  
**Backend URL**: https://clamflow-backend-production.up.railway.app  
**Full Backend Docs**: See `clamflow_backend/docs/CLAMFLOW_BACKEND_DOCUMENTATION.md`

---

## 🔗 Quick Reference

| Setting | Value |
|---------|-------|
| **Production API** | `https://clamflow-backend-production.up.railway.app` |
| **Auth Type** | JWT Bearer Token |
| **Token Expiry** | 24 hours (1440 minutes) |
| **Content-Type** | `application/json` |

---

## 🔐 Authentication

### Login
```typescript
POST /auth/login

// Request
{ "username": "string", "password": "string" }

// Response
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "string",
    "full_name": "string",
    "role": "Super Admin" | "Admin" | "Production Lead" | ...,
    "is_active": true,
    "requires_password_change": false
  }
}
```

### Using the Token
```typescript
// All authenticated requests must include:
headers: {
  'Authorization': `Bearer ${access_token}`,
  'Content-Type': 'application/json'
}
```

### Change Password
```typescript
POST /auth/change-password
Authorization: Bearer {token}

// Request
{ "current_password": "string", "new_password": "string" }

// Response
{ "success": true, "message": "Password changed successfully" }
```

### Get User Profile
```typescript
GET /user/profile
Authorization: Bearer {token}

// Response (from JWT payload)
{
  "id": "uuid",
  "username": "string",
  "full_name": "string",
  "role": "string",
  "is_active": true
}
```

---

## 👤 Role Hierarchy (9 Tiers)

```
1. Super Admin    → Full system access
2. Admin          → Department management
3. Production Lead → Production oversight
4. QC Lead        → Quality leadership
5. Staff Lead     → HR/People management
6. QC Staff       → Quality workers
7. Production Staff → Floor operations
8. Maintenance Staff → Equipment maintenance
9. Security Guard → Gate control only
```

---

## 📋 Key Endpoints by Feature

### Dashboard Metrics
```typescript
GET /dashboard/metrics          // Admin+ - System metrics
GET /admin-dashboard/stats      // Admin+ - Operational stats
```

### User Management
```typescript
GET    /api/users/                     // List users (paginated)
GET    /api/users/{user_id}            // Get user
POST   /api/users/                     // Create user
PUT    /api/users/{user_id}            // Update user
DELETE /api/users/{user_id}            // Deactivate user

// Query params for GET /api/users/:
// ?skip=0&limit=50&role_filter=Admin&active_only=true&search=name
```

### Super Admin Only
```typescript
GET    /super-admin/admins             // List admins
POST   /super-admin/create-admin       // Create admin
PUT    /super-admin/admins/{id}        // Update admin
DELETE /super-admin/admins/{id}        // Remove admin
```

### Gate & Vehicles
```typescript
GET    /api/gate/vehicles              // Vehicle logs (paginated)
GET    /api/gate/active                // Currently inside vehicles
GET    /api/gate/suppliers             // Supplier deliveries
POST   /api/gate/vehicle-entry         // Log entry + send OTP
POST   /api/gate/verify-otp            // Verify driver OTP
GET    /api/gate/inside-vehicles       // List inside vehicles
PUT    /api/gate/vehicle-exit/{log_id} // Log exit
```

### Lots
```typescript
GET    /lots/                          // List lots
GET    /lots/{lot_id}                  // Get lot
POST   /lots/                          // Create lot
PUT    /lots/{lot_id}                  // Update lot
GET    /lots/{lot_id}/history          // Lot history
```

### Weight Notes
```typescript
GET    /weight-notes/                  // List weight notes
POST   /weight-notes/                  // Create weight note
GET    /weight-notes/{id}              // Get weight note
PUT    /weight-notes/{id}              // Update (QC approval)
```

### PPC Forms
```typescript
GET    /ppc-forms/                     // List forms
POST   /ppc-forms/                     // Create form
GET    /ppc-forms/{id}                 // Get form
PUT    /ppc-forms/{id}                 // Update form
POST   /ppc-forms/{id}/boxes           // Add box
PUT    /ppc-forms/{id}/submit          // Submit for QC
```

### FP Forms
```typescript
GET    /fp-forms/                      // List forms
POST   /fp-forms/                      // Create form
POST   /fp-forms/{id}/boxes            // Add box
```

### Approval Workflow
```typescript
GET    /approval/pending               // Pending approvals
PUT    /approval/{id}/approve          // Approve
PUT    /approval/{id}/reject           // Reject
GET    /approval/history               // History
```

### RFID & Tracking
```typescript
GET    /rfid/tags                      // List tags
POST   /rfid/tags                      // Create tag
POST   /rfid/scan                      // Process scan
GET    /box-tracking/box/{box_id}      // Box history
```

### Staff & Attendance
```typescript
POST   /api/staff/camera-detect        // Face detection
POST   /api/staff/register-face        // Register face
GET    /attendance/today               // Today's attendance
GET    /attendance/person/{id}         // Person history
```

### Onboarding
```typescript
POST   /api/onboarding/                // Submit request
GET    /api/onboarding/pending         // Pending requests
PUT    /api/onboarding/{id}/approve    // Approve (Admin only)
PUT    /api/onboarding/{id}/reject     // Reject (Admin only)
```

### Hardware Admin
```typescript
GET    /api/admin/hardware/stats       // Device statistics
GET    /api/admin/hardware/devices     // List devices
POST   /api/admin/hardware/devices     // Register device
POST   /api/admin/hardware/test/{type} // Test component
GET    /api/admin/hardware/status      // Device status
```

### Security & Analytics
```typescript
GET    /security/cameras               // Camera list
GET    /security/events                // Security events
GET    /security/face-detection        // Face detection logs
GET    /analytics/production           // Production analytics
GET    /analytics/quality              // Quality metrics
```

---

## 📦 Standard Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "total_count": 150,
  "page": 1,
  "page_size": 50,
  "total_pages": 3
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "detail": "Detailed error message"
}
```

### Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 🛠️ TypeScript Integration

### API Service Setup
```typescript
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL || 'https://clamflow-backend-production.up.railway.app';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return response.json();
}
```

### Auth Context
```typescript
// src/contexts/AuthContext.tsx
interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### Role Guard Hook
```typescript
// src/hooks/useRole.ts
export function useRole() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  const hasRole = (roles: string[]) => user && roles.includes(user.role);
  
  const isSuperAdmin = () => user?.role === 'Super Admin';
  const isAdmin = () => ['Super Admin', 'Admin'].includes(user?.role);
  const isLead = () => ['Super Admin', 'Admin', 'Production Lead', 'QC Lead', 'Staff Lead'].includes(user?.role);
  
  return { user, hasRole, isSuperAdmin, isAdmin, isLead };
}
```

---

## 🔧 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=https://clamflow-backend-production.up.railway.app
VITE_APP_TITLE=ClamFlow
VITE_ENVIRONMENT=production
```

### Development (.env.development)
```bash
VITE_API_URL=http://localhost:8080
VITE_ENVIRONMENT=development
```

---

## ⚠️ Error Handling Reference

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Process created resource |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show access denied |
| 404 | Not Found | Show not found message |
| 422 | Validation Error | Display field errors |
| 500 | Server Error | Show generic error, check logs |

---

## 📱 Mobile/Responsive Considerations

All endpoints support standard REST patterns and return JSON. Mobile apps should:
1. Store JWT token securely (not in localStorage)
2. Handle token refresh before expiry (24hr)
3. Cache user role for UI decisions
4. Handle offline states gracefully

---

*For complete backend documentation including all models and schemas, see:*  
`clamflow_backend/docs/CLAMFLOW_BACKEND_DOCUMENTATION.md`

---
*Last updated: January 24, 2026*
