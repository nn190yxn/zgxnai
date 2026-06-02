// 育儿路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

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
      data: articles,
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
router.get('/articles/search', (req, res) => {
  try {
    const { q, page = 1, page_size = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    if (!q) {
      return res.json({
        success: true,
        data: [],
        pagination: { page: 1, page_size: limit, total: 0, has_more: false }
      });
    }

    const searchTerm = `%${q}%`;
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
      data: articles,
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
      data: article
    });
  } catch (err) {
    console.error('[Parenting] 获取文章详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败'
    });
  }
});

module.exports = router;
