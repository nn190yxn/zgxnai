const express = require('express');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const RECIPE_TYPE = 'nutrition_recipe';

const CATEGORY_MAP = {
  1: '早餐',
  2: '午餐',
  3: '晚餐',
  4: '加餐',
  5: '汤品'
};

function parseList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return String(value).split(/[、,，\s]+/).filter(Boolean);
}

function getUserId(req) {
  return req.user && (req.user.userId || req.user.id);
}

function isFavorited(userId, recipeId) {
  if (!userId) {
    return false;
  }
  return !!db.prepare(`
    SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?
  `).get(userId, RECIPE_TYPE, String(recipeId));
}

function inferCategory(row) {
  const text = `${row.title || ''} ${row.content || ''} ${row.tags || ''}`;
  if (text.includes('汤')) return '汤品';
  if (text.includes('早餐') || text.includes('粥') || text.includes('蛋')) return '早餐';
  if (text.includes('午餐')) return '午餐';
  if (text.includes('晚餐')) return '晚餐';
  if (text.includes('零食') || text.includes('加餐')) return '加餐';
  return '儿童营养';
}

function buildDescription(content) {
  const firstLine = String(content || '').split('\n').map(line => line.trim()).filter(Boolean)[0];
  if (!firstLine) {
    return '适合家庭日常搭配，具体食材可按孩子接受度调整。';
  }
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}...` : firstLine;
}

function normalizeRecipe(row, userId) {
  const category = inferCategory(row);
  const tags = parseList(row.tags);
  const recipeId = String(row.id);
  return {
    id: recipeId,
    name: row.title,
    title: row.title,
    description: buildDescription(row.content),
    desc: buildDescription(row.content),
    content: row.content,
    category,
    tags: tags.length ? tags : [category, row.age_range || '3-6岁'],
    ageRange: row.age_range || '3-6岁',
    cookTime: category === '汤品' ? '40分钟' : '30分钟',
    calories: '200卡',
    viewCount: row.id * 17 + 80,
    nutrition: {
      highlight: row.source || row.evidence_level || '儿童友好营养建议'
    },
    steps: String(row.content || '').split('\n').map(line => line.trim()).filter(Boolean).slice(0, 6),
    ingredients: tags.slice(0, 6),
    visualIcon: '',
    is_favorited: isFavorited(userId, recipeId),
    isFavorite: isFavorited(userId, recipeId),
    created_at: row.created_at
  };
}

function getNutritionRows(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(query.page_size || query.pageSize || '10', 10), 1), 30);
  const offset = (page - 1) * pageSize;
  const params = [];
  let where = `WHERE category = 'nutrition'`;

  if (query.keyword) {
    where += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    const search = `%${query.keyword}%`;
    params.push(search, search, search);
  }

  const category = CATEGORY_MAP[query.categoryId] || query.category;
  if (category) {
    where += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ? OR sub_category LIKE ?)';
    const categorySearch = `%${category}%`;
    params.push(categorySearch, categorySearch, categorySearch, categorySearch);
  }

  if (query.age) {
    where += ' AND age_range LIKE ?';
    params.push(`%${query.age}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM knowledge_base ${where}`).get(...params).count;
  const rows = db.prepare(`
    SELECT * FROM knowledge_base ${where}
    ORDER BY evidence_level ASC, id ASC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return { rows, total, page, pageSize, offset };
}

router.get('/recommendations', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM knowledge_base
      WHERE category = 'nutrition'
      ORDER BY evidence_level ASC, id ASC
      LIMIT 6
    `).all();
    return res.json({
      success: true,
      data: rows.map(row => normalizeRecipe(row, getUserId(req)))
    });
  } catch (err) {
    console.error('[Nutrition] 获取推荐失败:', err);
    return res.status(500).json({ success: false, message: '获取营养推荐失败' });
  }
});

router.get('/recipes', (req, res) => {
  try {
    const { rows, total, page, pageSize, offset } = getNutritionRows(req.query);
    return res.json({
      success: true,
      data: {
        recipes: rows.map(row => normalizeRecipe(row, getUserId(req))),
        pagination: {
          page,
          page_size: pageSize,
          total,
          has_more: offset + pageSize < total
        }
      }
    });
  } catch (err) {
    console.error('[Nutrition] 获取食谱列表失败:', err);
    return res.status(500).json({ success: false, message: '获取食谱列表失败' });
  }
});

router.get('/recipes/:id', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT * FROM knowledge_base WHERE id = ? AND category = 'nutrition'
    `).get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: '食谱不存在' });
    }
    return res.json({ success: true, data: normalizeRecipe(row, getUserId(req)) });
  } catch (err) {
    console.error('[Nutrition] 获取食谱详情失败:', err);
    return res.status(500).json({ success: false, message: '获取食谱详情失败' });
  }
});

router.post('/recipes/:id/favorite', authenticateToken, (req, res) => {
  try {
    const recipe = db.prepare(`
      SELECT id FROM knowledge_base WHERE id = ? AND category = 'nutrition'
    `).get(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: '食谱不存在' });
    }

    const userId = getUserId(req);
    const recipeId = String(req.params.id);
    const existing = db.prepare(`
      SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?
    `).get(userId, RECIPE_TYPE, recipeId);

    if (existing) {
      db.prepare('DELETE FROM user_favorites WHERE id = ?').run(existing.id);
      return res.json({ success: true, data: { is_favorited: false, isFavorite: false } });
    }

    db.prepare(`
      INSERT INTO user_favorites (user_id, item_type, item_id) VALUES (?, ?, ?)
    `).run(userId, RECIPE_TYPE, recipeId);
    return res.json({ success: true, data: { is_favorited: true, isFavorite: true } });
  } catch (err) {
    console.error('[Nutrition] 切换收藏失败:', err);
    return res.status(500).json({ success: false, message: '收藏操作失败' });
  }
});

module.exports = router;
