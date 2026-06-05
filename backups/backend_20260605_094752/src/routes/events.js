// 事件追踪路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// 追踪事件
// POST /api/v1/kb/events/track
router.post('/track', (req, res) => {
  try {
    const {
      event_type,
      child_id,
      task_id,
      path_id,
      share_source,
      day_index,
      score,
      duration_sec,
      has_recording,
      event_meta
    } = req.body;

    if (!event_type) {
      return res.status(400).json({
        success: false,
        message: 'event_type 不能为空'
      });
    }

    // 存储事件
    const result = db.prepare(`
      INSERT INTO event_tracks 
      (user_id, event_type, event_data, session_id)
      VALUES (?, ?, ?, ?)
    `).run(
      1, // user_id
      event_type,
      JSON.stringify({
        child_id,
        task_id,
        path_id,
        share_source,
        day_index,
        score,
        duration_sec,
        has_recording,
        ...event_meta
      }),
      req.headers.authorization || 'anonymous'
    );

    res.json({
      success: true,
      data: { id: result.lastInsertRowid }
    });
  } catch (err) {
    console.error('[Events] 追踪事件失败:', err);
    res.status(500).json({
      success: false,
      message: '追踪事件失败'
    });
  }
});

module.exports = router;
