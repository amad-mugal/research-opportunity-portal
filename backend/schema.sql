CREATE DATABASE IF NOT EXISTS research_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  research_area VARCHAR(120) NOT NULL,
  faculty_name VARCHAR(120) NOT NULL,
  department VARCHAR(120) NOT NULL,
  required_skills VARCHAR(500) NOT NULL,
  positions SMALLINT UNSIGNED NOT NULL,
  deadline DATE NOT NULL,
  status ENUM('Open', 'Closed') NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status_deadline (status, deadline)
);
