CREATE TABLE IF NOT EXISTS check_in_likes (
  check_in_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (check_in_id, user_id),
  CONSTRAINT fk_check_in_likes_check_in FOREIGN KEY (check_in_id) REFERENCES check_ins (id),
  CONSTRAINT fk_check_in_likes_user FOREIGN KEY (user_id) REFERENCES users (id),
  INDEX idx_check_in_likes_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
