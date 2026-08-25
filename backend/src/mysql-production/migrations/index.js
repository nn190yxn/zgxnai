const migrations = [
  {
    version: '20260821_001_child_development_foundation',
    name: 'child development foundation tables',
    statements: [
      `CREATE TABLE IF NOT EXISTS ability_profiles (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        child_id BIGINT NOT NULL,
        age_segment_code VARCHAR(32) NOT NULL,
        assessment_version INT NOT NULL,
        ability_domain VARCHAR(64) NOT NULL,
        dimension_scores JSON NOT NULL,
        observable_signs JSON NULL,
        primary_focus VARCHAR(64) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ability_profiles_child_created (child_id, created_at),
        INDEX idx_ability_profiles_age_ability (age_segment_code, ability_domain)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS training_feedbacks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        task_id BIGINT NOT NULL,
        child_id BIGINT NOT NULL,
        status VARCHAR(32) NOT NULL,
        feedback_key VARCHAR(64) NOT NULL,
        note TEXT,
        idempotency_key VARCHAR(128) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_training_feedback_idempotency (child_id, idempotency_key),
        INDEX idx_training_feedbacks_task (task_id),
        INDEX idx_training_feedbacks_child_created (child_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS growth_timeline_entries (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        entry_id VARCHAR(128) NOT NULL,
        child_id BIGINT NOT NULL,
        entry_type VARCHAR(64) NOT NULL,
        source_type VARCHAR(64) NOT NULL,
        source_id VARCHAR(128) DEFAULT '',
        ability_codes JSON NULL,
        occurred_at DATETIME NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT,
        dimensions JSON NULL,
        metadata JSON NULL,
        idempotency_key VARCHAR(128) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_growth_timeline_entry_id (entry_id),
        UNIQUE KEY uniq_growth_timeline_idempotency (child_id, idempotency_key),
        INDEX idx_growth_timeline_child_time (child_id, occurred_at),
        INDEX idx_growth_timeline_source (source_type, source_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS knowledge_content_metadata (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        content_type VARCHAR(64) NOT NULL,
        content_id VARCHAR(128) NOT NULL,
        age_segment_codes JSON NOT NULL,
        ability_codes JSON NOT NULL,
        scene_codes JSON NULL,
        content_form VARCHAR(64) NOT NULL,
        source_name VARCHAR(255) NOT NULL,
        source_url TEXT,
        evidence_level VARCHAR(32) NOT NULL,
        content_version INT NOT NULL,
        review_status VARCHAR(32) NOT NULL DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_knowledge_content_metadata (content_type, content_id),
        INDEX idx_knowledge_metadata_form_review (content_form, review_status),
        INDEX idx_knowledge_metadata_version (content_version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS analytics_daily_aggregates (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        stat_date DATE NOT NULL,
        aggregate_type VARCHAR(64) NOT NULL,
        age_segment_code VARCHAR(32) NOT NULL DEFAULT '',
        ability_code VARCHAR(64) NOT NULL DEFAULT '',
        membership_status VARCHAR(32) NOT NULL DEFAULT '',
        source_key VARCHAR(128) NOT NULL DEFAULT '',
        metrics JSON NOT NULL,
        aggregate_version INT NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_analytics_daily_dimension (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key),
        INDEX idx_analytics_daily_type_date (aggregate_type, stat_date),
        INDEX idx_analytics_daily_age_ability (age_segment_code, ability_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ]
  },
  {
    version: '20260821_002_growth_api_compatibility',
    name: 'growth api compatibility statistics',
    statements: [
      `CREATE TABLE IF NOT EXISTS api_compatibility_stats (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        endpoint VARCHAR(128) NOT NULL,
        field_name VARCHAR(64) NOT NULL,
        usage_count BIGINT NOT NULL DEFAULT 0,
        last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_api_compatibility_field (endpoint, field_name),
        INDEX idx_api_compatibility_last_used (last_used_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ]
  },
  {
    version: '20260821_003_ability_training_loop',
    name: 'ability observation and training loop',
    statements: [
      `CREATE TABLE IF NOT EXISTS ability_observation_submissions (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        child_id BIGINT NOT NULL,
        age_segment_code VARCHAR(32) NOT NULL,
        assessment_version INT NOT NULL,
        answers JSON NOT NULL,
        idempotency_key VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_observation_submission (child_id, idempotency_key),
        INDEX idx_observation_child_created (child_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS training_plans (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        child_id BIGINT NOT NULL,
        ability_profile_id BIGINT NOT NULL,
        ability_domain VARCHAR(64) NOT NULL,
        duration_days INT NOT NULL,
        content_version INT NOT NULL DEFAULT 1,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        idempotency_key VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_training_plan_request (child_id, idempotency_key),
        INDEX idx_training_plan_child_status (child_id, status, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS training_tasks (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        plan_id BIGINT NOT NULL,
        child_id BIGINT NOT NULL,
        day_index INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        ability_domain VARCHAR(64) NOT NULL,
        objective TEXT NOT NULL,
        duration_minutes INT NOT NULL,
        steps JSON NOT NULL,
        parent_prompt TEXT,
        observe_signals JSON,
        safety_notice TEXT,
        content_version INT NOT NULL DEFAULT 1,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        completed_at DATETIME NULL,
        UNIQUE KEY uniq_training_task_day (plan_id, day_index),
        INDEX idx_training_task_child (child_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS training_completions (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        task_id BIGINT NOT NULL,
        plan_id BIGINT NOT NULL,
        child_id BIGINT NOT NULL,
        idempotency_key VARCHAR(128) NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_training_completion (child_id, idempotency_key),
        UNIQUE KEY uniq_training_task_completion (child_id, task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      'ALTER TABLE ability_profiles ADD COLUMN IF NOT EXISTS observation_submission_id BIGINT NULL',
      'ALTER TABLE ability_profiles ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL',
      'ALTER TABLE training_feedbacks ADD COLUMN IF NOT EXISTS plan_id BIGINT NULL',
      'ALTER TABLE training_feedbacks ADD COLUMN IF NOT EXISTS ability_domain VARCHAR(64) NOT NULL DEFAULT \'\''
    ]
  }
];

module.exports = migrations;
