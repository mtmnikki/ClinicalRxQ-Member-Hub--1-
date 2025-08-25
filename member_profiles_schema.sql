-- Create member_profiles table
CREATE TABLE IF NOT EXISTS member_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('Pharmacist-PIC', 'Pharmacist-Staff', 'Pharmacy Technician')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone_number TEXT,
  profile_email TEXT,
  dob_month TEXT CHECK (dob_month IS NULL OR dob_month ~ '^(0[1-9]|1[0-2])$'),
  dob_day TEXT CHECK (dob_day IS NULL OR dob_day ~ '^(0[1-9]|[12][0-9]|3[01])$'),
  dob_year TEXT CHECK (dob_year IS NULL OR dob_year ~ '^(19|20)\d{2}$'),
  license_number TEXT,
  nabp_eprofile_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_profiles_account ON member_profiles(member_account_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_active ON member_profiles(member_account_id, is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy so users can only see their own profiles
CREATE POLICY "Users can view own profiles" ON member_profiles
  FOR SELECT USING (member_account_id = auth.uid());

CREATE POLICY "Users can create own profiles" ON member_profiles
  FOR INSERT WITH CHECK (member_account_id = auth.uid());

CREATE POLICY "Users can update own profiles" ON member_profiles
  FOR UPDATE USING (member_account_id = auth.uid())
  WITH CHECK (member_account_id = auth.uid());

CREATE POLICY "Users can delete own profiles" ON member_profiles
  FOR DELETE USING (member_account_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_member_profiles_updated_at 
    BEFORE UPDATE ON member_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();