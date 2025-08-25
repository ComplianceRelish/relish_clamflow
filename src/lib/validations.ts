// Comprehensive Zod Validation Schemas for ClamFlow
import { z } from 'zod'

// Base validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format')
const positiveNumberSchema = z.number().positive('Must be a positive number')
const emailSchema = z.string().email('Invalid email format')
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')

// Grade and Product Type Enums
const productGradeSchema = z.enum(['A', 'B', 'C'], {
  errorMap: () => ({ message: 'Grade must be A, B, or C' })
})

const productTypeSchema = z.enum(['whole_clam', 'clam_meat', 'clam_shell', 'processed_clam'], {
  errorMap: () => ({ message: 'Invalid product type' })
})

const processingMethodSchema = z.enum(['freezing', 'drying', 'chilling', 'pasteurization', 'smoking'], {
  errorMap: () => ({ message: 'Invalid processing method' })
})

// User Role Schema
const userRoleSchema = z.enum([
  'admin',
  'plant_manager', 
  'production_lead',
  'staff_lead',
  'qc_lead',
  'qc_staff',
  'station_staff',
  'security_guard',
  'gate_control',
  'qa_technician'
], {
  errorMap: () => ({ message: 'Invalid user role' })
})

// Weight Note Validation Schema
export const weightNoteSchema = z.object({
  lot_id: uuidSchema,
  supplier_id: uuidSchema,
  box_number: z.string()
    .min(1, 'Box number is required')
    .max(50, 'Box number too long')
    .regex(/^[A-Z0-9_-]+$/, 'Box number can only contain letters, numbers, hyphens and underscores'),
  weight: z.number()
    .positive('Weight must be positive')
    .max(1000, 'Weight cannot exceed 1000kg')
    .multipleOf(0.1, 'Weight must be to 1 decimal place'),
  qc_staff_id: uuidSchema,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  temperature: z.number()
    .min(-50, 'Temperature too low')
    .max(50, 'Temperature too high')
    .optional(),
  moisture_content: z.number()
    .min(0, 'Moisture content cannot be negative')
    .max(100, 'Moisture content cannot exceed 100%')
    .optional()
}).refine(data => {
  // Custom validation: if temperature is provided, it should be reasonable for seafood
  if (data.temperature !== undefined) {
    return data.temperature >= -18 && data.temperature <= 4
  }
  return true
}, {
  message: 'Temperature should be between -18°C and 4°C for seafood storage',
  path: ['temperature']
})

// PPC Form Validation Schema
export const ppcBoxSchema = z.object({
  box_number: z.string().min(1, 'Box number required'),
  product_type: productTypeSchema,
  grade: productGradeSchema,
  weight: positiveNumberSchema.max(50, 'Individual box weight cannot exceed 50kg'),
  temperature: z.number().min(-50).max(50).optional(),
  batch_id: z.string().optional()
})

export const ppcFormSchema = z.object({
  lot_id: uuidSchema,
  station_staff_id: uuidSchema,
  boxes: z.array(ppcBoxSchema)
    .min(1, 'At least one box is required')
    .max(100, 'Cannot process more than 100 boxes at once'),
  total_boxes: z.number().int().positive('Total boxes must be positive'),
  total_weight: positiveNumberSchema.max(2000, 'Total weight cannot exceed 2000kg'),
  quality_notes: z.string().max(1000, 'Quality notes cannot exceed 1000 characters').optional(),
  processing_method: processingMethodSchema.optional(),
  operator_signature: z.string().optional()
}).refine(data => {
  // Validate that total_boxes matches the number of boxes
  return data.total_boxes === data.boxes.length
}, {
  message: 'Total boxes count must match the number of boxes provided',
  path: ['total_boxes']
}).refine(data => {
  // Validate that total_weight is approximately equal to sum of individual box weights
  const calculatedWeight = data.boxes.reduce((sum, box) => sum + box.weight, 0)
  const difference = Math.abs(data.total_weight - calculatedWeight)
  return difference <= 1 // Allow 1kg tolerance
}, {
  message: 'Total weight must match the sum of individual box weights (±1kg tolerance)',
  path: ['total_weight']
})

// FP Form Validation Schema
export const fpBoxSchema = z.object({
  final_box_number: z.string().min(1, 'Final box number required'),
  original_box_numbers: z.array(z.string()).min(1, 'At least one original box number required'),
  product_type: productTypeSchema,
  grade: productGradeSchema,
  weight: positiveNumberSchema.max(50, 'Individual box weight cannot exceed 50kg'),
  processing_date: z.string().datetime('Invalid processing date format'),
  expiry_date: z.string().datetime('Invalid expiry date format')
}).refine(data => {
  // Validate that expiry date is after processing date
  const processingDate = new Date(data.processing_date)
  const expiryDate = new Date(data.expiry_date)
  return expiryDate > processingDate
}, {
  message: 'Expiry date must be after processing date',
  path: ['expiry_date']
})

export const fpFormSchema = z.object({
  lot_id: uuidSchema,
  station_staff_id: uuidSchema,
  final_boxes: z.array(fpBoxSchema)
    .min(1, 'At least one final box is required')
    .max(100, 'Cannot process more than 100 boxes at once'),
  total_boxes: z.number().int().positive(),
  total_weight: positiveNumberSchema.max(2000, 'Total weight cannot exceed 2000kg'),
  processing_method: processingMethodSchema,
  temperature: z.number()
    .min(-50, 'Temperature too low')
    .max(100, 'Temperature too high'),
  duration_minutes: z.number()
    .int('Duration must be in whole minutes')
    .positive('Duration must be positive')
    .max(1440, 'Duration cannot exceed 24 hours'),
  operator_signature: z.string().optional()
}).refine(data => {
  return data.total_boxes === data.final_boxes.length
}, {
  message: 'Total boxes count must match the number of final boxes',
  path: ['total_boxes']
}).refine(data => {
  const calculatedWeight = data.final_boxes.reduce((sum, box) => sum + box.weight, 0)
  const difference = Math.abs(data.total_weight - calculatedWeight)
  return difference <= 1
}, {
  message: 'Total weight must match the sum of final box weights (±1kg tolerance)',
  path: ['total_weight']
})

// Sample Extraction Validation Schema
export const sampleExtractionSchema = z.object({
  lot_id: uuidSchema,
  tank_location: z.string()
    .min(1, 'Tank location is required')
    .max(100, 'Tank location too long'),
  sample_type: z.enum(['water', 'clam', 'sediment'], {
    errorMap: () => ({ message: 'Sample type must be water, clam, or sediment' })
  }),
  extracted_by: uuidSchema,
  extraction_method: z.string()
    .min(1, 'Extraction method is required')
    .max(200, 'Extraction method description too long'),
  sample_volume: z.number()
    .positive('Sample volume must be positive')
    .max(10000, 'Sample volume cannot exceed 10L'),
  extraction_notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  collection_datetime: z.string().datetime('Invalid collection date/time format')
}).refine(data => {
  // Validate that collection datetime is not in the future
  const collectionTime = new Date(data.collection_datetime)
  const now = new Date()
  return collectionTime <= now
}, {
  message: 'Collection date/time cannot be in the future',
  path: ['collection_datetime']
})

// Depuration Form Validation Schema
export const waterQualityMetricsSchema = z.object({
  temperature: z.number().min(0).max(40, 'Water temperature too high for depuration'),
  salinity: z.number().min(0).max(50, 'Salinity level too high'),
  ph_level: z.number().min(6).max(9, 'pH level outside acceptable range (6-9)'),
  dissolved_oxygen: z.number().min(0).max(20, 'Dissolved oxygen level too high'),
  turbidity: z.number().min(0).max(100, 'Turbidity level too high'),
  bacterial_count: z.number().min(0).optional()
})

export const depurationFormSchema = z.object({
  lot_id: uuidSchema,
  tank_id: z.string().min(1, 'Tank ID is required'),
  start_datetime: z.string().datetime('Invalid start date/time format'),
  end_datetime: z.string().datetime('Invalid end date/time format'),
  water_quality_metrics: waterQualityMetricsSchema,
  technician_id: uuidSchema,
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional()
}).refine(data => {
  // Validate that end datetime is after start datetime
  const startTime = new Date(data.start_datetime)
  const endTime = new Date(data.end_datetime)
  return endTime > startTime
}, {
  message: 'End time must be after start time',
  path: ['end_datetime']
}).refine(data => {
  // Validate minimum depuration duration (typically 24-48 hours)
  const startTime = new Date(data.start_datetime)
  const endTime = new Date(data.end_datetime)
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  return durationHours >= 24
}, {
  message: 'Depuration process must be at least 24 hours',
  path: ['end_datetime']
})

// Authentication Validation Schemas
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
  remember_me: z.boolean().optional().default(false)
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string().min(1, 'Please confirm your password')
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
})

// Onboarding Validation Schemas
export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  relationship: z.string().min(2, 'Relationship must be specified'),
  phone: phoneSchema,
  email: emailSchema.optional()
})

export const staffOnboardingSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name too long'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name too long'),
  email: emailSchema,
  phone: phoneSchema,
  employee_id: z.string()
    .min(3, 'Employee ID must be at least 3 characters')
    .max(20, 'Employee ID too long')
    .regex(/^[A-Z0-9_-]+$/, 'Employee ID can only contain uppercase letters, numbers, hyphens and underscores'),
  role: userRoleSchema,
  department: z.string().min(2, 'Department must be specified').max(100, 'Department name too long'),
  start_date: z.string().date('Invalid start date format'),
  emergency_contact: emergencyContactSchema
}).refine(data => {
  // Validate that start date is not in the past (more than 1 month ago)
  const startDate = new Date(data.start_date)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  return startDate >= oneMonthAgo
}, {
  message: 'Start date cannot be more than 1 month in the past',
  path: ['start_date']
})

export const supplierOnboardingSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(200, 'Company name too long'),
  contact_person: z.string().min(2, 'Contact person name required').max(100, 'Contact person name too long'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(10, 'Complete address is required').max(500, 'Address too long'),
  license_numbers: z.array(z.string()).min(1, 'At least one license number is required'),
  certifications: z.array(z.string()),
  boat_details: z.object({
    vessel_name: z.string().min(2, 'Vessel name required').max(100, 'Vessel name too long'),
    registration_number: z.string().min(5, 'Registration number required').max(50, 'Registration number too long'),
    capacity: z.number().positive('Vessel capacity must be positive').max(10000, 'Vessel capacity too large'),
    captain_name: z.string().min(2, 'Captain name required').max(100, 'Captain name too long'),
    captain_license: z.string().min(5, 'Captain license required').max(50, 'Captain license too long')
  }).optional(),
  banking_info: z.object({
    bank_name: z.string().min(2, 'Bank name required').max(100, 'Bank name too long'),
    account_number: z.string().min(8, 'Account number too short').max(20, 'Account number too long'),
    ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
    account_holder_name: z.string().min(2, 'Account holder name required').max(100, 'Account holder name too long')
  })
})

export const vendorOnboardingSchema = z.object({
  firm_name: z.string().min(2, 'Firm name must be at least 2 characters').max(200, 'Firm name too long'),
  category: z.enum(['equipment', 'packaging', 'chemicals', 'services'], {
    errorMap: () => ({ message: 'Invalid vendor category' })
  }),
  contact_person: z.string().min(2, 'Contact person name required').max(100, 'Contact person name too long'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(10, 'Complete address is required').max(500, 'Address too long'),
  gst_number: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format')
    .optional(),
  pan_number: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format')
    .optional(),
  certifications: z.array(z.string()),
  services_offered: z.array(z.string()).min(1, 'At least one service must be specified')
})

// RFID Validation Schemas
export const rfidScanDataSchema = z.object({
  rfid_tag: z.string()
    .min(8, 'RFID tag must be at least 8 characters')
    .max(50, 'RFID tag too long')
    .regex(/^[A-Z0-9]+$/, 'RFID tag can only contain uppercase letters and numbers'),
  box_number: z.string().optional(),
  timestamp: z.string().datetime('Invalid timestamp format'),
  scan_type: z.enum(['attendance', 'gate-exit', 'gate-entry', 'box-tracking'], {
    errorMap: () => ({ message: 'Invalid scan type' })
  })
})

// Search and Filter Validation Schemas
export const searchFiltersSchema = z.object({
  query: z.string().max(200, 'Search query too long').optional(),
  date_from: z.string().date('Invalid date format').optional(),
  date_to: z.string().date('Invalid date format').optional(),
  status: z.array(z.string()).optional(),
  plant_id: uuidSchema.optional(),
  operator_id: uuidSchema.optional(),
  product_type: z.string().optional(),
  grade: z.array(productGradeSchema).optional()
}).refine(data => {
  // Validate that date_to is after date_from
  if (data.date_from && data.date_to) {
    return new Date(data.date_to) >= new Date(data.date_from)
  }
  return true
}, {
  message: 'End date must be on or after start date',
  path: ['date_to']
})

export const paginationParamsSchema = z.object({
  page: z.number().int().positive('Page must be a positive integer'),
  per_page: z.number().int().positive('Items per page must be positive').max(100, 'Cannot request more than 100 items per page'),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc')
})

// File Upload Validation Schema
export const fileUploadSchema = z.object({
  entity_type: z.enum(['weight_note', 'ppc_form', 'fp_form', 'onboarding', 'certificate'], {
    errorMap: () => ({ message: 'Invalid entity type for file upload' })
  }),
  entity_id: uuidSchema.optional(),
  file_type: z.enum(['document', 'image', 'certificate', 'report'], {
    errorMap: () => ({ message: 'Invalid file type' })
  }),
  description: z.string().max(200, 'File description too long').optional()
})

// Export all schemas with proper types
export type WeightNoteValidation = z.infer<typeof weightNoteSchema>
export type PPCFormValidation = z.infer<typeof ppcFormSchema>
export type FPFormValidation = z.infer<typeof fpFormSchema>
export type SampleExtractionValidation = z.infer<typeof sampleExtractionSchema>
export type DepurationFormValidation = z.infer<typeof depurationFormSchema>
export type LoginValidation = z.infer<typeof loginSchema>
export type StaffOnboardingValidation = z.infer<typeof staffOnboardingSchema>
export type SupplierOnboardingValidation = z.infer<typeof supplierOnboardingSchema>
export type VendorOnboardingValidation = z.infer<typeof vendorOnboardingSchema>
export type RFIDScanValidation = z.infer<typeof rfidScanDataSchema>

// Validation helper functions
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
} => {
  try {
    const validData = schema.parse(data)
    return { success: true, data: validData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        if (!errors[path]) {
          errors[path] = []
        }
        errors[path].push(err.message)
      })
      return { success: false, errors }
    }
    return { success: false, errors: { general: ['Validation failed'] } }
  }
}

// Schema validation middleware helper
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown) => validateData(schema, data)
}