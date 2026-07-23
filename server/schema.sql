CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  nip TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_status TEXT NOT NULL DEFAULT 'registered',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  last_login_at TIMESTAMPTZ,
  profile_completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_onboarding_status_check
    CHECK (onboarding_status IN ('registered', 'profile_required', 'pending_approval', 'approved')),
  CONSTRAINT users_approval_status_check
    CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS users_approval_status_idx ON users (approval_status);
CREATE INDEX IF NOT EXISTS users_onboarding_status_idx ON users (onboarding_status);