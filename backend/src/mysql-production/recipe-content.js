'use strict';

async function listRecipes(pool, legacyRecipes) {
  const [rows] = await pool.execute(
    "SELECT content_id, payload, publish_status, version FROM content_versions WHERE content_type = 'recipe' AND ((publish_status = 'published' AND review_status = 'approved' AND published_at <= NOW()) OR (publish_status = 'offline' AND published_at IS NOT NULL)) ORDER BY version DESC"
  );
  const latest = new Map();
  rows.forEach((row) => {
    if (!latest.has(String(row.content_id))) latest.set(String(row.content_id), row);
  });
  // Only existing JSON IDs can be edited; draft versions never shadow public state.
  return (legacyRecipes || []).reduce((items, recipe) => {
    const row = latest.get(String(recipe.id));
    if (row && row.publish_status === 'offline') return items;
    const payload = row ? (typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload) : {};
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Invalid published recipe payload');
    }
    const merged = Object.assign({}, recipe, payload, { id: recipe.id });
    if (['0-1岁', '6-12月', 'ling-yi-sui'].includes(String(merged.ageRange || merged.age_range || '').trim())) return items;
    items.push(JSON.parse(JSON.stringify(merged)));
    return items;
  }, []);
}

module.exports = { listRecipes };
