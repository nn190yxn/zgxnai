// 发展里程碑评估路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const milestoneData = require('../data/milestoneData');

// 获取评估维度和年龄段
// GET /api/v1/parenting/milestone/dimensions
router.get('/milestone/dimensions', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ageRanges: milestoneData.ageRanges,
        dimensions: milestoneData.dimensions
      }
    });
  } catch (err) {
    console.error('[Milestone] 获取维度失败:', err);
    res.status(500).json({ success: false, message: '获取评估维度失败' });
  }
});

// 获取指定年龄段的评估指标
// GET /api/v1/parenting/milestone/indicators/:ageRange
router.get('/milestone/indicators/:ageRange', (req, res) => {
  try {
    const { ageRange } = req.params;
    const indicators = milestoneData.indicators[ageRange];
    
    if (!indicators) {
      return res.status(404).json({ success: false, message: '该年龄段暂无评估指标' });
    }

    res.json({
      success: true,
      data: indicators
    });
  } catch (err) {
    console.error('[Milestone] 获取指标失败:', err);
    res.status(500).json({ success: false, message: '获取评估指标失败' });
  }
});

// 提交评估结果
// POST /api/v1/parenting/milestone/assess
router.post('/milestone/assess', authenticateToken, (req, res) => {
  try {
    const { ageRange, results } = req.body;
    const userId = req.user.userId || req.user.id;
    
    if (!ageRange || !results || !Array.isArray(results)) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const indicators = milestoneData.indicators[ageRange];
    if (!indicators) {
      return res.status(404).json({ success: false, message: '该年龄段暂无评估指标' });
    }

    // 计算各维度得分
    const dimensionScores = {};
    const dimensionTotal = {};
    
    milestoneData.dimensions.forEach(dim => {
      dimensionScores[dim.id] = 0;
      dimensionTotal[dim.id] = 0;
    });

    results.forEach(result => {
      const indicator = indicators.find(i => i.id === result.indicatorId);
      if (indicator) {
        dimensionScores[indicator.dimension] = (dimensionScores[indicator.dimension] || 0) + (result.value ? 1 : 0);
        dimensionTotal[indicator.dimension] = (dimensionTotal[indicator.dimension] || 0) + 1;
      }
    });

    // 计算百分比
    const dimensionResults = milestoneData.dimensions.map(dim => {
      const score = dimensionScores[dim.id] || 0;
      const total = dimensionTotal[dim.id] || 1;
      return {
        ...dim,
        score: score,
        total: total,
        percentage: Math.round((score / total) * 100)
      };
    });

    // 计算总分
    const totalScore = Object.values(dimensionScores).reduce((a, b) => a + b, 0);
    const totalItems = Object.values(dimensionTotal).reduce((a, b) => a + b, 0);
    const overallPercentage = Math.round((totalScore / totalItems) * 100);

    // 保存评估结果到数据库
    const assessmentId = db.prepare(`
      INSERT INTO milestone_assessments (user_id, age_range, total_score, total_items, overall_percentage, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, ageRange, totalScore, totalItems, overallPercentage).lastInsertRowid;

    // 保存各维度得分
    dimensionResults.forEach(dim => {
      db.prepare(`
        INSERT INTO milestone_assessment_dimensions (assessment_id, dimension_id, score, total, percentage)
        VALUES (?, ?, ?, ?, ?)
      `).run(assessmentId, dim.id, dim.score, dim.total, dim.percentage);
    });

    res.json({
      success: true,
      data: {
        assessmentId,
        ageRange,
        overallPercentage,
        totalScore,
        totalItems,
        dimensionResults
      }
    });
  } catch (err) {
    console.error('[Milestone] 评估失败:', err);
    res.status(500).json({ success: false, message: '评估失败' });
  }
});

// 获取评估历史
// GET /api/v1/parenting/milestone/history
router.get('/milestone/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const assessments = db.prepare(`
      SELECT * FROM milestone_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    `).all(userId);

    res.json({
      success: true,
      data: assessments
    });
  } catch (err) {
    console.error('[Milestone] 获取历史失败:', err);
    res.status(500).json({ success: false, message: '获取评估历史失败' });
  }
});

module.exports = router;