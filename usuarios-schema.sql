-- Tabla de usuarios del sistema admin
CREATE TABLE IF NOT EXISTS usuarios (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  password_hash text NOT NULL,  -- formato: salt:hash (scrypt)
  role       text NOT NULL CHECK (role IN ('admin', 'superadmin')),
  created_at timestamptz DEFAULT now()
);

-- Insertar usuarios iniciales
INSERT INTO usuarios (email, password_hash, role) VALUES
  ('danzyartelugano@gmail.com', 'b0368418e29cfc48bf80b4a5ad000447:18be7ebecce7da47a70dfa514e9431ecd3d19961db8869d2903202fdfff30df4', 'admin'),
  ('uriel.martinez.elias@gmail.com', '2ffd1cbe776950e78a68b394a0dfa0b1:7dd4c6ec465925b86bf10c712c2a605b1bce0d568bd8f754daabd3f911418a6e', 'superadmin')
ON CONFLICT (email) DO NOTHING;
