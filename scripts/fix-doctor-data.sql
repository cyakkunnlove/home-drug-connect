-- Fix existing doctor data by extracting information from organization_name field
-- This script extracts doctor names and clinic names from the combined organization_name field

UPDATE users 
SET 
  name = CASE 
    WHEN organization_name LIKE 'Dr. %' THEN 
      SUBSTRING(organization_name FROM 'Dr\. ([^(]+)') 
    ELSE NULL 
  END,
  clinic_name = CASE 
    WHEN organization_name LIKE 'Dr. %' THEN 
      SUBSTRING(organization_name FROM '\(([^)]+)\)') 
    ELSE organization_name 
  END
WHERE 
  role = 'doctor' 
  AND name IS NULL 
  AND organization_name IS NOT NULL;

-- Clean up the extracted names by trimming whitespace
UPDATE users 
SET 
  name = TRIM(name),
  clinic_name = TRIM(clinic_name)
WHERE 
  role = 'doctor' 
  AND (name IS NOT NULL OR clinic_name IS NOT NULL);

-- For doctors without proper organization_name format, use email as fallback
UPDATE users 
SET 
  name = 'Doctor',
  clinic_name = COALESCE(organization_name, 'Clinic')
WHERE 
  role = 'doctor' 
  AND name IS NULL;