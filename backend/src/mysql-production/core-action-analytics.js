const CORE_ACTION_SCENES = [
  { sceneKey: 'homework_restless', searchSceneKey: 'homework_focus', title: '写作业坐不住' },
  { sceneKey: 'picture_book_runs', searchSceneKey: 'picture_book_escape', title: '绘本读两页就跑' },
  { sceneKey: 'meal_dawdling', searchSceneKey: 'meal_picky', title: '吃饭拖拉' },
  { sceneKey: 'bedtime_meltdown', searchSceneKey: 'sleep_resist', title: '睡前崩溃' },
  { sceneKey: 'class_departure_dawdling', searchSceneKey: 'morning_rush', title: '出门上课磨蹭' },
  { sceneKey: 'weak_expression', searchSceneKey: 'weak_expression', title: '说话表达弱' }
];

const CORE_ACTION_AGE_SEGMENTS = [
  { key: 'age_2_3', label: '2-3岁' },
  { key: 'age_3_4', label: '3-4岁' },
  { key: 'age_4_5', label: '4-5岁' },
  { key: 'age_5_6', label: '5-6岁' },
  { key: 'age_6_8', label: '6-8岁' },
  { key: 'age_8_9', label: '8-9岁' },
  { key: 'age_9_12', label: '9-12岁' }
];

function calculateRatio(part, total) {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  if (!denominator) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function getCoreActionSceneProfile(sceneKey) {
  const key = String(sceneKey || '').trim();
  return CORE_ACTION_SCENES.find((scene) => scene.sceneKey === key || scene.searchSceneKey === key) || null;
}

function normalizeCoreActionSceneKey(sceneKey) {
  const profile = getCoreActionSceneProfile(sceneKey);
  return profile ? profile.sceneKey : String(sceneKey || '').trim();
}

function buildCoreActionSceneFunnel(rows) {
  const eventMap = (rows || []).reduce((map, row) => {
    const sceneKey = normalizeCoreActionSceneKey(row && row.scene_key);
    if (!sceneKey || sceneKey === 'unknown') {
      return map;
    }
    map[sceneKey] = map[sceneKey] || {};
    const eventType = String((row && row.event_type) || '').trim();
    map[sceneKey][eventType] = (map[sceneKey][eventType] || 0) + Number((row && row.event_count) || 0);
    return map;
  }, {});

  return CORE_ACTION_SCENES.map((scene) => {
    const counts = eventMap[scene.sceneKey] || {};
    const sceneSelect = Number(counts.scene_select || 0);
    const resultView = Number(counts.bottleneck_result_view || 0);
    const save = Number(counts.tonight_action_save || 0);
    const nextDay = Number(counts.next_day_record_view || 0);
    const effectSubmit = Number(counts.action_effect_submit || 0);
    return {
      scene_key: scene.sceneKey,
      scene_title: scene.title,
      scene_select: sceneSelect,
      result_view: resultView,
      result_rate: calculateRatio(resultView, sceneSelect),
      tonight_action_save: save,
      save_rate: calculateRatio(save, resultView),
      next_day_record_view: nextDay,
      next_day_record_rate: calculateRatio(nextDay, save),
      action_effect_submit: effectSubmit,
      effect_submit_rate: calculateRatio(effectSubmit, nextDay || save)
    };
  }).sort((a, b) => b.scene_select - a.scene_select || a.scene_title.localeCompare(b.scene_title, 'zh-Hans-CN'));
}

function buildCoreActionDimensionFunnel(rows, keyField, titleField, outputKey, outputTitle, options = {}) {
  const eventMap = (rows || []).reduce((map, row) => {
    const rawKey = String((row && row[keyField]) || '').trim();
    if (!rawKey || (rawKey === 'unknown' && !options.includeUnknown)) {
      return map;
    }
    const key = rawKey === 'unknown' ? 'unknown' : rawKey;
    const title = rawKey === 'unknown' && options.unknownTitle
      ? options.unknownTitle
      : String((row && row[titleField]) || key);
    map[key] = map[key] || { title, counts: {} };
    const eventType = String((row && row.event_type) || '').trim();
    map[key].counts[eventType] = (map[key].counts[eventType] || 0) + Number((row && row.event_count) || 0);
    return map;
  }, {});

  return Object.keys(eventMap).map((key) => {
    const counts = eventMap[key].counts || {};
    const select = Number(counts.age_segment_select || counts.pain_point_select || 0);
    const resultView = Number(counts.bottleneck_result_view || 0);
    const save = Number(counts.tonight_action_save || 0);
    const effectSubmit = Number(counts.action_effect_submit || 0);
    return {
      [outputKey]: key,
      [outputTitle]: eventMap[key].title || key,
      select,
      result_view: resultView,
      result_rate: calculateRatio(resultView, select),
      tonight_action_save: save,
      save_rate: calculateRatio(save, resultView),
      action_effect_submit: effectSubmit,
      effect_submit_rate: calculateRatio(effectSubmit, save)
    };
  }).sort((a, b) => b.select - a.select || String(a[outputTitle]).localeCompare(String(b[outputTitle]), 'zh-Hans-CN'));
}

function buildCoreActionAgeSegmentFunnel(rows) {
  const items = buildCoreActionDimensionFunnel(rows, 'age_segment_key', 'age_segment_label', 'age_segment_key', 'age_segment_label', {
    includeUnknown: true,
    unknownTitle: '未分龄'
  });
  const itemMap = items.reduce((map, item) => {
    map[item.age_segment_key] = item;
    return map;
  }, {});
  const knownItems = CORE_ACTION_AGE_SEGMENTS.map((segment) => Object.assign({
    age_segment_key: segment.key,
    age_segment_label: segment.label,
    select: 0,
    result_view: 0,
    result_rate: 0,
    tonight_action_save: 0,
    save_rate: 0,
    action_effect_submit: 0,
    effect_submit_rate: 0
  }, itemMap[segment.key] || {}));
  return itemMap.unknown ? knownItems.concat(itemMap.unknown) : knownItems;
}

function buildCoreActionPainPointFunnel(rows) {
  return buildCoreActionDimensionFunnel(rows, 'pain_point_key', 'pain_point_title', 'pain_point_key', 'pain_point_title');
}

function parseAbilityTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const text = String(value || '').trim();
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || '').trim()).filter(Boolean);
    }
  } catch (err) { /**/ }
  return text.split(/[、,，;；|]/).map((item) => item.trim()).filter(Boolean);
}

function buildCoreActionAbilityFunnel(rows) {
  const expandedRows = [];
  (rows || []).forEach((row) => {
    parseAbilityTags(row && row.ability_tags).forEach((tag) => {
      expandedRows.push(Object.assign({}, row, { ability_tag: tag }));
    });
  });
  return buildCoreActionDimensionFunnel(expandedRows, 'ability_tag', 'ability_tag', 'ability_tag', 'ability_label');
}

module.exports = {
  CORE_ACTION_SCENES,
  CORE_ACTION_AGE_SEGMENTS,
  buildCoreActionSceneFunnel,
  buildCoreActionAgeSegmentFunnel,
  buildCoreActionPainPointFunnel,
  buildCoreActionAbilityFunnel,
  calculateRatio,
  normalizeCoreActionSceneKey
};
