CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  openid VARCHAR(128) NOT NULL UNIQUE,
  nickname VARCHAR(64) NULL,
  avatar_file_id VARCHAR(512) NULL,
  height_cm DECIMAL(5,2) NULL,
  weight_kg DECIMAL(5,2) NULL,
  experience VARCHAR(16) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  weekly_goal_calories INT UNSIGNED NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  group_id VARCHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (group_id, user_id),
  CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES `groups` (id),
  CONSTRAINT fk_group_members_user FOREIGN KEY (user_id) REFERENCES users (id),
  INDEX idx_group_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS check_ins (
  id CHAR(36) NOT NULL PRIMARY KEY,
  group_id VARCHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  sport VARCHAR(16) NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  distance_km DECIMAL(8,2) NULL,
  training_type VARCHAR(64) NULL,
  body_part VARCHAR(64) NULL,
  note VARCHAR(500) NULL,
  proof_file_id VARCHAR(512) NOT NULL,
  calories INT UNSIGNED NOT NULL,
  score_base INT NOT NULL,
  score_duration INT NOT NULL,
  score_calories INT NOT NULL,
  score_streak INT NOT NULL DEFAULT 0,
  score_total INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'valid',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_check_ins_group FOREIGN KEY (group_id) REFERENCES `groups` (id),
  CONSTRAINT fk_check_ins_user FOREIGN KEY (user_id) REFERENCES users (id),
  INDEX idx_check_ins_week (group_id, status, created_at),
  INDEX idx_check_ins_user_week (user_id, group_id, status, created_at),
  INDEX idx_check_ins_activity (group_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  recipient_user_id CHAR(36) NOT NULL,
  sender_user_id CHAR(36) NULL,
  type VARCHAR(16) NOT NULL,
  title VARCHAR(128) NOT NULL,
  content VARCHAR(1000) NOT NULL,
  action_label VARCHAR(64) NULL,
  read_at TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_user_id) REFERENCES users (id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users (id),
  INDEX idx_messages_recipient (recipient_user_id, created_at),
  INDEX idx_messages_unread (recipient_user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `groups` (id, name, weekly_goal_calories)
VALUES ('group-brofit', '兄弟运动局', 5000)
ON DUPLICATE KEY UPDATE name = VALUES(name), weekly_goal_calories = VALUES(weekly_goal_calories);
