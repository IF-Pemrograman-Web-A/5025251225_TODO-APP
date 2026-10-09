CREATE DATABASE IF NOT EXISTS todo_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE todo_app;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS todos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  scope ENUM('personal', 'shared') NOT NULL DEFAULT 'personal',
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  owner_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY todos_scope_owner_updated (scope, owner_id, updated_at),
  CONSTRAINT todos_owner_fk FOREIGN KEY (owner_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (id, name, email) VALUES
  (1, 'Avery Morgan', 'avery@example.test'),
  (2, 'Jordan Lee', 'jordan@example.test'),
  (3, 'Taylor Kim', 'taylor@example.test')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

INSERT INTO todos (id, title, description, priority, scope, is_completed, owner_id) VALUES
  (1, 'Review the project brief', 'Read through the project requirements and note the important deliverables.', 'high', 'personal', 0, 1),
  (2, 'Organize this week', 'Group the smaller tasks into a clear plan for the week ahead.', 'medium', 'personal', 1, 1),
  (3, 'Prepare a first draft', 'Put together a first pass so there is something concrete to review.', 'low', 'personal', 0, 2),
  (4, 'Plan the team check-in', 'Share a short agenda and collect updates before the next team meeting.', 'medium', 'shared', 0, 1),
  (5, 'Collect project feedback', 'Ask the team to add comments and open questions to the shared notes.', 'high', 'shared', 0, 2),
  (6, 'Publish the weekly update', 'Summarize what changed this week and share it with the group.', 'low', 'shared', 1, 3)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  priority = VALUES(priority),
  scope = VALUES(scope),
  is_completed = VALUES(is_completed),
  owner_id = VALUES(owner_id);
