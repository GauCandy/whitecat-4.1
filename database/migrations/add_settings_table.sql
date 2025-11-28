-- Settings table for storing bot configuration
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create support server invite setting
INSERT INTO settings (key, value) 
VALUES ('support_server_invite', '') 
ON CONFLICT (key) DO NOTHING;
