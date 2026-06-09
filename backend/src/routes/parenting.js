// 育儿路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const ARTICLE_TYPE = 'parenting_article';

// 分类占位图颜色映射
const categoryPlaceholders = {
  '情绪管理': { color: '#FF6B6B', icon: '😊' },
  '行为习惯': { color: '#4ECDC4', icon: '✨' },
  '认知发展': { color: '#45B7D1', icon: '🧠' },
  '语言发展': { color: '#96CEB4', icon: '💬' },
  '社交能力': { color: '#DDA0DD', icon: '🤝' },
  '运动发展': { color: '#FFD93D', icon: '🏃' },
  '营养健康': { color: '#6BCB77', icon: '🥗' },
  '睡眠指导': { color: '#8D6E63', icon: '😴' },
  '安全教育': { color: '#FF8C42', icon: '🔒' },
  'default': { color: '#9E9E9E', icon: '📖' }
};

// 生成 SVG 占位图 URL
function generatePlaceholderImage(category) {
  const cat = categoryPlaceholders[category] || categoryPlaceholders['default'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${cat.color}" opacity="0.15"/>
    <rect x="50" y="50" width="300" height="200" rx="20" fill="${cat.color}" opacity="0.1"/>
    <text x="200" y="140" font-size="80" text-anchor="middle" dominant-baseline="central">${cat.icon}</text>
    <text x="200" y="220" font-size="24" fill="#666" text-anchor="middle" font-family="sans-serif">${category || '育儿锦囊'}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getUserId(req) {
  return req.user && (req.user.userId || req.user.id);
}

function isFavorited(userId, articleId) {
  if (!userId) {
    return false;
  }
  return !!db.prepare(`
    SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?
  `).get(userId, ARTICLE_TYPE, String(articleId));
}

function normalizeArticle(article, userId) {
  if (!article) {
    return null;
  }
  const favorited = isFavorited(userId, article.id);
  return {
    ...article,
    cover: article.cover || article.cover_image || article.icon_url || generatePlaceholderImage(article.category),
    is_favorited: favorited,
    isFavorite: favorited
  };
}

function searchArticles(req, res) {
  try {
    const keyword = req.query.q || req.query.keyword;
    const { page = 1, page_size = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    if (!keyword) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, page_size: limit, total: 0, has_more: false }
      });
    }

    const searchTerm = `%${keyword}%`;
    const articles = db.prepare(`
      SELECT * FROM articles
      WHERE is_published = 1
      AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)
      ORDER BY read_count DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(searchTerm, searchTerm, searchTerm, searchTerm, limit, offset);

    const count = db.prepare(`
      SELECT COUNT(*) as count FROM articles
      WHERE is_published = 1
      AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)
    `).get(searchTerm, searchTerm, searchTerm, searchTerm).count;

    res.json({
      success: true,
      data: articles.map(article => normalizeArticle(article, getUserId(req))),
      pagination: {
        page: parseInt(page),
        page_size: limit,
        total: count,
        has_more: offset + limit < count
      }
    });
  } catch (err) {
    console.error('[Parenting] 搜索文章失败:', err);
    res.status(500).json({
      success: false,
      message: '搜索文章失败'
    });
  }
}

// 获取文章列表
// GET /api/v1/parenting/articles
router.get('/articles', (req, res) => {
  try {
    const { page = 1, page_size = 10, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    let query = 'SELECT * FROM articles WHERE is_published = 1';
    let params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const articles = db.prepare(query).all(...params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as count FROM articles WHERE is_published = 1';
    let countParams = [];
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }
    const total = db.prepare(countQuery).get(...countParams).count;

    res.json({
      success: true,
      data: articles.map(article => normalizeArticle(article, getUserId(req))),
      pagination: {
        page: parseInt(page),
        page_size: limit,
        total: total,
        has_more: offset + limit < total
      }
    });
  } catch (err) {
    console.error('[Parenting] 获取文章列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败'
    });
  }
});

// 搜索文章
// GET /api/v1/parenting/articles/search
router.get('/articles/search', searchArticles);

// 兼容前端搜索入口
// GET /api/v1/parenting/search
router.get('/search', searchArticles);

// 获取相关文章
// GET /api/v1/parenting/articles/:id/related
router.get('/articles/:id/related', (req, res) => {
  try {
    const { id } = req.params;
    
    // 本地文章 ID 直接返回空数组
    if (String(id).startsWith('local_')) {
      return res.json({ success: true, data: [] });
    }
    
    const article = db.prepare('SELECT * FROM articles WHERE id = ? AND is_published = 1').get(id);

    if (!article) {
      return res.json({ success: true, data: [] });
    }

    const related = db.prepare(`
      SELECT * FROM articles
      WHERE is_published = 1 AND id != ? AND (category = ? OR sub_category = ?)
      ORDER BY read_count DESC, created_at DESC
      LIMIT 5
    `).all(id, article.category, article.sub_category);

    const fallback = related.length ? related : db.prepare(`
      SELECT * FROM articles
      WHERE is_published = 1 AND id != ?
      ORDER BY read_count DESC, created_at DESC
      LIMIT 5
    `).all(id);

    res.json({
      success: true,
      data: fallback.map(item => normalizeArticle(item, getUserId(req)))
    });
  } catch (err) {
    console.error('[Parenting] 获取相关文章失败:', err);
    res.status(500).json({
      success: false,
      message: '获取相关文章失败'
    });
  }
});

// 获取文章详情
// GET /api/v1/parenting/articles/:id
router.get('/articles/:id', (req, res) => {
  try {
    const { id } = req.params;

    const article = db.prepare(`
      SELECT * FROM articles WHERE id = ?
    `).get(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    // 增加阅读次数
    db.prepare(`
      UPDATE articles SET read_count = read_count + 1 WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      data: normalizeArticle(article, getUserId(req))
    });
  } catch (err) {
    console.error('[Parenting] 获取文章详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败'
    });
  }
});

// 收藏或取消收藏文章
// POST /api/v1/parenting/articles/:id/favorite
router.post('/articles/:id/favorite', authenticateToken, (req, res) => {
  try {
    const article = db.prepare('SELECT id FROM articles WHERE id = ? AND is_published = 1').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const userId = getUserId(req);
    const articleId = String(req.params.id);
    const existing = db.prepare(`
      SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ?
    `).get(userId, ARTICLE_TYPE, articleId);

    if (existing) {
      db.prepare('DELETE FROM user_favorites WHERE id = ?').run(existing.id);
      return res.json({ success: true, data: { is_favorited: false, isFavorite: false } });
    }

    db.prepare(`
      INSERT INTO user_favorites (user_id, item_type, item_id) VALUES (?, ?, ?)
    `).run(userId, ARTICLE_TYPE, articleId);
    return res.json({ success: true, data: { is_favorited: true, isFavorite: true } });
  } catch (err) {
    console.error('[Parenting] 切换收藏失败:', err);
    return res.status(500).json({ success: false, message: '收藏操作失败' });
  }
});

// 获取文章点赞数
function getArticleLikeCount(articleId) {
  return db.prepare('SELECT COUNT(*) as count FROM article_likes WHERE article_id = ?').get(articleId).count;
}

// 获取用户是否点赞
function isArticleLikedByUser(userId, articleId) {
  if (!userId) return false;
  return !!db.prepare('SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?').get(userId, articleId);
}

// 点赞或取消点赞文章
// POST /api/v1/parenting/articles/:id/like
router.post('/articles/:id/like', authenticateToken, (req, res) => {
  try {
    const article = db.prepare('SELECT id FROM articles WHERE id = ? AND is_published = 1').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const userId = getUserId(req);
    const articleId = String(req.params.id);
    const existing = db.prepare('SELECT id FROM article_likes WHERE user_id = ? AND article_id = ?').get(userId, articleId);

    if (existing) {
      db.prepare('DELETE FROM article_likes WHERE id = ?').run(existing.id);
      return res.json({ success: true, data: { is_liked: false, isLiked: false, like_count: getArticleLikeCount(articleId) } });
    }

    db.prepare('INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)').run(userId, articleId);
    return res.json({ success: true, data: { is_liked: true, isLiked: true, like_count: getArticleLikeCount(articleId) } });
  } catch (err) {
    console.error('[Parenting] 切换点赞失败:', err);
    return res.status(500).json({ success: false, message: '点赞操作失败' });
  }
});

// 获取文章评论列表
// GET /api/v1/parenting/articles/:id/comments
router.get('/articles/:id/comments', (req, res) => {
  try {
    const articleId = String(req.params.id);
    const { page = 1, page_size = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    const comments = db.prepare(`
      SELECT c.*, u.nickname as user_nickname, u.avatar as user_avatar
      FROM article_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ? AND c.parent_id = 0
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `).all(articleId, limit, offset);

    const count = db.prepare('SELECT COUNT(*) as count FROM article_comments WHERE article_id = ? AND parent_id = 0').get(articleId).count;

    res.json({
      success: true,
      data: comments,
      pagination: { page: parseInt(page), page_size: limit, total: count, has_more: offset + limit < count }
    });
  } catch (err) {
    console.error('[Parenting] 获取评论失败:', err);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
});

// 发表评论
// POST /api/v1/parenting/articles/:id/comments
router.post('/articles/:id/comments', authenticateToken, (req, res) => {
  try {
    const article = db.prepare('SELECT id FROM articles WHERE id = ? AND is_published = 1').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const { content, parent_id = 0 } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '评论内容不能为空' });
    }

    const userId = getUserId(req);
    const articleId = String(req.params.id);

    db.prepare('INSERT INTO article_comments (user_id, article_id, content, parent_id) VALUES (?, ?, ?, ?)')
      .run(userId, articleId, content.trim(), parent_id);

    res.json({ success: true, message: '评论成功' });
  } catch (err) {
    console.error('[Parenting] 发表评论失败:', err);
    res.status(500).json({ success: false, message: '评论失败' });
  }
});

// 记录阅读进度
// POST /api/v1/parenting/articles/:id/read-progress
router.post('/articles/:id/read-progress', authenticateToken, (req, res) => {
  try {
    const { read_time, read_percent } = req.body;
    const userId = getUserId(req);
    const articleId = String(req.params.id);

    const existing = db.prepare('SELECT id FROM user_reads WHERE user_id = ? AND article_id = ?').get(userId, articleId);
    if (existing) {
      db.prepare('UPDATE user_reads SET read_time = ?, read_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(read_time || 0, read_percent || 0, existing.id);
    } else {
      db.prepare('INSERT INTO user_reads (user_id, article_id, read_time, read_percent) VALUES (?, ?, ?, ?)')
        .run(userId, articleId, read_time || 0, read_percent || 0);
    }

    res.json({ success: true, message: '阅读进度已记录' });
  } catch (err) {
    console.error('[Parenting] 记录阅读进度失败:', err);
    res.status(500).json({ success: false, message: '记录阅读进度失败' });
  }
});

// 每日打卡
// POST /api/v1/parenting/checkin
router.post('/checkin', authenticateToken, (req, res) => {
  try {
    const userId = getUserId(req);
    const today = new Date().toISOString().split('T')[0];

    const existing = db.prepare('SELECT id FROM daily_checkins WHERE user_id = ? AND checkin_date = ?').get(userId, today);
    if (existing) {
      db.prepare('UPDATE daily_checkins SET article_count = article_count + 1 WHERE id = ?').run(existing.id);
      return res.json({ success: true, data: { checked_in: true, message: '今日已打卡' } });
    }

    db.prepare('INSERT INTO daily_checkins (user_id, checkin_date, article_count) VALUES (?, ?, 1)').run(userId, today);
    res.json({ success: true, data: { checked_in: true, message: '打卡成功' } });
  } catch (err) {
    console.error('[Parenting] 打卡失败:', err);
    res.status(500).json({ success: false, message: '打卡失败' });
  }
});

// 获取打卡记录
// GET /api/v1/parenting/checkins
router.get('/checkins', authenticateToken, (req, res) => {
  try {
    const userId = getUserId(req);
    const checkins = db.prepare(`
      SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 30
    `).all(userId);

    res.json({ success: true, data: checkins });
  } catch (err) {
    console.error('[Parenting] 获取打卡记录失败:', err);
    res.status(500).json({ success: false, message: '获取打卡记录失败' });
  }
});

module.exports = router;
