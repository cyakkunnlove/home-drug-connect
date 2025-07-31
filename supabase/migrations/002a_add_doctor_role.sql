-- Add doctor role to user_role enum
-- This migration needs to be run separately before the main doctor features migration
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'doctor';