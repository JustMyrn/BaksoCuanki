CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  nip TEXT,
  jabatan TEXT,
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

CREATE TABLE IF NOT EXISTS perjalanan_dinas (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  tujuan_perjalanan TEXT NOT NULL,
  tempat_pelaksanaan TEXT NOT NULL,

  jenis_transportasi TEXT NOT NULL,            
  detail_transportasi TEXT NOT NULL,           
                                               

  gunakan_kapal_laut BOOLEAN NOT NULL DEFAULT FALSE,

  kebutuhan_bbm BOOLEAN NOT NULL DEFAULT FALSE,
  kebutuhan_biaya_tol BOOLEAN NOT NULL DEFAULT FALSE,
  kebutuhan_parkir BOOLEAN NOT NULL DEFAULT FALSE,
  kebutuhan_lainnya BOOLEAN NOT NULL DEFAULT FALSE,

  tiket_transportasi_url TEXT,                 
  nominal_biaya_tiket NUMERIC(15, 2) DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT perjalanan_jenis_transportasi_check
    CHECK (jenis_transportasi IN ('umum', 'pribadi')),

  CONSTRAINT perjalanan_detail_transportasi_check
    CHECK (
      (jenis_transportasi = 'umum'    AND detail_transportasi IN ('mobil', 'bus', 'kereta', 'pesawat'))
      OR
      (jenis_transportasi = 'pribadi' AND detail_transportasi IN ('mobil', 'motor'))
    )
);

CREATE INDEX IF NOT EXISTS perjalanan_dinas_user_id_idx ON perjalanan_dinas (user_id);