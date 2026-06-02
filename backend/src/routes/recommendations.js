// 个性化推荐路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// 获取个性化推荐
// GET /api/v1/recommendations
router.get('/', (req, res) => {
  try {
    const { child_id, user_id } = req.query;
    
    const recommendations = [];
    
    // 1. 基于评估结果的推荐
    const latestAssessment = db.prepare(`
      SELECT * FROM assessment_records 
      WHERE child_id = ? 
      ORDER BY completed_at DESC 
      LIMIT 1
    `).get(child_id);
    
    if (latestAssessment) {
      const level = latestAssessment.overall_level;
      const code = latestAssessment.assessment_code;
      
      // 获取相关建议
      const suggestions = db.prepare(`
        SELECT * FROM assessment_suggestions 
        WHERE assessment_code = ? AND level = ?
      `).all(code, level);
      
      if (suggestions.length > 0) {
        recommendations.push({
          type: 'assessment_based',
          title: '基于评估结果的个性化建议',
          items: suggestions.map(s => ({
            title: s.title,
            description: s.description,
            steps: s.steps,
            duration: s.duration,
            frequency: s.frequency
          }))
        });
      }
    }
    
    // 2. 基于年龄的推荐
    const child = db.prepare(`
      SELECT * FROM children WHERE id = ?
    `).get(child_id);
    
    if (child) {
      const ageTasks = db.prepare(`
        SELECT * FROM reading_tasks 
        WHERE age_range LIKE ?
        ORDER BY difficulty ASC 
        LIMIT 5
      `).all(`%${child.age || '3-6'}%`);
      
      if (ageTasks.length > 0) {
        recommendations.push({
          type: 'age_based',
          title: '适合当前年龄的任务',
          items: ageTasks.map(t => ({
            task_code: t.task_code,
            title: t.title,
            duration: t.duration,
            difficulty: t.difficulty
          }))
        });
      }
    }
    
    // 3. 热门文章推荐
    const popularArticles = db.prepare(`
      SELECT * FROM articles 
      WHERE is_published = 1 
      ORDER BY read_count DESC 
      LIMIT 3
    `).all();
    
    if (popularArticles.length > 0) {
      recommendations.push({
        type: 'popular',
        title: '热门育儿文章',
        items: popularArticles.map(a => ({
          id: a.id,
          title: a.title,
          summary: a.summary,
          category: a.category
        }))
      });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (err) {
    console.error('[Recommendations] 获取推荐失败:', err);
    res.status(500).json({
      success: false,
      message: '获取推荐失败'
    });
  }
});

module.exports = router;
