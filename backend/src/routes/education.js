// 教育路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

function parseSteps(value) {
  return value ? value.split('\n').filter(item => item.trim()) : [];
}

function mapKnowledgePoint(task) {
  return {
    id: task.task_code || String(task.id),
    task_id: task.id,
    name: task.title,
    title: task.title,
    status: task.status || 'pending',
    difficulty: task.difficulty || 1,
    progress: task.progress || 0,
    duration: task.duration,
    objective: task.objective
  };
}

// 获取今日任务
// GET /api/v1/education/tasks/today
router.get('/tasks/today', (req, res) => {
  try {
    const { childId, grade } = req.query;

    // 获取今日任务 - 返回完整字段
    const tasks = db.prepare(`
      SELECT t.*, tp.status, tp.progress 
      FROM reading_tasks t
      LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
      WHERE t.age_range LIKE ?
      ORDER BY t.difficulty ASC
      LIMIT 4
    `).all(childId || 0, `%${grade || '3-4岁'}%`);

    res.json({
      success: true,
      data: {
        list: tasks.map(task => ({
          id: task.id,
          task_code: task.task_code,
          title: task.title,
          subject_code: task.subject_code,
          age_range: task.age_range,
          difficulty: task.difficulty,
          duration: task.duration,
          material: task.material,
          objective: task.objective,
          steps: task.steps ? task.steps.split('\\n').filter(s => s.trim()) : [],
          parent_prompt: task.parent_prompt,
          content: task.content,
          image_url: task.image_url,
          icon_url: task.icon_url,
          cover_image: task.cover_image,
          audio_url: task.audio_url,
          video_url: task.video_url,
          tips: task.tips,
          example_answer: task.example_answer,
          status: task.status || 'pending',
          progress: task.progress || 0
        }))
      }
    });
  } catch (err) {
    console.error('[Education] 获取今日任务失败:', err);
    res.status(500).json({
      success: false,
      message: '获取今日任务失败'
    });
  }
});

// 完成任务
// POST /api/v1/education/tasks/:id/complete
router.post('/tasks/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const { child_id } = req.body;

    // 更新任务进度
    const existing = db.prepare(`
      SELECT * FROM task_progress WHERE task_id = ? AND child_id = ?
    `).get(id, child_id);

    if (existing) {
      db.prepare(`
        UPDATE task_progress 
        SET status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO task_progress (child_id, task_id, status, progress, completed_at)
        VALUES (?, ?, 'completed', 100, CURRENT_TIMESTAMP)
      `).run(child_id, id);
    }

    res.json({
      success: true,
      data: { message: '任务已完成' }
    });
  } catch (err) {
    console.error('[Education] 完成任务失败:', err);
    res.status(500).json({
      success: false,
      message: '完成任务失败'
    });
  }
});

// 获取进度概览
// GET /api/v1/education/progress/overview
router.get('/progress/overview', (req, res) => {
  try {
    const { childId, grade } = req.query;

    // 统计进度
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM reading_tasks
    `).get().count;

    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM task_progress 
      WHERE child_id = ? AND status = 'completed'
    `).get(childId || 0).count;

    const masteryRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalPoints: totalTasks * 10,
        masteredPoints: completedTasks * 10,
        learningPoints: (totalTasks - completedTasks) * 10,
        masteryRate: masteryRate
      }
    });
  } catch (err) {
    console.error('[Education] 获取进度概览失败:', err);
    res.status(500).json({
      success: false,
      message: '获取进度概览失败'
    });
  }
});

// 获取知识章节列表
// GET /api/v1/education/knowledge/chapters
router.get('/knowledge/chapters', (req, res) => {
  try {
    const { subjectCode, grade, childId } = req.query;
    const tasks = db.prepare(`
      SELECT t.*, tp.status, tp.progress
      FROM reading_tasks t
      LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
      WHERE (? IS NULL OR t.subject_code = ?)
        AND (? IS NULL OR t.age_range LIKE ?)
      ORDER BY t.difficulty ASC, t.id ASC
    `).all(
      childId || 0,
      subjectCode || null,
      subjectCode || null,
      grade || null,
      grade ? `%${grade}%` : null
    );

    const groups = tasks.reduce((chapters, task) => {
      const chapterId = `${task.subject_code || 'general'}-${task.difficulty || 1}`;
      if (!chapters[chapterId]) {
        chapters[chapterId] = {
          id: chapterId,
          name: `${task.subject_code || '通用'} Lv.${task.difficulty || 1}`,
          progress: 0,
          points: []
        };
      }
      chapters[chapterId].points.push(mapKnowledgePoint(task));
      return chapters;
    }, {});

    const list = Object.values(groups).map(chapter => {
      const totalProgress = chapter.points.reduce((sum, point) => sum + (point.progress || 0), 0);
      return {
        ...chapter,
        progress: chapter.points.length ? Math.round(totalProgress / chapter.points.length) : 0
      };
    });

    res.json({
      success: true,
      data: { list }
    });
  } catch (err) {
    console.error('[Education] 获取知识章节失败:', err);
    res.status(500).json({
      success: false,
      message: '获取知识章节失败'
    });
  }
});

// 获取知识点详情
// GET /api/v1/education/knowledge/detail
router.get('/knowledge/detail', (req, res) => {
  try {
    const { pointId, subjectCode, childId } = req.query;

    if (!pointId) {
      return res.status(400).json({
        success: false,
        message: 'pointId不能为空'
      });
    }

    const task = db.prepare(`
      SELECT t.*, tp.status, tp.progress
      FROM reading_tasks t
      LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
      WHERE (t.task_code = ? OR CAST(t.id AS TEXT) = ?)
        AND (? IS NULL OR t.subject_code = ?)
      LIMIT 1
    `).get(childId || 0, pointId, pointId, subjectCode || null, subjectCode || null);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: task.task_code || String(task.id),
        task_id: task.id,
        name: task.title,
        title: task.title,
        status: task.status || 'pending',
        difficulty: task.difficulty || 1,
        progress: task.progress || 0,
        visual: {
          icon: task.icon_url || '',
          title: task.title,
          desc: task.objective || task.material || ''
        },
        explain: {
          title: task.title,
          content: task.content || task.objective || ''
        },
        keyPoints: parseSteps(task.steps).map((content, index) => ({ id: index + 1, content })),
        difficulties: task.tips ? [{ id: 1, content: task.tips }] : [],
        examples: task.example_answer ? [{
          id: 1,
          title: '参考答案',
          question: task.parent_prompt || task.objective || task.title,
          answer: task.example_answer,
          analysis: task.tips || ''
        }] : [],
        practices: [],
        material: task.material,
        objective: task.objective,
        parent_prompt: task.parent_prompt,
        duration: task.duration,
        audio_url: task.audio_url,
        video_url: task.video_url,
        image_url: task.image_url,
        cover_image: task.cover_image
      }
    });
  } catch (err) {
    console.error('[Education] 获取知识点详情失败:', err);
    res.status(500).json({
      success: false,
      message: '获取知识点详情失败'
    });
  }
});

// 更新知识点进度
// POST /api/v1/education/progress
router.post('/progress', (req, res) => {
  try {
    const { child_id, knowledge_point_id, status, mastery_level } = req.body;

    if (!child_id || !knowledge_point_id) {
      return res.status(400).json({
        success: false,
        message: 'child_id和knowledge_point_id不能为空'
      });
    }

    const child = db.prepare(`
      SELECT id FROM children WHERE id = ? AND user_id = ?
    `).get(child_id, req.user.userId);

    if (!child) {
      return res.status(403).json({
        success: false,
        message: '无权更新该孩子的学习进度'
      });
    }

    const task = db.prepare(`
      SELECT id FROM reading_tasks
      WHERE task_code = ? OR CAST(id AS TEXT) = ?
      LIMIT 1
    `).get(String(knowledge_point_id), String(knowledge_point_id));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '知识点不存在'
      });
    }

    const normalizedStatus = status === 'mastered' ? 'completed' : (status || 'in_progress');
    const progress = Math.max(0, Math.min(100, Number(mastery_level) || 0));
    const existing = db.prepare(`
      SELECT id FROM task_progress WHERE task_id = ? AND child_id = ?
    `).get(task.id, child_id);

    if (existing) {
      db.prepare(`
        UPDATE task_progress
        SET status = ?, progress = ?, completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
        WHERE id = ?
      `).run(normalizedStatus, progress, normalizedStatus, existing.id);
    } else {
      db.prepare(`
        INSERT INTO task_progress (child_id, task_id, status, progress, completed_at)
        VALUES (?, ?, ?, ?, CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)
      `).run(child_id, task.id, normalizedStatus, progress, normalizedStatus);
    }

    res.json({
      success: true,
      data: {
        child_id,
        knowledge_point_id: String(knowledge_point_id),
        status,
        mapped_status: normalizedStatus,
        mastery_level: progress
      }
    });
  } catch (err) {
    console.error('[Education] 更新知识点进度失败:', err);
    res.status(500).json({
      success: false,
      message: '更新知识点进度失败'
    });
  }
});

module.exports = router;
