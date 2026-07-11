const CORE_ACTION_SCENES = [
  { sceneKey: 'homework_restless', searchSceneKey: 'homework_focus', title: '写作业坐不住' },
  { sceneKey: 'picture_book_runs', searchSceneKey: 'picture_book_escape', title: '绘本读两页就跑' },
  { sceneKey: 'meal_dawdling', searchSceneKey: 'meal_picky', title: '吃饭拖拉' },
  { sceneKey: 'bedtime_meltdown', searchSceneKey: 'sleep_resist', title: '睡前崩溃' },
  { sceneKey: 'class_departure_dawdling', searchSceneKey: 'morning_rush', title: '出门上课磨蹭' },
  { sceneKey: 'weak_expression', searchSceneKey: 'weak_expression', title: '说话表达弱' }
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

module.exports = {
  CORE_ACTION_SCENES,
  buildCoreActionSceneFunnel,
  calculateRatio,
  normalizeCoreActionSceneKey
};
