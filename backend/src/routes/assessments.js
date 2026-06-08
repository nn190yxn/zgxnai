// 评估路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

const ASSESSMENT_META = {
  sensory: { name: '儿童感觉统合能力发展评定量表', maxScore: 50 },
  focus: { name: '专注力观察', maxScore: 3 },
  adhd: { name: 'ADHD风险观察筛查', maxScore: 3 },
  multi_intelligence: { name: '多元智能观察', maxScore: 3 },
  emotion: { name: '情绪能力观察', maxScore: 3 },
  learning: { name: '学习适应观察', maxScore: 3 }
};

function normalizeLevel(level) {
  const map = {
    excellent: '优秀',
    good: '良好',
    medium: '中等',
    attention: '需关注',
    intervention: '需干预'
  };
  return map[level] || level || '';
}

function buildDimensionScores(recordId) {
  const dimensions = db.prepare('SELECT * FROM assessment_dimensions WHERE record_id = ?').all(recordId);
  return dimensions.map(item => ({
    dimension_id: item.dimension_name,
    dimension_name: item.dimension_name,
    name: item.dimension_name,
    score: item.score,
    score_rate: item.score_rate,
    standard_score: item.standard_score
  }));
}

function normalizeRecord(row) {
  if (!row) {
    return null;
  }
  const child = db.prepare('SELECT name FROM children WHERE id = ?').get(row.child_id);
  const meta = ASSESSMENT_META[row.assessment_code] || {};
  const dimensionScores = buildDimensionScores(row.id);
  const reportData = {
    interpretations: db.prepare(`
      SELECT * FROM assessment_interpretations
      WHERE assessment_code = ? AND ? BETWEEN score_min AND score_max
    `).all(row.assessment_code, row.percentage || 0),
    suggestions: db.prepare(`
      SELECT * FROM assessment_suggestions
      WHERE assessment_code = ? AND level = ?
    `).all(row.assessment_code, row.overall_level)
  };

  return {
    ...row,
    assessment_type: row.assessment_code,
    assessment_name: row.assessment_name || meta.name || row.assessment_code,
    child_name: child ? child.name : '',
    overall_score: row.total_score,
    dimension_scores: dimensionScores,
    report_data: reportData,
    overall_level_text: normalizeLevel(row.overall_level),
    max_score: row.max_score || meta.maxScore || 3
  };
}

// 获取评估工具列表
// GET /api/v1/assessments
router.get('/', (req, res) => {
  try {
    const assessments = [
      {
        id: 1,
        code: 'sensory',
        name: '儿童感觉统合能力发展评定量表',
        description: '评估前庭、触觉、本体感和学习相关表现',
        total_questions: 58,
        duration: 15,
        age_groups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 2,
        code: 'focus',
        name: '专注力观察',
        description: '了解注意力集中、持续和抗干扰表现',
        total_questions: 25,
        duration: 12,
        age_groups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 3,
        code: 'adhd',
        name: 'ADHD风险观察筛查',
        description: '观察注意力、多动和冲动相关表现',
        total_questions: 18,
        duration: 10,
        age_groups: ['4-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 4,
        code: 'multi_intelligence',
        name: '多元智能观察',
        description: '发现优势智能领域',
        total_questions: 40,
        duration: 20,
        age_groups: ['3-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 5,
        code: 'emotion',
        name: '情绪能力观察',
        description: '了解情绪识别、表达和调节表现',
        total_questions: 22,
        duration: 12,
        age_groups: ['3-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 6,
        code: 'learning',
        name: '学习适应观察',
        description: '了解学习适应与准备情况',
        total_questions: 35,
        duration: 18,
        age_groups: ['6-9岁', '9-12岁']
      }
    ];

    res.json({
      success: true,
      data: assessments
    });
  } catch (err) {
    console.error('[Assessments] 获取评估列表失败:', err);
    res.status(500).json({
      success: false,
      message: '获取评估列表失败'
    });
  }
});

// 提交评估结果
// POST /api/v1/assessments/:code/submit
router.post('/:code/submit', (req, res) => {
  try {
    const { code } = req.params;
    const { child_id, age_group, answers } = req.body;

    if (!child_id || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: '参数错误：缺少必要字段'
      });
    }

    // 计算得分
    let totalScore = 0;
    let maxScore = answers.length * 3; // 每题最高3分

    for (const answer of answers) {
      totalScore += answer.value || 0;
    }

    const percentage = Math.round((totalScore / maxScore) * 100);

    // 确定等级（与解读/建议表一致，使用英文等级）
    let level = 'intervention';
    if (percentage >= 85) level = 'excellent';
    else if (percentage >= 70) level = 'good';
    else if (percentage >= 55) level = 'medium';
    else if (percentage >= 40) level = 'attention';

    // 确保孩子记录存在
    let childId = child_id;
    const childExists = db.prepare('SELECT id FROM children WHERE id = ?').get(childId);
    if (!childExists) {
      // 创建默认孩子记录
      const defaultChild = db.prepare(`
        INSERT INTO children (user_id, name, gender, birthday)
        VALUES (1, '测试孩子', 'unknown', '2020-01-01')
      `).run();
      childId = defaultChild.lastInsertRowid;
    }

    // 存储评估记录
    const result = db.prepare(`
      INSERT INTO assessment_records 
      (child_id, assessment_code, age_group, total_score, max_score, percentage, overall_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(childId, code, age_group, totalScore, maxScore, percentage, level);

    // 存储维度得分
    const recordId = result.lastInsertRowid;

    // 获取解读和建议
    const interpretations = db.prepare(`
      SELECT * FROM assessment_interpretations 
      WHERE assessment_code = ? AND ? BETWEEN score_min AND score_max
    `).all(code, percentage);

    const suggestions = db.prepare(`
      SELECT * FROM assessment_suggestions 
      WHERE assessment_code = ? AND level = ?
    `).all(code, level);

    res.json({
      success: true,
      data: {
        record_id: recordId,
        id: recordId,
        assessment_code: code,
        assessment_type: code,
        assessment_name: ASSESSMENT_META[code] ? ASSESSMENT_META[code].name : code,
        total_score: totalScore,
        overall_score: totalScore,
        max_score: maxScore,
        percentage: percentage,
        overall_level: level,
        overall_level_text: normalizeLevel(level),
        dimension_scores: [],
        report_data: {
          interpretations: interpretations,
          suggestions: suggestions
        },
        interpretations: interpretations,
        suggestions: suggestions
      }
    });
  } catch (err) {
    console.error('[Assessments] 提交评估失败:', err);
    res.status(500).json({
      success: false,
      message: '提交评估失败'
    });
  }
});

// 获取评估结果
// GET /api/v1/assessments/results/:id
router.get('/results/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const record = db.prepare(`
      SELECT * FROM assessment_records WHERE id = ?
    `).get(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '评估记录不存在'
      });
    }

    const dimensions = db.prepare(`
      SELECT * FROM assessment_dimensions WHERE record_id = ?
    `).all(id);

    const interpretations = db.prepare(`
      SELECT * FROM assessment_interpretations 
      WHERE assessment_code = ? AND ? BETWEEN score_min AND score_max
    `).all(record.assessment_code, record.percentage);

    const suggestions = db.prepare(`
      SELECT * FROM assessment_suggestions 
      WHERE assessment_code = ? AND level = ?
    `).all(record.assessment_code, record.overall_level);

    res.json({
      success: true,
      data: {
        ...normalizeRecord(record),
        dimensions: dimensions,
        interpretations: interpretations,
        suggestions: suggestions
      }
    });
  } catch (err) {
    console.error('[Assessments] 获取评估结果失败:', err);
    res.status(500).json({
      success: false,
      message: '获取评估结果失败'
    });
  }
});

// 获取评估历史记录
// GET /api/v1/assessments/history
router.get('/history', (req, res) => {
  try {
    const { child_id, limit = 20, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM assessment_records';
    let params = [];
    
    if (child_id) {
      query += ' WHERE child_id = ?';
      params.push(child_id);
    }
    
    query += ' ORDER BY completed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const records = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: records.map(normalizeRecord)
    });
  } catch (err) {
    console.error('[Assessments] 获取历史记录失败:', err);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

// 获取评估历史记录数量
// GET /api/v1/assessments/history/count
router.get('/history/count', (req, res) => {
  try {
    const { child_id } = req.query;
    let query = 'SELECT COUNT(*) as count FROM assessment_records';
    const params = [];

    if (child_id) {
      query += ' WHERE child_id = ?';
      params.push(child_id);
    }

    const result = db.prepare(query).get(...params);
    res.json({
      success: true,
      data: { count: result.count }
    });
  } catch (err) {
    console.error('[Assessments] 获取历史数量失败:', err);
    res.status(500).json({
      success: false,
      message: '获取历史数量失败'
    });
  }
});

// 删除评估记录
// DELETE /api/v1/assessments/records/:id
router.delete('/records/:id', (req, res) => {
  try {
    const { id } = req.params;
    const record = db.prepare('SELECT id FROM assessment_records WHERE id = ?').get(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '评估记录不存在'
      });
    }

    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM assessment_dimensions WHERE record_id = ?').run(id);
      db.prepare('DELETE FROM assessment_records WHERE id = ?').run(id);
    });
    transaction();

    res.json({ success: true, message: '评估记录已删除' });
  } catch (err) {
    console.error('[Assessments] 删除评估记录失败:', err);
    res.status(500).json({
      success: false,
      message: '删除评估记录失败'
    });
  }
});

// 获取评估题目
// GET /api/v1/assessments/:code/questions
router.get('/:code/questions', (req, res) => {
  try {
    const { code } = req.params;
    const { age_group } = req.query;

    // 返回模拟题目数据（实际应从数据库读取）
    const questions = [
      {
        id: 1,
        dimension: 'attention',
        text: '孩子在进行活动时，是否容易分心？',
        options: [
          { value: 0, label: '从不' },
          { value: 1, label: '偶尔' },
          { value: 2, label: '经常' },
          { value: 3, label: '总是' }
        ]
      },
      {
        id: 2,
        dimension: 'sensory',
        text: '孩子是否喜欢被拥抱或身体接触？',
        options: [
          { value: 0, label: '非常不喜欢' },
          { value: 1, label: '不太喜欢' },
          { value: 2, label: '比较喜欢' },
          { value: 3, label: '非常喜欢' }
        ]
      }
    ];

    res.json({
      success: true,
      data: {
        assessment_code: code,
        age_group: age_group,
        questions: questions
      }
    });
  } catch (err) {
    console.error('[Assessments] 获取题目失败:', err);
    res.status(500).json({
      success: false,
      message: '获取题目失败'
    });
  }
});

module.exports = router;
