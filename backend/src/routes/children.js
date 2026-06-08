const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function parseJsonArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return String(value).split(/[、,，\s]+/).filter(Boolean);
  }
}

function serializeArray(value) {
  if (!value) {
    return JSON.stringify([]);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter(Boolean));
  }
  return JSON.stringify(String(value).split(/[、,，\s]+/).filter(Boolean));
}

function normalizeChild(row) {
  if (!row) {
    return null;
  }
  const allergies = parseJsonArray(row.allergies);
  const tags = parseJsonArray(row.tags);
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    nickname: row.nickname || '',
    gender: row.gender || 'unknown',
    birthday: row.birthday || '',
    birth_date: row.birthday || '',
    avatar: row.avatar || '',
    is_default: row.is_default ? 1 : 0,
    isDefault: !!row.is_default,
    current_height: row.current_height,
    height: row.current_height,
    current_weight: row.current_weight,
    weight: row.current_weight,
    allergies,
    special_notes: row.special_notes || '',
    specialConditions: row.special_notes || '',
    tags,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function getOwnedChild(userId, childId) {
  return db.prepare('SELECT * FROM children WHERE id = ? AND user_id = ?').get(childId, userId);
}

function validateChildPayload(payload, isUpdate) {
  const data = payload || {};
  if (!isUpdate && (!data.name || !String(data.name).trim())) {
    return '孩子姓名不能为空';
  }
  if (data.gender && !['male', 'female', 'unknown'].includes(data.gender)) {
    return '性别参数无效';
  }
  return null;
}

function buildChildData(payload, existing) {
  const data = payload || {};
  return {
    name: data.name !== undefined ? String(data.name).trim().slice(0, 50) : existing.name,
    nickname: data.nickname !== undefined ? String(data.nickname).trim().slice(0, 50) : existing.nickname,
    gender: data.gender !== undefined ? data.gender : existing.gender,
    birthday: data.birthday !== undefined ? data.birthday : existing.birthday,
    avatar: data.avatar !== undefined ? String(data.avatar).slice(0, 500) : existing.avatar,
    current_height: data.current_height !== undefined ? data.current_height : existing.current_height,
    current_weight: data.current_weight !== undefined ? data.current_weight : existing.current_weight,
    allergies: data.allergies !== undefined ? serializeArray(data.allergies) : existing.allergies,
    special_notes: data.special_notes !== undefined ? String(data.special_notes).slice(0, 500) : existing.special_notes,
    tags: data.tags !== undefined ? serializeArray(data.tags) : existing.tags
  };
}

router.get('/', authenticateToken, (req, res) => {
  const rows = db.prepare('SELECT * FROM children WHERE user_id = ? ORDER BY is_default DESC, created_at ASC').all(req.user.userId);
  return res.json({
    success: true,
    data: rows.map(normalizeChild)
  });
});

router.post('/', authenticateToken, (req, res) => {
  const error = validateChildPayload(req.body, false);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  const count = db.prepare('SELECT COUNT(*) as count FROM children WHERE user_id = ?').get(req.user.userId).count;
  if (count >= 5) {
    return res.status(400).json({ success: false, message: '最多添加5个孩子档案' });
  }

  const isDefault = count === 0 ? 1 : (req.body.is_default || req.body.isDefault ? 1 : 0);
  const transaction = db.transaction(() => {
    if (isDefault) {
      db.prepare('UPDATE children SET is_default = 0 WHERE user_id = ?').run(req.user.userId);
    }
    const result = db.prepare(`
      INSERT INTO children (user_id, name, nickname, gender, birthday, avatar, is_default, current_height, current_weight, allergies, special_notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.userId,
      String(req.body.name).trim().slice(0, 50),
      req.body.nickname ? String(req.body.nickname).trim().slice(0, 50) : '',
      req.body.gender || 'unknown',
      req.body.birthday || '',
      req.body.avatar ? String(req.body.avatar).slice(0, 500) : '',
      isDefault,
      req.body.current_height || null,
      req.body.current_weight || null,
      serializeArray(req.body.allergies),
      req.body.special_notes ? String(req.body.special_notes).slice(0, 500) : '',
      serializeArray(req.body.tags)
    );
    return result.lastInsertRowid;
  });

  const childId = transaction();
  const child = db.prepare('SELECT * FROM children WHERE id = ?').get(childId);
  return res.status(201).json({ success: true, data: normalizeChild(child) });
});

router.get('/:id', authenticateToken, (req, res) => {
  const child = getOwnedChild(req.user.userId, req.params.id);
  if (!child) {
    return res.status(404).json({ success: false, message: '孩子档案不存在' });
  }
  return res.json({ success: true, data: normalizeChild(child) });
});

router.put('/:id', authenticateToken, (req, res) => {
  const existing = getOwnedChild(req.user.userId, req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '孩子档案不存在' });
  }
  const error = validateChildPayload(req.body, true);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }
  const next = buildChildData(req.body, existing);
  db.prepare(`
    UPDATE children
    SET name = ?, nickname = ?, gender = ?, birthday = ?, avatar = ?, current_height = ?, current_weight = ?, allergies = ?, special_notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    next.name,
    next.nickname || '',
    next.gender || 'unknown',
    next.birthday || '',
    next.avatar || '',
    next.current_height || null,
    next.current_weight || null,
    next.allergies || JSON.stringify([]),
    next.special_notes || '',
    next.tags || JSON.stringify([]),
    req.params.id,
    req.user.userId
  );

  const updated = getOwnedChild(req.user.userId, req.params.id);
  return res.json({ success: true, data: normalizeChild(updated) });
});

router.put('/:id/set-default', authenticateToken, (req, res) => {
  const child = getOwnedChild(req.user.userId, req.params.id);
  if (!child) {
    return res.status(404).json({ success: false, message: '孩子档案不存在' });
  }
  const transaction = db.transaction(() => {
    db.prepare('UPDATE children SET is_default = 0 WHERE user_id = ?').run(req.user.userId);
    db.prepare('UPDATE children SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
  });
  transaction();
  const updated = getOwnedChild(req.user.userId, req.params.id);
  return res.json({ success: true, data: normalizeChild(updated) });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const child = getOwnedChild(req.user.userId, req.params.id);
  if (!child) {
    return res.status(404).json({ success: false, message: '孩子档案不存在' });
  }

  const transaction = db.transaction(() => {
    const records = db.prepare('SELECT id FROM assessment_records WHERE child_id = ?').all(req.params.id);
    for (const record of records) {
      db.prepare('DELETE FROM assessment_dimensions WHERE record_id = ?').run(record.id);
    }
    db.prepare('DELETE FROM assessment_records WHERE child_id = ?').run(req.params.id);
    db.prepare('DELETE FROM children WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);

    if (child.is_default) {
      const nextChild = db.prepare('SELECT id FROM children WHERE user_id = ? ORDER BY created_at ASC LIMIT 1').get(req.user.userId);
      if (nextChild) {
        db.prepare('UPDATE children SET is_default = 1 WHERE id = ?').run(nextChild.id);
      }
    }
  });

  transaction();
  return res.json({ success: true, message: '孩子档案已删除' });
});

module.exports = router;
