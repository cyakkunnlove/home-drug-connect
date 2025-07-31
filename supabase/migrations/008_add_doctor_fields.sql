-- Add doctor-specific fields to users table
ALTER TABLE users 
ADD COLUMN name text,
ADD COLUMN clinic_name text,
ADD COLUMN medical_license_number text,
ADD COLUMN company_id uuid REFERENCES companies(id);

-- Create index for medical license number for quick lookup (if needed for verification)
CREATE INDEX idx_users_medical_license_number ON users(medical_license_number) WHERE medical_license_number IS NOT NULL;

-- Create index for company_id for performance
CREATE INDEX idx_users_company_id ON users(company_id) WHERE company_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.name IS 'User full name (especially for doctors)';
COMMENT ON COLUMN users.clinic_name IS 'Clinic/hospital name for doctors';
COMMENT ON COLUMN users.medical_license_number IS 'Medical license number for doctors';
COMMENT ON COLUMN users.company_id IS 'Reference to associated company/clinic';