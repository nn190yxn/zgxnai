// 知识库路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// 搜索知识库
// GET /api/v1/knowledge/search
router.get('/search', (req, res) => {
  try {
    const { q, category, age_range, page = 1, page_size = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    let query = 'SELECT * FROM knowledge_base WHERE 1=1';
    let params = [];

    if (q) {
      query += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (age_range) {
      query += ' AND age_range LIKE ?';
      params.push(`%${age_range}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const results = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('[Knowledge] 搜索知识库失败:', err);
    res.status(500).json({
      success: false,
      message: '搜索知识库失败'
    });
  }
});

// 获取知识库分类
// GET /api/v1/knowledge/categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT DISTINCT category FROM knowledge_base ORDER BY category
    `).all();

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (err) {
    console.error('[Knowledge] 获取分类失败:', err);
    res.status(500).json({
      success: false,
      message: '获取分类失败'
    });
  }
});

module.exports = router;
