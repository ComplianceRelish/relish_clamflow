-- Fix Super Admin Credentials
-- Change username from 'admin' to 'SA_Motty'
-- Change password from old hash to 'Phes0061' (will be hashed by backend)

-- Update the existing admin user
UPDATE users 
SET 
  username = 'SA_Motty',
  email = 'sa_motty@clamflow.com',
  full_name = 'Super Admin - Motty',
  password_reset_required = false,
  updated_at = NOW()
WHERE username = 'admin';

-- Verify the change
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  password_reset_required
FROM users 
WHERE username = 'SA_Motty';
