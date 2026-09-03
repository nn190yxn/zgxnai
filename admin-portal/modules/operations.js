(function () {
  'use strict';

  const MODULES = [
    { key: 'media', label: '媒体', read: '/media?status=active&limit=30', permission: 'media:read' },
    { key: 'articles', label: '文章', read: '/articles?limit=30', permission: 'article:read' },
    { key: 'pain-points', label: '成长痛点', read: '/content/ops/tips?limit=30', permission: 'pain_point:read' },
    { key: 'training', label: '训练', read: '/content/ops/articles?content_type=task&limit=30', permission: 'article:read' },
    { key: 'nutrition', label: '营养', read: '/content/ops/articles?content_type=recipe&limit=30', permission: 'article:read' },
    { key: 'membership', label: '会员', read: '/membership/config', permission: 'membership:read' },
    { key: 'users', label: '用户', read: '/users/operations?limit=30', permission: 'user:read' },
    { key: 'support', label: '客服', read: '/support/tickets?limit=30', permission: 'ticket:read' }
  ];
  const contentTypes = ['articles', 'pain-points', 'training', 'nutrition'];
  const state = {};

  function esc(value) {
    return window.AdminPortal.escapeHtml(value);
  }

  function itemList(payload) {
    if (Array.isArray(payload)) return payload;
    return payload && (payload.items || payload.list || payload.data && payload.data.items) || [];
  }

  function renderStatus(key, message, tone, retry) {
    const node = document.querySelector(`[data-module-status="${key}"]`);
    if (!node) return;
    node.innerHTML = `<span class="operation-status-${tone}">${esc(message)}</span>${retry ? '<button type="button" class="ghost operation-retry">重试</button>' : ''}`;
    if (retry) node.querySelector('button').addEventListener('click', () => loadModule(key));
  }

  function markDirty(form, dirty) {
    form.dataset.dirty = dirty ? 'true' : 'false';
    const hint = form.querySelector('[data-unsaved]');
    if (hint) hint.textContent = dirty ? '有未保存修改，离开前请保存。' : '';
  }

  function renderRows(key, payload) {
    const container = document.querySelector(`[data-module-list="${key}"]`);
    if (!container) return;
    const items = itemList(payload);
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">暂无内容，可点击刷新重试。</div>';
      return;
    }
    container.innerHTML = items.map((item, index) => {
      const id = item.id || item.pain_point_key || item.content_id || item.key || index + 1;
      const title = item.title || item.short_title || item.name || item.nickname || item.type || `记录 ${id}`;
      const status = item.publish_status || item.status || item.activity_status || '';
      return `<button type="button" class="operation-row" data-item-id="${esc(id)}" data-item-title="${esc(title)}"><strong>${esc(title)}</strong><span>${esc(status || '可编辑')}</span></button>`;
    }).join('');
    container.querySelectorAll('.operation-row').forEach((row) => row.addEventListener('click', () => selectItem(key, row.dataset.itemId, row.dataset.itemTitle)));
  }

  function editor(key, itemId, title) {
    const container = document.querySelector(`[data-module-editor="${key}"]`);
    if (!container) return;
    if (key === 'media') {
      container.innerHTML = `<form class="operation-editor media-editor" data-editor-form="media"><div class="editor-heading"><h4>上传或登记媒体</h4><span class="permission-badge">需要 media:write</span></div><label>文件<input name="file" type="file" accept="image/*,audio/*,video/*" /></label><label>文件名<input name="filename" required placeholder="例如 step-1.webp" /></label><label>已有媒体 URL<input name="media_url" placeholder="可复用已有 URL" /></label><label>替代文本<input name="alt_text" placeholder="媒体说明" /></label><label>关联内容 ID<input name="content_id" placeholder="可选，建立引用关系" /></label><div class="editor-actions"><button type="submit">上传媒体</button><button type="button" class="ghost media-status-action">标记归档</button></div><p class="hint" data-unsaved></p><div class="editor-state" data-editor-state>支持图片、音频和视频媒体</div></form>`;
      const mediaForm = container.querySelector('form');
      mediaForm.addEventListener('input', () => markDirty(mediaForm, true));
      mediaForm.addEventListener('submit', (event) => saveMedia(event, mediaForm));
      mediaForm.querySelector('.media-status-action').addEventListener('click', () => updateMediaStatus(mediaForm, itemId));
      return;
    }
    if (key === 'support') {
      container.innerHTML = `<form class="operation-editor" data-editor-form="support" data-item-id="${esc(itemId || '')}"><div class="editor-heading"><h4>跟进家长反馈 #${esc(itemId || '')}</h4><span class="permission-badge">需要 ticket:write</span></div><label>处理状态<select name="status"><option value="processing">处理中</option><option value="pending_callback">待回访</option><option value="closed">已完成</option></select></label><label>优先级<select name="priority"><option value="urgent">紧急</option><option value="high">高</option><option value="normal">普通</option><option value="low">低</option></select></label><label>公开进展<textarea name="public_progress"></textarea></label><label>回访结果<textarea name="callback_result"></textarea></label><div class="editor-actions"><button type="submit">保存跟进进展</button><button type="button" class="ghost callback-action">记录回访</button></div><div class="editor-state" data-editor-state>联系方式按角色权限显示</div></form>`;
      const ticketForm = container.querySelector('form');
      ticketForm.addEventListener('submit', (event) => updateTicket(event, ticketForm));
      ticketForm.querySelector('.callback-action').addEventListener('click', () => callbackTicket(ticketForm));
      return;
    }
    if (key === 'membership') {
      container.innerHTML = `<form class="operation-editor" data-editor-form="membership"><div class="editor-heading"><h4>会员页面配置</h4><span class="permission-badge">需要 membership:write</span></div><label>页面内容<textarea name="config" required>{"entry":{"title":"会员服务","subtitle":"陪伴孩子持续成长"},"benefits":[],"plans":[]}</textarea></label><label>审核意见<textarea name="comment" placeholder="审核时填写"></textarea></label><div class="editor-actions"><button type="submit">保存页面草稿</button><button type="button" class="ghost membership-preview">预览页面</button><button type="button" class="ghost membership-action" data-action="submit-review">送审</button><button type="button" class="ghost membership-action" data-action="approve">审核通过</button><button type="button" class="membership-action" data-action="publish">上线页面</button><button type="button" class="ghost membership-action" data-action="restore">恢复之前的修改</button></div><div class="editor-preview-panel" hidden></div><div class="editor-state" data-editor-state>会员支付和权益计算沿用现有服务</div></form>`;
      const membershipForm = container.querySelector('form');
      membershipForm.addEventListener('submit', async (event) => { event.preventDefault(); try { await window.AdminPortal.request('/membership/config', { method: 'POST', body: membershipForm.elements.config.value }); markDirty(membershipForm, false); setEditorState(membershipForm, '会员页面草稿已保存', 'success'); loadModule('membership'); } catch (error) { setEditorState(membershipForm, `保存失败：${error.message}`, 'error'); } });
      membershipForm.querySelector('.membership-preview').addEventListener('click', async () => { try { const result = await window.AdminPortal.request('/membership/config/preview', { method: 'POST', body: membershipForm.elements.config.value }); const panel = membershipForm.querySelector('.editor-preview-panel'); panel.hidden = false; panel.innerHTML = `<strong>页面预览</strong><p>${esc(result.entry?.title || '')} · ${esc(result.entry?.subtitle || '')}</p>`; } catch (error) { setEditorState(membershipForm, `预览失败：${error.message}`, 'error'); } });
      membershipForm.querySelectorAll('.membership-action').forEach((button) => button.addEventListener('click', async () => { const action = button.dataset.action; try { const body = action === 'restore' ? { version: Number(window.prompt('请输入要恢复的版本号')) } : { comment: membershipForm.elements.comment.value }; await window.AdminPortal.request(`/membership/config/${action === 'submit-review' ? 'submit-review' : action}`, { method: 'POST', body: JSON.stringify(body) }); setEditorState(membershipForm, '会员配置状态已更新', 'success'); loadModule('membership'); } catch (error) { setEditorState(membershipForm, `操作失败：${error.message}`, 'error'); } }));
      return;
    }
    if (key === 'users') {
      container.innerHTML = `<div class="operation-editor"><h4>用户服务记录</h4><p class="hint">选择用户后查看授权范围内的服务记录。</p><button type="button" class="ghost service-records-action">加载服务记录</button><div class="editor-state" data-editor-state>联系方式按字段权限脱敏</div></div>`;
      container.querySelector('.service-records-action').addEventListener('click', async () => { try { const result = await window.AdminPortal.request(`/users/${encodeURIComponent(itemId)}/service-records`); container.querySelector('[data-editor-state]').textContent = `${(result.items || []).length} 条服务记录`; } catch (error) { container.querySelector('[data-editor-state]').textContent = `加载失败：${error.message}`; } });
      return;
    }
    const isContent = contentTypes.includes(key);
    container.innerHTML = `<form class="operation-editor" data-editor-form="${key}" data-item-id="${esc(itemId || '')}">
      <div class="editor-heading"><h4>${esc(title || `新建${MODULES.find((module) => module.key === key).label}`)}</h4><span class="permission-badge" data-permission="${MODULES.find((module) => module.key === key).permission}">权限按角色显示</span></div>
      <label>标识<input name="content_id" value="${esc(itemId || '')}" placeholder="稳定标识" /></label>
      <label>标题<input name="title" required value="${esc(title || '')}" placeholder="标题" /></label>
      <label>摘要<textarea name="summary" placeholder="摘要、典型表现或安全提示"></textarea></label>
      <label>正文<textarea name="content" required placeholder="正文、步骤、家长话术或营养说明"></textarea></label>
      <label>媒体 URL<input name="media_url" placeholder="选择已有媒体 URL 或填写引用地址" /></label>
      ${isContent ? '<label>计划上线时间<input name="scheduled_at" type="datetime-local" /></label><label>审核意见<textarea name="comment" placeholder="送审或审核通过时填写"></textarea></label>' : ''}
      <div class="editor-actions"><button type="submit">保存草稿</button>${isContent ? '<button type="button" class="ghost editor-preview">预览内容</button><button type="button" class="ghost content-action" data-action="submit-review">送审</button><button type="button" class="ghost content-action" data-action="approve">审核通过</button><button type="button" class="content-action" data-action="publish">立即上线</button><button type="button" class="ghost content-action" data-action="schedule">安排上线</button><button type="button" class="ghost content-action" data-action="restore">恢复之前的修改</button>' : ''}</div>
      <p class="hint" data-unsaved></p><div class="editor-preview-panel" hidden></div><div class="editor-state" data-editor-state>等待操作</div>
    </form>`;
    const form = container.querySelector('form');
    form.addEventListener('input', () => markDirty(form, true));
    form.addEventListener('submit', (event) => saveEditor(event, key, form));
    container.querySelector('.editor-preview')?.addEventListener('click', () => previewEditor(form));
    container.querySelectorAll('.content-action').forEach((button) => button.addEventListener('click', () => contentAction(key, form, button.dataset.action)));
  }

  function selectItem(key, id, title) {
    state[key] = Object.assign({}, state[key], { itemId: id });
    editor(key, id, title);
  }

  async function loadModule(key) {
    const module = MODULES.find((item) => item.key === key);
    renderStatus(key, '正在加载...', 'loading');
    try {
      const payload = await window.AdminPortal.request(module.read);
      state[key] = Object.assign({}, state[key], { payload });
      renderRows(key, payload);
      renderStatus(key, itemList(payload).length ? '数据已加载' : '暂无数据', 'success');
    } catch (error) {
      renderStatus(key, error.code === 'ADMIN_PERMISSION_DENIED' || error.status === 403 ? '当前角色无权访问此模块' : `加载失败：${error.message}`, 'error', true);
      const list = document.querySelector(`[data-module-list="${key}"]`);
      if (list && !list.innerHTML) list.innerHTML = '<div class="empty-state">当前页面数据已保留，请检查权限后重试。</div>';
    }
  }

  async function saveEditor(event, key, form) {
    event.preventDefault();
    const id = form.dataset.itemId || form.elements.content_id.value.trim();
    const body = Object.fromEntries(new FormData(form).entries());
    const path = key === 'articles' ? (id ? `/articles/${encodeURIComponent(id)}` : '/articles') : key === 'pain-points' ? (id ? `/pain-points/${encodeURIComponent(id)}` : '/pain-points') : `/articles${id ? `/${encodeURIComponent(id)}` : ''}`;
    setEditorState(form, '正在保存草稿...', 'loading');
    try {
      await window.AdminPortal.request(path, { method: id && key !== 'articles' ? 'PUT' : id && key === 'articles' ? 'PUT' : 'POST', body: JSON.stringify(body) });
      markDirty(form, false);
      setEditorState(form, '草稿已保存', 'success');
      loadModule(key);
    } catch (error) {
      setEditorState(form, error.code === 'ADMIN_PERMISSION_DENIED' ? '权限不足，当前数据已保留' : `保存失败：${error.message}`, 'error');
    }
  }

  async function saveMedia(event, form) {
    event.preventDefault();
    const file = form.elements.file.files[0];
    if (!file) return setEditorState(form, '请选择媒体文件', 'error');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = String(reader.result).split(',')[1] || '';
        const result = await window.AdminPortal.request('/media', { method: 'POST', body: JSON.stringify({ data, filename: form.elements.filename.value, mime_type: file.type }) });
        if (form.elements.content_id.value && result.id) await window.AdminPortal.request(`/media/${result.id}/references`, { method: 'POST', body: JSON.stringify({ content_type: 'article', content_id: form.elements.content_id.value, purpose: 'body' }) });
        markDirty(form, false);
        setEditorState(form, '媒体已登记，可复用于内容引用', 'success');
        loadModule('media');
      } catch (error) { setEditorState(form, error.code === 'ADMIN_PERMISSION_DENIED' ? '权限不足，媒体表单已保留' : `媒体上传失败：${error.message}`, 'error'); }
    };
    reader.readAsDataURL(file);
  }

  async function updateMediaStatus(form, id) {
    if (!id) return setEditorState(form, '请先从列表选择媒体', 'error');
    try { await window.AdminPortal.request(`/media/${encodeURIComponent(id)}/status`, { method: 'PUT', body: JSON.stringify({ status: 'archived', alt_text: form.elements.alt_text.value }) }); setEditorState(form, '媒体已归档', 'success'); loadModule('media'); } catch (error) { setEditorState(form, `状态更新失败：${error.message}`, 'error'); }
  }

  async function updateTicket(event, form) {
    event.preventDefault();
    try { await window.AdminPortal.request(`/support/tickets/${encodeURIComponent(form.dataset.itemId)}`, { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(form))) }); setEditorState(form, '家长反馈已更新', 'success'); loadModule('support'); } catch (error) { setEditorState(form, `反馈更新失败：${error.message}`, 'error'); }
  }

  async function callbackTicket(form) {
    try { await window.AdminPortal.request(`/support/tickets/${encodeURIComponent(form.dataset.itemId)}/callbacks`, { method: 'POST', body: JSON.stringify({ callback_result: form.elements.callback_result.value, note: form.elements.callback_result.value, callback_method: 'phone' }) }); setEditorState(form, '回访记录已保存', 'success'); } catch (error) { setEditorState(form, `回访失败：${error.message}`, 'error'); }
  }

  async function contentAction(key, form, action) {
    const id = form.dataset.itemId || form.elements.content_id.value.trim();
    if (!id) return setEditorState(form, '请先填写内容标识', 'error');
    const type = key === 'pain-points' ? 'pain_point' : key === 'articles' ? 'article' : key === 'training' ? 'task' : 'recipe';
    const body = action === 'schedule' ? { scheduled_at: form.elements.scheduled_at.value, comment: form.elements.comment?.value } : { comment: form.elements.comment?.value };
    setEditorState(form, '正在提交操作...', 'loading');
    try {
      await window.AdminPortal.request(`/content/${type}/${encodeURIComponent(id)}/${action}`, { method: 'POST', body: JSON.stringify(body) });
      setEditorState(form, action === 'restore' ? '已基于历史版本创建新草稿' : '内容状态已更新', 'success');
      markDirty(form, false);
      loadModule(key);
    } catch (error) {
      setEditorState(form, error.code === 'ADMIN_PERMISSION_DENIED' ? '权限不足，当前数据已保留' : `操作失败：${error.message}`, 'error');
    }
  }

  function previewEditor(form) {
    const preview = form.querySelector('.editor-preview-panel');
    preview.hidden = false;
    preview.innerHTML = `<strong>内容预览</strong><h5>${esc(form.elements.title.value)}</h5><p>${esc(form.elements.summary.value)}</p><div>${esc(form.elements.content.value).replace(/\n/g, '<br />')}</div>${form.elements.media_url.value ? `<img src="${esc(form.elements.media_url.value)}" alt="内容媒体预览" />` : ''}`;
  }

  function setEditorState(form, message, tone) {
    const node = form.querySelector('[data-editor-state]');
    node.className = `editor-state operation-status-${tone}`;
    node.textContent = message;
  }

  function renderModuleShell(module) {
    return `<article class="operation-module" data-operation-module="${module.key}"><div class="module-heading"><h4>${module.label}</h4><button type="button" class="ghost operation-refresh">刷新</button></div><div class="operation-module-body"><div class="operation-list" data-module-list="${module.key}"></div><div class="operation-editor-host" data-module-editor="${module.key}"></div></div><div class="operation-module-status" data-module-status="${module.key}"></div></article>`;
  }

  function init() {
    const host = document.getElementById('operationsModules');
    const nav = document.getElementById('operationsNav');
    if (!host || !nav) return;
    host.innerHTML = MODULES.map(renderModuleShell).join('');
    nav.innerHTML = MODULES.map((module) => `<a href="#operation-${module.key}" data-operation-nav="${module.key}">${module.label}</a>`).join('');
    MODULES.forEach((module) => {
      document.querySelector(`[data-operation-module="${module.key}"]`).id = `operation-${module.key}`;
      document.querySelector(`[data-operation-module="${module.key}"] .operation-refresh`).addEventListener('click', () => loadModule(module.key));
      loadModule(module.key);
    });
    editor('membership', 'default', '会员页面配置');
    window.addEventListener('beforeunload', (event) => {
      if (document.querySelector('[data-dirty="true]')) { event.preventDefault(); event.returnValue = ''; }
    });
  }

  window.AdminOperations = { init, MODULES };
}());
