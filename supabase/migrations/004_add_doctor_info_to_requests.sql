-- Add doctor/clinic information to requests table
-- This allows pharmacy to see which clinic/doctor sent the request

ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS doctor_info JSONB DEFAULT '{}'::jsonb;

-- Update existing requests with doctor information
UPDATE requests 
SET doctor_info = (
  SELECT jsonb_build_object(
    'name', COALESCE(u.full_name, u.email),
    'organization', COALESCE(u.organization_name, ''),
    'email', u.email
  )
  FROM users u 
  WHERE u.id = requests.doctor_id
)
WHERE doctor_info = '{}'::jsonb;

-- Create index for doctor_info searches
CREATE INDEX IF NOT EXISTS idx_requests_doctor_info_gin ON requests USING gin (doctor_info);

-- Add comment for documentation
COMMENT ON COLUMN requests.doctor_info IS 'Doctor and clinic information including name, organization, and contact details';