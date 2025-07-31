-- Add doctor/clinic information to requests table
-- This allows pharmacy to see which clinic/doctor sent the request

ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS doctor_info JSONB DEFAULT '{}'::jsonb;

-- Update existing requests with doctor information
-- Using organization_name instead of full_name since that column doesn't exist
UPDATE requests 
SET doctor_info = (
  SELECT jsonb_build_object(
    'name', COALESCE(
      CASE 
        WHEN u.organization_name LIKE 'Dr.%' THEN 
          -- Extract doctor name from organization_name if it starts with 'Dr.'
          split_part(u.organization_name, ' (', 1)
        ELSE 
          u.email
      END,
      u.email
    ),
    'organization', COALESCE(
      CASE 
        WHEN u.organization_name LIKE 'Dr.%' THEN 
          -- Extract clinic name from organization_name
          split_part(split_part(u.organization_name, '(', 2), ')', 1)
        ELSE 
          u.organization_name
      END,
      ''
    ),
    'email', u.email,
    'phone', COALESCE(u.phone, '')
  )
  FROM users u 
  WHERE u.id = requests.doctor_id
)
WHERE doctor_info = '{}'::jsonb;

-- Create index for doctor_info searches
CREATE INDEX IF NOT EXISTS idx_requests_doctor_info_gin ON requests USING gin (doctor_info);

-- Add comment for documentation
COMMENT ON COLUMN requests.doctor_info IS 'Doctor and clinic information including name, organization, and contact details';

-- Verify the update
SELECT 
  r.id,
  r.doctor_info,
  u.organization_name,
  u.email
FROM requests r
JOIN users u ON u.id = r.doctor_id
LIMIT 5;