const PAIN_POINT_CATEGORIES = Object.freeze([
  '做事与学习',
  '情绪与配合',
  '说话与表达',
  '同伴与相处',
  '身体与适应'
]);

const PAIN_POINT_KEYS = Object.freeze([
  'called_no_response',
  'distracted_during_task',
  'cries_when_switching',
  'unclear_speech',
  'cannot_play_together'
]);

const ARTICLE_FIELDS = Object.freeze([
  'title', 'summary', 'content', 'category', 'sub_category', 'age_group',
  'tags', 'author', 'evidence_level', 'content_form', 'cover', 'cover_image'
]);

const TICKET_STATUSES = Object.freeze(['pending', 'processing', 'pending_callback', 'closed']);
const TICKET_PRIORITIES = Object.freeze(['low', 'normal', 'high', 'urgent']);

function isStablePainPointKey(value) {
  return PAIN_POINT_KEYS.includes(String(value || '').trim());
}

function publicArticle(article) {
  const source = article || {};
  return {
    id: source.id,
    title: source.title || '',
    summary: source.summary || '',
    content: source.content || '',
    category: source.category || '',
    sub_category: source.sub_category || '',
    age_group: source.age_group || '',
    tags: source.tags || '',
    author: source.author || '',
    evidence_level: source.evidence_level || '',
    content_form: source.content_form || '',
    cover: source.cover || source.cover_image || '',
    cover_image: source.cover_image || source.cover || '',
    is_published: Number(source.is_published) === 1,
    created_at: source.created_at,
    updated_at: source.updated_at
  };
}

module.exports = {
  PAIN_POINT_CATEGORIES,
  PAIN_POINT_KEYS,
  ARTICLE_FIELDS,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  isStablePainPointKey,
  publicArticle
};
