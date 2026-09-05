-- Migration: Add bank details and student fields to profiles and verification_requests

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS matric_number TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS faculty TEXT,
ADD COLUMN IF NOT EXISTS academic_level TEXT,
ADD COLUMN IF NOT EXISTS hostel_address TEXT;

ALTER TABLE verification_requests
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'id_card' CHECK (verification_method IN ('id_card', 'manual')),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS matric_number TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS faculty TEXT,
ADD COLUMN IF NOT EXISTS academic_level TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS hostel_address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

-- RLS: Ensure only the account owner can update their own bank details
CREATE POLICY "Users can update their own bank and profile details"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
