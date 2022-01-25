CREATE TABLE users (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
   dead_or_alive boolean DEFAULT NULL);

INSERT INTO users (name)
VALUES 
('Berenika'),
('Christopher'),
('Ed'),
('Hanna');
