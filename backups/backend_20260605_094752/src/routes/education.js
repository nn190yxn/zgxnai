// 教育路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

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

module.exports = router;
