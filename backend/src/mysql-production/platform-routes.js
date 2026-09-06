const fs = require('fs/promises');
const path = require('path');
const media = require('./media-service');
const access = require('./admin-access');
const publishing = require('./content-publishing');
const tickets = require('./support-tickets');
const membership = require('./membership-operations');
const users = require('./user-operations');
const { normalizePainPoint } = require('./pain-points');
const { ARTICLE_FIELDS, PAIN_POINT_CATEGORIES } = require('./platform-contract');
const { getReleaseFlags } = require('./release-protection');

function cleanRichText(value) {
  return String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
}

function permission(action) {
  return (req, res, next) => {
    try { access.assertPermission(req.admin, action); next(); } catch (error) { res.status(error.statusCode || 403).json({ success: false, code: error.code, message: error.message }); }
  };
}

function auditRequest(req, actionType, targetType, targetId, before, after) {
  return { adminUserId: req.admin.adminUserId, actionType, targetType, targetId, before, after, ipAddress: req.ip };
}

function registerPlatformRoutes(app, options) {
  const { prefix, pool, uploadRoot, cdnPrefix = '', authenticateAdmin, releaseFlags = getReleaseFlags() } = options;
  const storage = media.createStorageAdapter({ root: uploadRoot, cdnPrefix });

  app.use(prefix, authenticateAdmin);
  app.use(`${prefix}/media`, contentWriteGate(releaseFlags));
  app.use(`${prefix}/articles`, contentWriteGate(releaseFlags));
  app.use(`${prefix}/pain-points`, contentWriteGate(releaseFlags));
  app.use(`${prefix}/content`, contentWriteGate(releaseFlags));
  app.use(`${prefix}/banners`, contentWriteGate(releaseFlags));

  app.post(`${prefix}/media`, permission('media:write'), async (req, res, next) => {
    let connection;
    try {
      const buffer = Buffer.from(String(req.body && req.body.data || ''), 'base64');
      const input = { buffer, filename: req.body && req.body.filename, mimeType: req.body && req.body.mime_type };
      const checked = media.validateMedia(input);
      const name = media.buildStoredName(input);
      const absolute = path.resolve(uploadRoot, 'media', name);
      if (!absolute.startsWith(path.resolve(uploadRoot, 'media') + path.sep)) throw new Error('媒体路径不合法');
      await fs.mkdir(path.dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, buffer, { flag: 'wx' }).catch((error) => { if (error.code !== 'EEXIST') throw error; });
      connection = await pool.getConnection();
      const url = storage.publicUrl(name);
      const audit = auditRequest(req, 'media.create', 'media', name, null, { filename: checked.filename, mimeType: checked.mimeType, size: checked.size });
      const result = await access.withAudit(connection, audit, async () => {
        const [insert] = await connection.execute('INSERT INTO media_assets (asset_key, media_type, mime_type, original_name, storage_key, url, thumbnail_url, byte_size, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, checked.mediaType, checked.mimeType, checked.filename, `media/${name}`, url, url, checked.size, req.admin.adminUserId]);
        return insert.insertId;
      });
      res.status(201).json({ success: true, data: { id: result, asset_key: name, type: checked.mediaType, url, thumbnail_url: url, status: 'active' } });
    } catch (error) { next(error); } finally { if (connection) connection.release(); }
  });

  app.get(`${prefix}/media`, permission('media:read'), async (req, res, next) => {
    try { const [rows] = await pool.execute('SELECT id, asset_key, media_type, mime_type, original_name, url, thumbnail_url, alt_text, byte_size, status, created_at FROM media_assets WHERE status = ? ORDER BY id DESC LIMIT ?', [String(req.query.status || 'active'), boundedLimit(req.query.limit)]); res.json({ success: true, list: rows }); } catch (error) { next(error); }
  });
  app.get(`${prefix}/media/:id/references`, permission('media:read'), async (req, res, next) => { try { const [rows] = await pool.execute('SELECT id, content_type, content_id, purpose, created_at FROM media_references WHERE media_asset_id = ? ORDER BY id DESC', [req.params.id]); res.json({ success: true, list: rows }); } catch (error) { next(error); } });
  app.post(`${prefix}/media/:id/references`, permission('media:write'), async (req, res, next) => { try { const body = req.body || {}; await pool.execute('INSERT INTO media_references (media_asset_id, content_type, content_id, purpose) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE purpose = VALUES(purpose)', [req.params.id, String(body.content_type || '').slice(0, 64), String(body.content_id || '').slice(0, 128), String(body.purpose || 'body').slice(0, 64)]); res.status(201).json({ success: true }); } catch (error) { next(error); } });
  app.put(`${prefix}/media/:id/status`, permission('media:write'), async (req, res, next) => { try { const status = ['active', 'processing', 'failed', 'archived'].includes(String(req.body && req.body.status)) ? String(req.body.status) : ''; if (!status) return res.status(400).json({ success: false, message: '媒体状态无效' }); await pool.execute('UPDATE media_assets SET status = ?, alt_text = COALESCE(?, alt_text) WHERE id = ?', [status, req.body.alt_text || null, req.params.id]); res.json({ success: true, data: { status } }); } catch (error) { next(error); } });

  app.post(`${prefix}/articles`, permission('article:write'), articleWriteHandler(pool, 'create'));
  app.put(`${prefix}/articles/:id`, permission('article:write'), articleWriteHandler(pool, 'update'));
  app.get(`${prefix}/articles`, permission('article:read'), async (req, res, next) => { try { const [rows] = await pool.execute('SELECT * FROM articles ORDER BY updated_at DESC LIMIT ?', [boundedLimit(req.query.limit)]); res.json({ success: true, list: rows }); } catch (error) { next(error); } });
  app.post(`${prefix}/pain-points`, permission('pain_point:write'), painPointWrite(pool, 'create'));
  app.put(`${prefix}/pain-points/:key`, permission('pain_point:write'), painPointWrite(pool, 'update'));

  app.get(`${prefix}/banners`, permission('banner:read'), bannerList(pool));
  app.post(`${prefix}/banners`, permission('banner:write'), bannerWrite(pool, 'create'));
  app.put(`${prefix}/banners/:id`, permission('banner:write'), bannerWrite(pool, 'update'));

  app.get(`${prefix}/membership/config`, permission('membership:read'), membershipConfigRead(pool));
  app.get(`${prefix}/membership/config/versions`, permission('membership:read'), membershipConfigVersions(pool));
  app.post(`${prefix}/membership/config/preview`, permission('membership:read'), (req, res) => res.json({ success: true, data: membership.normalizeMembershipConfig(req.body) }));
  app.post(`${prefix}/membership/config`, permission('membership:write'), membershipConfigCreate(pool));
  app.post(`${prefix}/membership/config/submit-review`, permission('membership:submit_review'), membershipConfigAction(pool, 'pending_review'));
  app.post(`${prefix}/membership/config/approve`, permission('membership:approve'), membershipConfigAction(pool, 'approved'));
  app.post(`${prefix}/membership/config/publish`, permission('membership:publish'), membershipConfigAction(pool, 'published'));
  app.post(`${prefix}/membership/config/offline`, permission('membership:offline'), membershipConfigAction(pool, 'offline'));
  app.post(`${prefix}/membership/config/restore`, permission('membership:restore'), membershipConfigRestore(pool));

  app.get(`${prefix}/users/operations`, permission('user:read'), async (req, res, next) => {
    try { res.json({ success: true, data: await users.listUsers(pool, req.query, access.can(req.admin.role, 'user:contact')) }); } catch (error) { next(error); }
  });
  app.get(`${prefix}/users/:id/service-records`, permission('user:service'), async (req, res, next) => {
    try { res.json({ success: true, data: { user_id: Number(req.params.id), items: await users.listServiceRecords(pool, req.params.id) } }); } catch (error) { next(error); }
  });

  ['submit-review', 'approve', 'publish', 'schedule', 'offline', 'restore'].forEach((action) => {
    const statusPermission = action === 'submit-review' ? 'content:submit_review' : `content:${action}`;
    app.post(`${prefix}/content/home_banner/:id/${action}`, permission(statusPermission), contentAction(pool, action === 'submit-review' ? 'pending_review' : action === 'approve' ? 'approved' : action === 'publish' ? 'published' : action === 'schedule' ? 'scheduled' : action === 'offline' ? 'offline' : 'draft'));
  });
  app.post(`${prefix}/content/:type/:id/submit-review`, permission('content:submit_review'), contentAction(pool, 'pending_review'));
  app.post(`${prefix}/content/:type/:id/approve`, permission('content:approve'), contentAction(pool, 'approved'));
  app.post(`${prefix}/content/:type/:id/publish`, permission('content:publish'), contentAction(pool, 'published'));
  app.post(`${prefix}/content/:type/:id/schedule`, permission('content:schedule'), contentAction(pool, 'scheduled'));
  app.post(`${prefix}/content/:type/:id/offline`, permission('content:offline'), contentAction(pool, 'offline'));
  app.post(`${prefix}/content/:type/:id/restore`, permission('content:restore'), contentAction(pool, 'draft'));

  app.get(`${prefix}/support/tickets`, permission('ticket:read'), supportList(pool));
  app.put(`${prefix}/support/tickets/:id`, permission('ticket:write'), supportUpdate(pool));
  app.post(`${prefix}/support/tickets/:id/callbacks`, permission('ticket:callback'), callbackCreate(pool));
}

function contentWriteGate(flags) {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    if (flags.adminContentWrite) return next();
    res.status(503).json({ success: false, code: 'CONTENT_WRITE_DISABLED', message: '内容运营写入暂未开放' });
  };
}

const MEMBERSHIP_CONTENT_TYPE = 'membership_config';
const MEMBERSHIP_CONTENT_ID = 'default';

function membershipConfigRead(pool) {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.execute('SELECT * FROM content_versions WHERE content_type = ? AND content_id = ? ORDER BY version DESC LIMIT 1', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID]);
      const row = rows[0];
      res.json({ success: true, data: row ? { ...membership.parsePayload(row.payload), version: row.version, review_status: row.review_status, publish_status: row.publish_status, created_at: row.created_at } : { ...membership.DEFAULT_CONFIG, version: 0, review_status: 'draft', publish_status: 'draft' } });
    } catch (error) { next(error); }
  };
}

function membershipConfigVersions(pool) {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.execute('SELECT id, version, payload, review_status, publish_status, created_by, published_at, created_at FROM content_versions WHERE content_type = ? AND content_id = ? ORDER BY version DESC LIMIT 50', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID]);
      res.json({ success: true, list: rows.map((row) => ({ id: row.id, version: row.version, config: membership.parsePayload(row.payload), review_status: row.review_status, publish_status: row.publish_status, created_by: row.created_by, published_at: row.published_at, created_at: row.created_at })) });
    } catch (error) { next(error); }
  };
}

function membershipConfigCreate(pool) {
  return async (req, res, next) => {
    let connection;
    try {
      connection = await pool.getConnection();
      const config = membership.normalizeMembershipConfig(req.body);
      const result = await access.withAudit(connection, { adminUserId: req.admin.adminUserId, actionType: 'membership_config.create', targetType: MEMBERSHIP_CONTENT_TYPE, targetId: MEMBERSHIP_CONTENT_ID, before: null, after: config, ipAddress: req.ip }, async () => {
        const [versions] = await connection.execute('SELECT COALESCE(MAX(version), 0) AS max_version FROM content_versions WHERE content_type = ? AND content_id = ?', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID]);
        const version = Number(versions[0].max_version || 0) + 1;
        await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) VALUES (?, ?, ?, ?, ?)', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID, version, membership.toPayload(config), req.admin.adminUserId]);
        return version;
      });
      res.status(201).json({ success: true, data: { ...config, version: result, review_status: 'draft', publish_status: 'draft' } });
    } catch (error) { next(error); } finally { if (connection) connection.release(); }
  };
}

function membershipConfigAction(pool, targetStatus) {
  return async (req, res, next) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT * FROM content_versions WHERE content_type = ? AND content_id = ? ORDER BY version DESC LIMIT 1 FOR UPDATE', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID]);
      if (!rows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: '会员配置版本不存在' }); }
      const current = rows[0];
      publishing.assertTransition(current.publish_status, targetStatus);
      await connection.execute('UPDATE content_versions SET review_status = ?, publish_status = ?, published_at = CASE WHEN ? = "published" THEN NOW() ELSE published_at END WHERE id = ?', [targetStatus === 'approved' ? 'approved' : current.review_status, targetStatus, targetStatus, current.id]);
      if (targetStatus === 'pending_review' || targetStatus === 'approved') await connection.execute('INSERT INTO content_reviews (content_version_id, reviewer_id, decision, comment) VALUES (?, ?, ?, ?)', [current.id, req.admin.adminUserId, targetStatus, String(req.body && req.body.comment || '').slice(0, 2000)]);
      await connection.execute('INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, before_payload, after_payload, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.admin.adminUserId, `membership_config.${targetStatus}`, MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID, JSON.stringify({ version: current.version, status: current.publish_status }), JSON.stringify({ version: current.version, status: targetStatus }), req.ip]);
      await connection.commit();
      res.json({ success: true, data: { version: current.version, publish_status: targetStatus } });
    } catch (error) { if (connection) await connection.rollback().catch(() => {}); next(error); } finally { if (connection) connection.release(); }
  };
}

function membershipConfigRestore(pool) {
  return async (req, res, next) => {
    let connection;
    try {
      const sourceVersion = Number(req.body && req.body.version);
      if (!Number.isInteger(sourceVersion) || sourceVersion < 1) return res.status(400).json({ success: false, message: '历史版本号无效' });
      connection = await pool.getConnection();
      const [rows] = await connection.execute('SELECT payload FROM content_versions WHERE content_type = ? AND content_id = ? AND version = ? LIMIT 1', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID, sourceVersion]);
      if (!rows.length) return res.status(404).json({ success: false, message: '历史会员配置不存在' });
      const config = membership.parsePayload(rows[0].payload);
      const result = await access.withAudit(connection, { adminUserId: req.admin.adminUserId, actionType: 'membership_config.restore', targetType: MEMBERSHIP_CONTENT_TYPE, targetId: MEMBERSHIP_CONTENT_ID, before: { source_version: sourceVersion }, after: config, ipAddress: req.ip }, async () => {
        const [versions] = await connection.execute('SELECT COALESCE(MAX(version), 0) AS max_version FROM content_versions WHERE content_type = ? AND content_id = ?', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID]);
        const version = Number(versions[0].max_version || 0) + 1;
        await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) VALUES (?, ?, ?, ?, ?)', [MEMBERSHIP_CONTENT_TYPE, MEMBERSHIP_CONTENT_ID, version, membership.toPayload(config), req.admin.adminUserId]);
        return version;
      });
      res.status(201).json({ success: true, data: { ...config, version: result, restored_from: sourceVersion, publish_status: 'draft' } });
    } catch (error) { next(error); } finally { if (connection) connection.release(); }
  };
}

function painPointWrite(pool, mode) {
  return async (req, res, next) => {
    try {
      const row = normalizePainPoint(Object.assign({}, req.body || {}, mode === 'update' ? { pain_point_key: req.params.key } : {}));
       let connection;
       try {
         connection = await pool.getConnection();
         const version = await access.withAudit(connection, { adminUserId: req.admin.adminUserId, actionType: `pain_point.${mode}`, targetType: 'pain_point', targetId: row.pain_point_key, before: null, after: row, ipAddress: req.ip }, async () => {
           if (mode === 'create') await connection.execute('INSERT INTO pain_points (pain_point_key, category, short_title, description, observable_signs, possible_reasons, today_action, parent_prompt, observe_signals, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [row.pain_point_key, row.category, row.short_title, row.description, JSON.stringify(row.observable_signs), JSON.stringify(row.possible_reasons), JSON.stringify(row.today_action), row.parent_prompt, JSON.stringify(row.observe_signals), row.content_hash]);
           else await connection.execute('UPDATE pain_points SET category = ?, short_title = ?, description = ?, observable_signs = ?, possible_reasons = ?, today_action = ?, parent_prompt = ?, observe_signals = ?, content_hash = ? WHERE pain_point_key = ?', [row.category, row.short_title, row.description, JSON.stringify(row.observable_signs), JSON.stringify(row.possible_reasons), JSON.stringify(row.today_action), row.parent_prompt, JSON.stringify(row.observe_signals), row.content_hash, row.pain_point_key]);
           const [versions] = await connection.execute('SELECT COALESCE(MAX(version), 0) AS max_version FROM content_versions WHERE content_type = ? AND content_id = ?', ['pain_point', row.pain_point_key]);
           const nextVersion = Number(versions[0] && versions[0].max_version || 0) + 1;
           await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) VALUES (?, ?, ?, ?, ?)', ['pain_point', row.pain_point_key, nextVersion, JSON.stringify(row), req.admin.adminUserId]);
           return nextVersion;
         });
         res.status(mode === 'create' ? 201 : 200).json({ success: true, data: row, meta: { status: 'draft', version } });
       } finally {
         if (connection) connection.release();
       }
    } catch (error) { next(error); }
  };
}

function registerPublicRoutes(app, options) {
  const { prefix, pool, authenticateToken, releaseFlags = getReleaseFlags() } = options;
  app.get(`${prefix}/pain-points`, async (req, res, next) => {
    if (!releaseFlags.serverContentRead) return res.status(503).json({ success: false, code: 'CONTENT_READ_DISABLED', message: '服务端内容暂未开放' });
    try {
      const params = [];
      const where = ['1 = 1'];
      if (req.query.category && PAIN_POINT_CATEGORIES.includes(String(req.query.category))) { where.push('category = ?'); params.push(String(req.query.category)); }
      const [rows] = await pool.execute(`SELECT * FROM pain_points WHERE ${where.join(' AND ')} ORDER BY id ASC`, params);
      res.json({ success: true, list: rows.map(formatPainPoint), meta: { source: 'formal', fallback: false } });
    } catch (error) { next(error); }
  });
  app.get(`${prefix}/pain-points/:key`, async (req, res, next) => {
    if (!releaseFlags.serverContentRead) return res.status(503).json({ success: false, code: 'CONTENT_READ_DISABLED', message: '服务端内容暂未开放' });
    try { const [rows] = await pool.execute('SELECT * FROM pain_points WHERE pain_point_key = ? LIMIT 1', [req.params.key]); if (!rows.length) return res.status(404).json({ success: false, message: '成长痛点不存在' }); res.json({ success: true, data: formatPainPoint(rows[0]) }); } catch (error) { next(error); }
  });
  app.get(`${prefix}/content/:type/:id`, async (req, res, next) => {
    if (!releaseFlags.serverContentRead) return res.status(503).json({ success: false, code: 'CONTENT_READ_DISABLED', message: '服务端内容暂未开放' });
     try { const [rows] = await pool.execute(`SELECT * FROM content_versions WHERE content_type = ? AND content_id = ? AND review_status = 'approved' AND publish_status = 'published' AND (published_at IS NULL OR published_at <= NOW()) ORDER BY version DESC LIMIT 1`, [req.params.type, req.params.id]); if (!rows.length) return res.json({ success: true, data: null, meta: { available: false } }); res.json({ success: true, data: JSON.parse(rows[0].payload), meta: { available: true, version: rows[0].version, published_at: rows[0].published_at } }); } catch (error) { next(error); }
  });
  app.get(`${prefix}/home/banners`, async (req, res, next) => {
    if (!releaseFlags.serverContentRead) return res.status(503).json({ success: false, code: 'CONTENT_READ_DISABLED', message: '服务端内容暂未开放' });
    try {
      const [rows] = await pool.execute(`SELECT payload, version, published_at FROM content_versions WHERE content_type = 'home_banner' AND review_status = 'approved' AND publish_status = 'published' AND (published_at IS NULL OR published_at <= NOW()) ORDER BY JSON_EXTRACT(payload, '$.sort_order') ASC, version DESC`);
      const seen = new Set();
      const list = rows.map((row) => {
        const payload = parseJsonObject(row.payload);
        const id = String(payload.banner_id || '');
        if (!id || seen.has(id) || Number(payload.enabled) !== 1 || !isBannerActive(payload)) return null;
        seen.add(id);
        return { ...payload, version: row.version, published_at: row.published_at };
      }).filter(Boolean);
      res.json({ success: true, list });
    } catch (error) { next(error); }
  });
  app.get(`${prefix}/feedback/history`, authenticateToken, async (req, res, next) => {
    try { const [rows] = await pool.execute('SELECT id, type, content, status, channel, public_progress, created_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]); res.json({ success: true, list: rows.map(tickets.publicTicket) }); } catch (error) { next(error); }
  });
}

function articleWriteHandler(pool, mode) {
  return async (req, res, next) => {
    let connection;
    try {
      const body = req.body || {};
      const values = ARTICLE_FIELDS.map((field) => field === 'content' ? cleanRichText(body[field]) : body[field] == null ? '' : body[field]);
      connection = await pool.getConnection();
      const targetId = mode === 'create' ? null : req.params.id;
      const result = await access.withAudit(connection, {
        adminUserId: req.admin.adminUserId, actionType: `article.${mode}`, targetType: 'article', targetId: targetId || 'new', before: null, after: body, ipAddress: req.ip
      }, async () => {
        let id = targetId;
        if (mode === 'create') {
          const [insert] = await connection.execute(`INSERT INTO articles (${ARTICLE_FIELDS.join(', ')}) VALUES (${ARTICLE_FIELDS.map(() => '?').join(', ')})`, values);
          id = insert.insertId;
        } else {
          await connection.execute(`UPDATE articles SET ${ARTICLE_FIELDS.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, values.concat(targetId));
        }
        await connection.execute('UPDATE articles SET is_published = 0 WHERE id = ?', [id]);
        const [versions] = await connection.execute('SELECT COALESCE(MAX(version), 0) AS max_version FROM content_versions WHERE content_type = "article" AND content_id = ?', [String(id)]);
        await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) VALUES (?, ?, ?, ?, ?)', ['article', String(id), Number(versions[0].max_version) + 1, JSON.stringify({ id, ...body, content: cleanRichText(body.content) }), req.admin.adminUserId]);
        return id;
      });
      res.status(mode === 'create' ? 201 : 200).json({ success: true, data: { id: result, ...body, content: cleanRichText(body.content) }, meta: { status: 'draft' } });
    } catch (error) { next(error); } finally { if (connection) connection.release(); }
  };
}

const BANNER_ACTIONS = ['assessment', 'chat', 'task', 'weekly_report', 'development_zones', 'parenting', 'nutrition', 'textbook'];
const BANNER_FIELDS = ['banner_id', 'title', 'description', 'cta', 'action', 'image_url', 'mobile_image_url', 'sort_order', 'enabled', 'start_at', 'end_at', 'alt_text'];

function normalizeBanner(input, fallbackId) {
  const body = input || {};
  const bannerId = String(body.banner_id || fallbackId || '').trim().slice(0, 128);
  if (!bannerId || !String(body.title || '').trim()) throw Object.assign(new Error('Banner 标识和标题不能为空'), { statusCode: 400 });
  if (!BANNER_ACTIONS.includes(String(body.action || ''))) throw Object.assign(new Error('Banner 跳转类型无效'), { statusCode: 400 });
  const result = {};
  BANNER_FIELDS.forEach((field) => { result[field] = field === 'sort_order' ? Math.max(0, Number(body[field] || 0)) : field === 'enabled' ? (body[field] === true || body[field] === 1 || body[field] === '1' ? 1 : 0) : cleanPlainText(body[field]).slice(0, 500); });
  result.banner_id = bannerId;
  return result;
}

function bannerList(pool) {
  return async (req, res, next) => {
    try {
      const [rows] = await pool.execute(`SELECT cv.content_id, cv.payload, cv.version, cv.review_status, cv.publish_status, cv.published_at, cv.created_at, job.scheduled_at FROM content_versions cv LEFT JOIN (SELECT version_id, MAX(scheduled_at) AS scheduled_at FROM content_publish_jobs GROUP BY version_id) job ON job.version_id = cv.id WHERE cv.content_type = 'home_banner' ORDER BY cv.content_id, cv.version DESC`);
      const seen = new Set();
      const list = rows.map((row) => { if (seen.has(row.content_id)) return null; seen.add(row.content_id); return { content_id: row.content_id, ...parseJsonObject(row.payload), version: row.version, review_status: row.review_status, publish_status: row.publish_status, scheduled_at: row.scheduled_at, published_at: row.published_at }; }).filter(Boolean);
      res.json({ success: true, list });
    } catch (error) { next(error); }
  };
}

function bannerWrite(pool, mode) {
  return async (req, res, next) => {
    let connection;
    try {
      const banner = normalizeBanner(req.body, mode === 'update' ? req.params.id : null);
      connection = await pool.getConnection();
      const version = await access.withAudit(connection, auditRequest(req, `banner.${mode}`, 'home_banner', banner.banner_id, null, banner), async () => {
        const [versions] = await connection.execute('SELECT COALESCE(MAX(version), 0) AS max_version FROM content_versions WHERE content_type = ? AND content_id = ?', ['home_banner', banner.banner_id]);
        const nextVersion = Number(versions[0].max_version || 0) + 1;
        await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) VALUES (?, ?, ?, ?, ?)', ['home_banner', banner.banner_id, nextVersion, JSON.stringify(banner), req.admin.adminUserId]);
        return nextVersion;
      });
      res.status(mode === 'create' ? 201 : 200).json({ success: true, data: { content_id: banner.banner_id, ...banner, version, review_status: 'draft', publish_status: 'draft' } });
    } catch (error) { next(error); } finally { if (connection) connection.release(); }
  };
}

function parseJsonObject(value) { if (value && typeof value === 'object') return value; try { return value ? JSON.parse(value) : {}; } catch (error) { return {}; } }
function cleanPlainText(value) { return String(value == null ? '' : value).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, '').trim(); }
function isBannerActive(payload) { const now = Date.now(); const start = payload.start_at ? Date.parse(payload.start_at) : NaN; const end = payload.end_at ? Date.parse(payload.end_at) : NaN; return (!Number.isNaN(start) ? start <= now : true) && (!Number.isNaN(end) ? end >= now : true); }

function contentAction(pool, targetStatus) {
  return async (req, res, next) => {
    let connection;
    try {
      const contentType = req.params.type || (req.path.includes('/content/home_banner/') ? 'home_banner' : '');
      const isRestore = targetStatus === 'draft' && req.path.endsWith('/restore');
      const requestedVersion = isRestore ? Number(req.body && req.body.version) : null;
      if (!contentType) return res.status(400).json({ success: false, message: '内容类型不能为空' });
      if (isRestore && (!Number.isInteger(requestedVersion) || requestedVersion < 1)) return res.status(400).json({ success: false, message: '历史版本号无效' });
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT * FROM content_versions WHERE content_type = ? AND content_id = ? ORDER BY version DESC LIMIT 1 FOR UPDATE', [contentType, req.params.id]);
      if (!rows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: '内容版本不存在' }); }
      const current = rows[0];
      const from = current.publish_status;
      let restoredVersion = null;
      let restoredId = null;
      if (isRestore) {
        const [sourceRows] = await connection.execute('SELECT * FROM content_versions WHERE content_type = ? AND content_id = ? AND version = ? LIMIT 1 FOR UPDATE', [contentType, req.params.id, requestedVersion]);
        if (!sourceRows.length) { await connection.rollback(); return res.status(404).json({ success: false, message: '历史版本不存在' }); }
        const source = sourceRows[0];
        restoredVersion = Number(current.version) + 1;
        const [insert] = await connection.execute('INSERT INTO content_versions (content_type, content_id, version, payload, created_by) SELECT content_type, content_id, ?, payload, ? FROM content_versions WHERE id = ?', [restoredVersion, req.admin.adminUserId, source.id]);
        restoredId = insert.insertId;
      } else {
        publishing.assertTransition(from, targetStatus);
        await connection.execute('UPDATE content_versions SET review_status = ?, publish_status = ? WHERE id = ?', [targetStatus === 'approved' ? 'approved' : current.review_status, targetStatus, current.id]);
        if (targetStatus === 'pending_review' || targetStatus === 'approved' || targetStatus === 'rejected') await connection.execute('INSERT INTO content_reviews (content_version_id, reviewer_id, decision, comment) VALUES (?, ?, ?, ?)', [current.id, req.admin.adminUserId, targetStatus, String(req.body && (req.body.comment || req.body.reason) || '').slice(0, 2000)]);
        if (targetStatus === 'scheduled') await connection.execute('INSERT INTO content_publish_jobs (content_type, content_id, version_id, scheduled_at) VALUES (?, ?, ?, ?)', [contentType, req.params.id, current.id, req.body && req.body.scheduled_at ? new Date(req.body.scheduled_at) : new Date()]);
        if (targetStatus === 'published') await connection.execute('UPDATE content_versions SET published_at = NOW() WHERE id = ?', [current.id]);
        if (contentType === 'article' && targetStatus === 'published') await connection.execute('UPDATE articles SET is_published = 1 WHERE id = ?', [req.params.id]);
        if (contentType === 'article' && targetStatus === 'offline') await connection.execute('UPDATE articles SET is_published = 0 WHERE id = ?', [req.params.id]);
      }
      const actionName = isRestore ? 'restore' : targetStatus;
      const afterPayload = isRestore ? { status: targetStatus, version: restoredVersion, restored_from: requestedVersion } : { status: targetStatus };
      await connection.execute('INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, before_payload, after_payload, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.admin.adminUserId, `content.${actionName}`, contentType, req.params.id, JSON.stringify({ status: from }), JSON.stringify(afterPayload), req.ip]);
      await connection.commit().catch(() => {});
      res.json({ success: true, data: { id: isRestore ? restoredId : current.id, status: targetStatus, ...(isRestore ? { version: restoredVersion, restored_from: requestedVersion } : {}) } });
    } catch (error) { if (connection) await connection.rollback().catch(() => {}); next(error); } finally { if (connection) connection.release(); }
  };
}

function supportList(pool) {
  return async (req, res, next) => {
    try {
      const status = tickets.STATUSES.includes(String(req.query.status || '')) ? String(req.query.status) : '';
      const where = status ? ' WHERE status = ?' : '';
      const params = status ? [status] : [];
      params.push(boundedLimit(req.query.limit));
      const [rows] = await pool.execute(
        `SELECT id, user_id, type, content, contact, source_page, channel, priority, status, assignee_id, public_progress, created_at, updated_at FROM support_tickets${where} ORDER BY FIELD(priority, "urgent", "high", "normal", "low"), created_at ASC LIMIT ?`,
        params
      );
      const canReadContact = access.can(req.admin.role, 'ticket:contact');
      res.json({ success: true, list: rows.map((row) => ({ ...row, contact: canReadContact ? row.contact : tickets.maskContact(row.contact) })) });
    } catch (error) {
      next(error);
    }
  };
}

function supportUpdate(pool) {
  return async (req, res, next) => {
    let connection;
    try {
      const body = req.body || {};
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT id, status FROM support_tickets WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: '客服工单不存在' });
      }

      const fields = [];
      const values = [];
      if (body.status && body.status !== rows[0].status) {
        tickets.assertStatusTransition(rows[0].status, body.status);
        fields.push('status = ?');
        values.push(body.status);
      }
      if (body.priority) {
        if (!tickets.PRIORITIES.includes(body.priority)) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: '工单优先级无效' });
        }
        fields.push('priority = ?');
        values.push(body.priority);
      }
      if (body.assignee_id !== undefined) {
        fields.push('assignee_id = ?');
        values.push(Number(body.assignee_id) || null);
      }
      if (body.public_progress !== undefined) {
        fields.push('public_progress = ?');
        values.push(String(body.public_progress).slice(0, 2000));
      }
      if (!fields.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: '没有可更新字段' });
      }

      values.push(req.params.id);
      await connection.execute(`UPDATE support_tickets SET ${fields.join(', ')} WHERE id = ?`, values);
      await connection.execute('INSERT INTO support_ticket_events (ticket_id, event_type, actor_id, note, public_visible) VALUES (?, "update", ?, ?, ?)', [req.params.id, req.admin.adminUserId, String(body.note || '').slice(0, 2000), body.public_progress ? 1 : 0]);
      await connection.execute('INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, after_payload, ip_address) VALUES (?, ?, ?, ?, ?, ?)', [req.admin.adminUserId, 'ticket.update', 'support_ticket', req.params.id, JSON.stringify({ status: body.status, priority: body.priority, assignee_id: body.assignee_id, public_progress: body.public_progress }), req.ip]);
      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      if (connection) await connection.rollback().catch(() => {});
      next(error);
    } finally {
      if (connection) connection.release();
    }
  };
}

function callbackCreate(pool) {
  return async (req, res, next) => {
    let connection;
    try {
      const body = req.body || {};
      const callbackResult = String(body.callback_result || '').trim().slice(0, 4000);
      const callbackMethod = ['phone', 'wechat'].includes(body.callback_method) ? body.callback_method : 'phone';
      if (!callbackResult) return res.status(400).json({ success: false, message: '请填写回访结果' });

      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT id, status FROM support_tickets WHERE id = ? FOR UPDATE', [req.params.id]);
      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: '客服工单不存在' });
      }
      const nextStatus = body.status || 'closed';
      if (nextStatus !== rows[0].status) tickets.assertStatusTransition(rows[0].status, nextStatus);
      const publicProgress = String(body.public_progress || '客服已完成回访，反馈已处理。').slice(0, 2000);
      await connection.execute('INSERT INTO support_ticket_events (ticket_id, event_type, actor_id, note, callback_at, callback_method, callback_result, public_visible) VALUES (?, "callback", ?, ?, ?, ?, ?, ?)', [req.params.id, req.admin.adminUserId, String(body.note || callbackResult).slice(0, 4000), body.callback_at || new Date(), callbackMethod, callbackResult, body.public_visible ? 1 : 0]);
      await connection.execute('UPDATE support_tickets SET status = ?, public_progress = ? WHERE id = ?', [nextStatus, publicProgress, req.params.id]);
      await connection.execute('INSERT INTO admin_audit_logs (admin_user_id, action_type, target_type, target_id, after_payload, ip_address) VALUES (?, ?, ?, ?, ?, ?)', [req.admin.adminUserId, 'ticket.callback', 'support_ticket', req.params.id, JSON.stringify({ status: nextStatus, callback_method: callbackMethod, public_progress: publicProgress }), req.ip]);
      await connection.commit();
      res.json({ success: true, data: { status: nextStatus, public_progress: publicProgress } });
    } catch (error) {
      if (connection) await connection.rollback().catch(() => {});
      next(error);
    } finally {
      if (connection) connection.release();
    }
  };
}
function formatPainPoint(row) { return { ...row, observable_signs: parseJson(row.observable_signs), possible_reasons: parseJson(row.possible_reasons), today_action: parseJson(row.today_action), observe_signals: parseJson(row.observe_signals) }; }
function parseJson(value) { if (Array.isArray(value) || (value && typeof value === 'object')) return value; try { return value ? JSON.parse(value) : []; } catch (error) { return []; } }
function boundedLimit(value) { const number = Number(value); return Number.isInteger(number) ? Math.min(100, Math.max(1, number)) : 20; }

module.exports = { registerPlatformRoutes, registerPublicRoutes, cleanRichText, cleanPlainText, permission, boundedLimit, formatPainPoint, normalizePainPoint, contentWriteGate, contentAction };
