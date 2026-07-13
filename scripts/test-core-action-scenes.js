const assert = require('assert');
const coreActionScenes = require('../miniprogram/utils/core-action-scenes');
const ageCatalog = require('../miniprogram/utils/core-action-age-catalog');

const scenes = coreActionScenes.getCoreActionScenes();
const ageGroups = coreActionScenes.getCoreActionAgeGroups();
const expectedAgeFirstKeys = ['age_2_3', 'age_3_4', 'age_4_5', 'age_5_6', 'age_6_8', 'age_8_9', 'age_9_12'];
const expectedCategoryCount = 4;
const expectedPainPointsPerCategory = 10;
const expectedPainPointsPerSegment = expectedCategoryCount * expectedPainPointsPerCategory;
const expectedTotalAgeFirstPainPoints = expectedAgeFirstKeys.length * expectedPainPointsPerSegment;

function assertCompletePainPoint(painPoint, context) {
  assert.ok(painPoint.key, `${context} should expose key`);
  assert.ok(painPoint.title, `${context}/${painPoint.key} should expose title`);
  assert.ok(painPoint.description, `${context}/${painPoint.key} should expose description`);
  assert.ok(painPoint.sceneKey, `${context}/${painPoint.key} should expose scene key`);
  assert.ok(Array.isArray(painPoint.observableSigns) && painPoint.observableSigns.length >= 1, `${context}/${painPoint.key} should expose observable signs`);
  assert.ok(Array.isArray(painPoint.abilityTags) && painPoint.abilityTags.length >= 1, `${context}/${painPoint.key} should expose ability tags`);
  assert.ok(painPoint.categoryKey, `${context}/${painPoint.key} should expose category key`);
  assert.ok(painPoint.categoryLabel, `${context}/${painPoint.key} should expose category label`);
  assert.ok(painPoint.priority >= 1 && painPoint.priority <= expectedPainPointsPerCategory, `${context}/${painPoint.key} should expose category priority`);
  assert.ok(painPoint.sourceType, `${context}/${painPoint.key} should expose source type`);
  assert.ok(painPoint.defaultBottleneck && painPoint.defaultBottleneck.title && painPoint.defaultBottleneck.text, `${context}/${painPoint.key} should expose default bottleneck`);
  assert.ok(painPoint.defaultAction && painPoint.defaultAction.title, `${context}/${painPoint.key} should expose default action title`);
  assert.ok(Array.isArray(painPoint.defaultAction.steps) && painPoint.defaultAction.steps.length >= 1, `${context}/${painPoint.key} should expose default action steps`);
}

assert.strictEqual(scenes.length, 6, 'should define six core scenes');
assert.strictEqual(ageGroups.length, 4, 'should define four age groups');

scenes.forEach((scene) => {
  assert.ok(scene.key, 'scene should have key');
  assert.ok(scene.label, `${scene.key} should have label`);
  assert.ok(Array.isArray(scene.ageGroups) && scene.ageGroups.length === 4, `${scene.key} should expose age groups`);
  assert.ok(Array.isArray(scene.symptoms) && scene.symptoms.length >= 5, `${scene.key} should expose symptoms`);
  assert.ok(scene.defaultBottleneck && scene.defaultBottleneck.title, `${scene.key} should have default bottleneck`);
  assert.ok(scene.defaultAction && scene.defaultAction.steps && scene.defaultAction.steps.length > 0, `${scene.key} should have default action steps`);

  ageGroups.forEach((ageGroup) => {
    scene.symptoms.forEach((symptom) => {
      const result = coreActionScenes.buildFirstActionResult({
        sceneKey: scene.key,
        symptomKey: symptom.key,
        ageGroup: ageGroup.key,
        createdAt: 1780000000000
      });
      assert.strictEqual(result.sceneKey, scene.key, 'result should preserve scene');
      assert.strictEqual(result.ageGroup, ageGroup.label, 'result should normalize age label');
      assert.strictEqual(result.symptomKey, symptom.key, 'result should preserve symptom');
      assert.ok(result.bottleneckTitle, 'result should include bottleneck title');
      assert.ok(result.actionTitle, 'result should include action title');
      assert.ok(Array.isArray(result.actionSteps) && result.actionSteps.length >= 1, 'result should include executable steps');
      assert.ok(result.nextActions && Object.keys(result.nextActions).length >= 4, 'result should include next actions');
    });
  });
});

const missingAge = coreActionScenes.buildFirstActionResult({ sceneKey: scenes[0].key, symptomKey: scenes[0].symptoms[0].key });
assert.strictEqual(missingAge.ageGroup, '待确认年龄');
assert.strictEqual(missingAge.fallbackReason, 'missing_age_group');

const missingSymptom = coreActionScenes.buildFirstActionResult({ sceneKey: scenes[0].key, ageGroup: ageGroups[0].key });
assert.strictEqual(missingSymptom.symptomLabel, '先用默认判断');
assert.strictEqual(missingSymptom.fallbackReason, 'missing_symptom');
assert.ok(missingSymptom.actionSteps.length >= 1);

const unknownScene = coreActionScenes.buildFirstActionResult({ sceneKey: 'unknown_scene', ageGroup: ageGroups[1].key, symptomKey: 'unknown_symptom' });
assert.strictEqual(unknownScene.sceneKey, scenes[0].key);
assert.strictEqual(unknownScene.fallbackReason, 'unknown_scene');
assert.ok(unknownScene.bottleneckTitle);

const ageFirstResult = coreActionScenes.buildAgeFirstActionResult({
  ageSegmentKey: 'age_8_9',
  painPointKey: 'reading_slow_forgets',
  childId: 12,
  createdAt: 1780000000000
});
assert.strictEqual(ageFirstResult.childId, 12);
assert.strictEqual(ageFirstResult.ageGroup, '8-9岁');
assert.strictEqual(ageFirstResult.ageSegmentKey, 'age_8_9');
assert.strictEqual(ageFirstResult.ageSegmentLabel, '8-9岁');
assert.strictEqual(ageFirstResult.painPointKey, 'reading_slow_forgets');
assert.strictEqual(ageFirstResult.painPointTitle, '阅读慢又记不住');
assert.strictEqual(ageFirstResult.categoryKey, 'attention_learning');
assert.strictEqual(ageFirstResult.categoryLabel, '专注学习');
assert.strictEqual(ageFirstResult.sceneLabel, ageFirstResult.painPointTitle);
assert.ok(ageFirstResult.sceneKey, 'age-first result should keep scene key compatibility');
assert.ok(Array.isArray(ageFirstResult.focusAreas) && ageFirstResult.focusAreas.length >= 1, 'age-first result should include focus areas');
assert.ok(Array.isArray(ageFirstResult.observableSigns) && ageFirstResult.observableSigns.length >= 1, 'age-first result should include observable signs');
assert.ok(Array.isArray(ageFirstResult.abilityTags) && ageFirstResult.abilityTags.indexOf('阅读效率') !== -1, 'age-first result should include ability tags');
assert.ok(ageFirstResult.bottleneckTitle, 'age-first result should include bottleneck title');
assert.ok(ageFirstResult.bottleneckText, 'age-first result should include bottleneck text');
assert.ok(ageFirstResult.actionTitle, 'age-first result should include action title');
assert.ok(Array.isArray(ageFirstResult.actionSteps) && ageFirstResult.actionSteps.length >= 1, 'age-first result should include action steps');
assert.strictEqual(ageFirstResult.sourceType, 'age_first_scene_recommendation');

const ageFirstFallback = coreActionScenes.buildAgeFirstActionResult({ ageSegmentKey: 'age_8_9' });
assert.strictEqual(ageFirstFallback.fallbackReason, 'missing_pain_point');
assert.strictEqual(ageFirstFallback.ageSegmentKey, 'age_8_9');
assert.ok(ageFirstFallback.painPointKey, 'age-first fallback should choose a usable pain point');
assert.ok(ageFirstFallback.categoryKey, 'age-first fallback should include category key');
assert.ok(ageFirstFallback.categoryLabel, 'age-first fallback should include category label');

const unknownAgeFirst = coreActionScenes.buildAgeFirstActionResult({ ageSegmentKey: 'unknown_age', painPointKey: 'unknown_pain' });
assert.strictEqual(unknownAgeFirst.fallbackReason, 'unknown_age_segment');
assert.ok(unknownAgeFirst.ageSegmentKey, 'unknown age segment should fall back to a usable segment');
assert.ok(unknownAgeFirst.painPointKey, 'unknown age segment should fall back to a usable pain point');
assert.ok(unknownAgeFirst.actionSteps.length >= 1, 'unknown age segment should still produce action steps');

const ageFirstSegments = coreActionScenes.getAgeFirstSegments();
assert.deepStrictEqual(ageFirstSegments.map((segment) => segment.key), expectedAgeFirstKeys, 'age-first segments should cover the required seven age ranges in order');
const lowAgeSegmentKeys = ['age_2_3', 'age_3_4', 'age_4_5', 'age_5_6'];
const highAgeBlockedWords = ['中考', '体训', '专项强化', '专项体能'];
const ageTwoThreeBlockedWords = ['中考', '体训', '作业压力', '专项强化', '专项体能', '考试', '刷题'];
const ageThreeFourBlockedWords = ['中考', '体训', '作业压力', '专项强化', '专项体能', '考试', '刷题', '错题', '幼小衔接'];
const highAgeCoverageWords = ['学习能力底层支持', '体测准备', '中考体训准备', '专项体能'];
const ageTwoThreeAttentionKeys = [
  'age_2_3_attention_start_delay',
  'age_2_3_attention_shift_fast',
  'age_2_3_one_step_instruction_hard',
  'age_2_3_short_task_half_done',
  'age_2_3_picture_book_attention_short',
  'age_2_3_attention_transition_hard',
  'age_2_3_attention_imitation_task_hard',
  'age_2_3_attention_sorting_resist',
  'age_2_3_attention_wait_for_help',
  'age_2_3_attention_finish_signal_weak'
];
const ageTwoThreeEmotionKeys = [
  'new_environment_cries',
  'separation_hard',
  'age_2_3_wait_tiny_turn_hard',
  'age_2_3_transition_crying',
  'age_2_3_toy_taken_meltdown',
  'age_2_3_no_boundary_hits',
  'age_2_3_new_rule_refuse',
  'age_2_3_parent_busy_clings',
  'age_2_3_calm_down_needs_body',
  'age_2_3_morning_evening_flow_messy'
];
const ageTwoThreeMotorKeys = [
  'gross_motor_unstable',
  'age_2_3_stairs_afraid',
  'age_2_3_balance_wobbly',
  'age_2_3_jump_lands_heavy',
  'age_2_3_run_stop_hard',
  'age_2_3_climb_avoid',
  'age_2_3_ball_kick_miss',
  'age_2_3_imitation_movement_hard',
  'age_2_3_fine_motor_tired',
  'age_2_3_body_awareness_bumps'
];
const ageTwoThreeSocialKeys = [
  'language_expression_less',
  'imitation_resistant',
  'age_2_3_points_instead_words',
  'age_2_3_cries_instead_request',
  'age_2_3_peer_join_watches',
  'age_2_3_refuse_without_words',
  'age_2_3_parent_child_play_short',
  'age_2_3_name_response_weak',
  'age_2_3_follow_adult_gaze_hard',
  'age_2_3_simple_choice_no_words'
];
const ageThreeFourAttentionKeys = [
  'cannot_sit_still',
  'simple_instruction_missed',
  'age_3_4_circle_time_wiggles',
  'age_3_4_activity_persistence_short',
  'age_3_4_rule_game_confused',
  'age_3_4_story_listening_drifts',
  'age_3_4_name_called_no_shift',
  'age_3_4_group_instruction_missed',
  'age_3_4_table_task_fidgets',
  'age_3_4_finish_last_step_hard'
];
const ageThreeFourEmotionKeys = [
  'class_queue_uncooperative',
  'emotion_escalates_fast',
  'age_3_4_wait_turn_cries',
  'age_3_4_activity_switch_meltdown',
  'age_3_4_toy_grab_rule_hard',
  'age_3_4_rule_no_accept',
  'age_3_4_losing_game_upset',
  'age_3_4_new_place_freezes',
  'age_3_4_reminded_feels_wronged',
  'age_3_4_morning_queue_flow_chaos'
];
const ageThreeFourMotorKeys = [
  'bumps_and_grabs',
  'age_3_4_balance_beam_wobbly',
  'age_3_4_two_foot_jump_heavy',
  'age_3_4_run_stop_crashes',
  'age_3_4_stairs_alternating_hard',
  'age_3_4_ball_catch_avoid',
  'age_3_4_climb_ladder_unsure',
  'age_3_4_core_sitting_slumps',
  'age_3_4_fine_motor_pinches_tired',
  'age_3_4_after_running_cannot_settle'
];
const ageThreeFourSocialKeys = [
  'age_3_4_need_words_missing',
  'age_3_4_story_sequence_messy',
  'age_3_4_peer_join_silent',
  'age_3_4_conflict_cries_instead_words',
  'age_3_4_group_answer_whispers',
  'age_3_4_adult_question_no_reply',
  'age_3_4_emotion_words_few',
  'age_3_4_cooperation_play_breaks',
  'age_3_4_family_chat_one_word',
  'age_3_4_new_person_hides'
];
const ageFourFiveAttentionKeys = [
  'short_attention_play',
  'rule_game_breakdown',
  'age_4_5_picture_book_drifts',
  'age_4_5_drawing_task_half_done',
  'age_4_5_multi_step_craft_confused',
  'age_4_5_table_materials_distract',
  'age_4_5_start_after_prompt_slow',
  'age_4_5_cleanup_last_step_missed',
  'age_4_5_instruction_two_steps_forget',
  'age_4_5_rule_listening_needs_demo'
];
const ageFourFiveEmotionKeys = [
  'losing_triggers_tantrum',
  'age_4_5_rule_change_argues',
  'age_4_5_reminder_tears',
  'age_4_5_activity_switch_bargains',
  'age_4_5_waiting_line_impulsive',
  'age_4_5_mistake_says_cannot',
  'age_4_5_boundary_testing_repeats',
  'age_4_5_new_class_resists',
  'age_4_5_morning_flow_battles',
  'age_4_5_calm_down_needs_long'
];
const ageFourFiveMotorKeys = [
  'coordination_clumsy',
  'age_4_5_ball_catch_misses',
  'age_4_5_obstacle_step_over_wobbly',
  'age_4_5_core_balance_slumps',
  'age_4_5_rhythm_actions_offbeat',
  'age_4_5_run_jump_tires_fast',
  'age_4_5_fine_motor_cut_paste_tired',
  'age_4_5_balance_one_foot_hard',
  'age_4_5_body_boundary_bumps',
  'age_4_5_movement_sequence_forgets'
];
const ageFourFiveSocialKeys = [
  'expression_unclear',
  'age_4_5_conflict_reason_unclear',
  'age_4_5_cooperation_game_dominates',
  'age_4_5_group_speech_freezes',
  'age_4_5_emotion_feeling_words_missing',
  'age_4_5_reject_words_too_hard',
  'age_4_5_peer_join_phrase_missing',
  'age_4_5_story_retell_jumps',
  'age_4_5_adult_request_unclear',
  'age_4_5_family_short_dialogue'
];
const ageFiveSixAttentionKeys = [
  'small_task_persistence_low',
  'school_transition_anxiety',
  'age_5_6_classroom_sitting_preparedness',
  'age_5_6_pre_writing_grip_tired',
  'age_5_6_homework_awareness_weak',
  'age_5_6_task_order_confused',
  'age_5_6_reading_readiness_short',
  'age_5_6_finish_without_checking',
  'age_5_6_instruction_three_steps_hard',
  'age_5_6_learning_block_resists'
];
const ageFiveSixEmotionKeys = [
  'cannot_wait_turn',
  'age_5_6_rule_game_loses_meltdown',
  'age_5_6_school_worry_morning',
  'age_5_6_daily_flow_negotiates',
  'age_5_6_short_task_quits_when_hard',
  'age_5_6_reminded_argues_back',
  'age_5_6_transition_from_play_to_practice',
  'age_5_6_new_rule_group_game_resists',
  'age_5_6_waiting_for_help_anxious',
  'age_5_6_calm_after_conflict_slow'
];
const ageFiveSixMotorKeys = [
  'age_5_6_rope_jump_ready_hard',
  'age_5_6_ball_dribble_unsteady',
  'age_5_6_core_posture_slumps',
  'age_5_6_run_jump_endurance_low',
  'age_5_6_fine_motor_writing_tired',
  'age_5_6_balance_hop_grid_hard',
  'age_5_6_cross_body_actions_confused',
  'age_5_6_obstacle_course_sequence_hard',
  'age_5_6_movement_confidence_low',
  'age_5_6_after_activity_overexcited'
];
const ageFiveSixSocialKeys = [
  'peer_conflicts_often',
  'group_activity_withdrawn',
  'age_5_6_turn_talk_conflict_hard',
  'age_5_6_cooperation_role_confused',
  'age_5_6_reject_peer_request_hard',
  'age_5_6_ask_teacher_help_stuck',
  'age_5_6_group_share_voice_low',
  'age_5_6_conflict_story_missing_steps',
  'age_5_6_family_review_short',
  'age_5_6_need_request_too_vague'
];
const ageSixEightAttentionKeys = [
  'homework_start_hard',
  'reading_cannot_sit',
  'class_attention_scattered',
  'age_6_8_first_problem_stuck',
  'age_6_8_homework_breaks_many',
  'age_6_8_reading_line_loses_place',
  'age_6_8_class_note_misses_key',
  'age_6_8_finish_no_check',
  'age_6_8_multi_step_homework_order_messy',
  'age_6_8_careless_mistakes_repeat'
];
const ageSixEightEmotionKeys = [
  'confidence_low_when_hard',
  'age_6_8_homework_refusal_evening',
  'age_6_8_reminded_breaks_down',
  'age_6_8_hard_problem_withdraws',
  'age_6_8_evening_flow_drags',
  'age_6_8_learning_interruption_recover_slow',
  'age_6_8_mistake_shame_angry',
  'age_6_8_rule_change_in_homework_upset',
  'age_6_8_transition_screen_to_homework_hard',
  'age_6_8_parent_sits_near_tension'
];
const ageSixEightMotorKeys = [
  'rope_skipping_hard',
  'age_6_8_running_tires_quickly',
  'age_6_8_core_plank_weak',
  'age_6_8_ball_games_uncoordinated',
  'age_6_8_exercise_habit_start_hard',
  'age_6_8_jump_rope_rhythm_breaks',
  'age_6_8_agility_direction_slow',
  'age_6_8_fine_motor_writing_fatigue',
  'age_6_8_posture_slouch_homework',
  'age_6_8_recovery_after_pe_slow'
];
const ageSixEightSocialKeys = [
  'age_6_8_peer_conflict_cannot_explain',
  'age_6_8_group_join_hesitates',
  'age_6_8_class_speaking_voice_small',
  'age_6_8_teamwork_role_unclear',
  'age_6_8_friendship_rejection_sensitive',
  'age_6_8_share_turns_conflict',
  'age_6_8_need_help_cannot_ask',
  'age_6_8_tell_school_day_scattered',
  'age_6_8_joke_teasing_boundary_unclear',
  'age_6_8_apology_repair_hard'
];
const ageEightNineAttentionKeys = [
  'reading_slow_forgets',
  'study_patience_low',
  'homework_planning_weak',
  'age_8_9_key_point_weak',
  'age_8_9_wrong_question_review_missing',
  'age_8_9_multi_subject_switch_messy',
  'age_8_9_long_text_summary_hard',
  'age_8_9_independent_start_needs_prompt',
  'age_8_9_time_estimation_weak',
  'age_8_9_homework_quality_unstable'
];
const ageEightNineEmotionKeys = [
  'age_8_9_study_frustration_fast',
  'age_8_9_deadline_last_minute_panic',
  'age_8_9_failure_withdraws_quickly',
  'age_8_9_plan_change_upset',
  'age_8_9_parent_study_talk_conflict',
  'age_8_9_perfectionism_erases_many_times',
  'age_8_9_compares_with_classmates',
  'age_8_9_break_time_return_conflict',
  'age_8_9_morning_school_rush_irritable',
  'age_8_9_self_blame_after_mistake'
];
const ageEightNineMotorKeys = [
  'fitness_test_getting_hard',
  'exercise_habit_unstable',
  'age_8_9_rope_jump_stability_weak',
  'age_8_9_running_pace_unsteady',
  'age_8_9_core_situp_weak',
  'age_8_9_ball_coordination_lags',
  'age_8_9_posture_endurance_low',
  'age_8_9_agility_ladder_confused',
  'age_8_9_flexibility_stiff',
  'age_8_9_training_recovery_missing'
];
const ageEightNineSocialKeys = [
  'age_8_9_learning_help_request_vague',
  'age_8_9_peer_project_role_conflict',
  'age_8_9_opinion_expression_short',
  'age_8_9_conflict_review_blames_only',
  'age_8_9_family_study_update_resists',
  'age_8_9_teacher_feedback_cannot_relay',
  'age_8_9_group_discussion_quiet',
  'age_8_9_refuse_request_too_hard',
  'age_8_9_emotion_need_words_missing',
  'age_8_9_after_activity_review_thin'
];
const ageNineTwelveAttentionKeys = [
  'long_study_stamina_low',
  'age_9_12_efficiency_drops_later',
  'age_9_12_wrong_book_not_used',
  'age_9_12_plan_execution_breaks',
  'age_9_12_review_rhythm_messy',
  'age_9_12_notes_no_structure',
  'age_9_12_homework_priority_unclear',
  'age_9_12_self_check_skips_steps',
  'age_9_12_distraction_phone_or_chat',
  'age_9_12_test_review_no_strategy'
];
const ageNineTwelveEmotionKeys = [
  'age_9_12_study_pressure_tense',
  'age_9_12_criticism_sensitive',
  'age_9_12_self_expectation_too_high',
  'age_9_12_plan_interrupted_upset',
  'age_9_12_parent_child_study_conflict',
  'age_9_12_exam_before_sleep_hard',
  'age_9_12_result_fluctuation_mood_swings',
  'age_9_12_task_too_many_overwhelmed',
  'age_9_12_peer_compare_pressure',
  'age_9_12_recovery_after_bad_day_slow'
];
const ageNineTwelveMotorKeys = [
  'middle_exam_training_prepare',
  'running_endurance_weak',
  'jump_power_weak',
  'posture_core_weak',
  'age_9_12_special_training_rhythm_missing',
  'age_9_12_rope_speed_plateau',
  'age_9_12_running_breathing_messy',
  'age_9_12_posture_round_shoulders',
  'age_9_12_leg_power_low',
  'age_9_12_training_recovery_soreness'
];
const ageNineTwelveSocialKeys = [
  'age_9_12_peer_relationship_tension',
  'age_9_12_opinion_with_evidence_hard',
  'age_9_12_seek_help_late',
  'age_9_12_parent_negotiation_hard',
  'age_9_12_study_pressure_words_missing',
  'age_9_12_group_work_leadership_conflict',
  'age_9_12_boundary_with_friends_unclear',
  'age_9_12_feedback_to_teacher_hard',
  'age_9_12_after_conflict_repair_plan_missing',
  'age_9_12_self_advocacy_weak'
];
const sampleCategory = ageCatalog.AGE_FIRST_CATEGORY_DEFINITIONS[0];
assert.strictEqual(ageCatalog.AGE_FIRST_CATEGORY_DEFINITIONS.length, expectedCategoryCount, 'age-first catalog should define four fixed categories');
ageCatalog.AGE_FIRST_CATEGORY_DEFINITIONS.forEach((category) => {
  assert.strictEqual(category.templates.length, expectedPainPointsPerCategory, `${category.key} should define ten pain point templates`);
});
const normalizedPoint = ageCatalog.normalizeAgePainPoint(
  { key: 'age_test', label: '测试年龄' },
  sampleCategory,
  { key: 'sample_point', title: '测试场景', description: '测试描述' },
  0
);
assert.strictEqual(normalizedPoint.categoryKey, sampleCategory.key, 'normalize should fill category key');
assert.strictEqual(normalizedPoint.categoryLabel, sampleCategory.label, 'normalize should fill category label');
assert.strictEqual(normalizedPoint.priority, 1, 'normalize should fill priority');
assert.strictEqual(normalizedPoint.sourceType, 'curated', 'normalize should fill default source type');
assert.ok(normalizedPoint.sceneKey, 'normalize should fill scene key');
assert.ok(normalizedPoint.defaultBottleneck.title, 'normalize should fill default bottleneck');
assert.ok(Array.isArray(normalizedPoint.defaultAction.steps) && normalizedPoint.defaultAction.steps.length >= 1, 'normalize should fill default action steps');

const normalizedCategory = ageCatalog.normalizeAgePainCategory(
  { key: 'age_test', label: '测试年龄' },
  sampleCategory,
  sampleCategory.templates.map((template) => ({
    key: template.key,
    title: template.title,
    description: template.desc,
    observableSigns: template.signs,
    abilityTags: template.tags
  }))
);
assert.strictEqual(normalizedCategory.painPoints.length, 10, 'normalize category should preserve ten pain points');
assert.throws(() => ageCatalog.normalizeAgePainCategory(
  { key: 'age_test', label: '测试年龄' },
  sampleCategory,
  normalizedCategory.painPoints.slice(0, 9)
), /exactly 10 pain points/, 'normalize category should reject non-ten pain point lists');
let totalAgeFirstPainPoints = 0;
let totalAgeFirstResultContexts = 0;
ageFirstSegments.forEach((segment) => {
  assert.ok(segment.label, `${segment.key} should expose label`);
  assert.ok(segment.title, `${segment.key} should expose title`);
  assert.ok(segment.subtitle, `${segment.key} should expose subtitle`);
  assert.ok(Array.isArray(segment.focusAreas) && segment.focusAreas.length >= 1, `${segment.key} should expose focus areas`);
  assert.ok(segment.parentSummary, `${segment.key} should expose parent summary`);
  assert.ok(Array.isArray(segment.painCategories) && segment.painCategories.length === expectedCategoryCount, `${segment.key} should expose four pain categories`);
  segment.painCategories.forEach((category) => {
    assert.ok(category.key, `${segment.key} category should expose key`);
    assert.ok(category.label, `${segment.key}/${category.key} should expose label`);
    assert.ok(category.description, `${segment.key}/${category.key} should expose description`);
    assert.ok(Array.isArray(category.painPoints) && category.painPoints.length === expectedPainPointsPerCategory, `${segment.key}/${category.key} should expose ten pain points`);
    category.painPoints.forEach((painPoint) => {
      assert.strictEqual(painPoint.categoryKey, category.key, `${segment.key}/${painPoint.key} should preserve category key`);
      assert.strictEqual(painPoint.categoryLabel, category.label, `${segment.key}/${painPoint.key} should preserve category label`);
      assertCompletePainPoint(painPoint, `${segment.key}/${category.key}`);
    });
  });
  assert.ok(Array.isArray(segment.painPoints) && segment.painPoints.length === expectedPainPointsPerSegment, `${segment.key} should expose forty pain points`);
  totalAgeFirstPainPoints += segment.painPoints.length;
  assert.ok(Array.isArray(segment.featuredPainPointKeys) && segment.featuredPainPointKeys.length === 5, `${segment.key} should expose five featured pain point keys`);
  segment.featuredPainPointKeys.forEach((painPointKey) => {
    const featuredPoint = segment.painPoints.find((item) => item.key === painPointKey);
    assert.ok(featuredPoint, `${segment.key}/${painPointKey} featured pain point should exist in full catalog`);
    const featuredResult = coreActionScenes.buildAgeFirstActionResult({
      ageSegmentKey: segment.key,
      painPointKey,
      createdAt: 1780000000000
    });
    assert.strictEqual(featuredResult.fallbackReason, '', `${segment.key}/${painPointKey} featured result should not fall back`);
    assert.strictEqual(featuredResult.painPointKey, painPointKey, `${segment.key}/${painPointKey} featured result should preserve pain point key`);
    assert.strictEqual(featuredResult.painPointTitle, featuredPoint.title, `${segment.key}/${painPointKey} featured result should preserve title`);
  });
  segment.painPoints.forEach((painPoint) => {
    assertCompletePainPoint(painPoint, segment.key);
    const result = coreActionScenes.buildAgeFirstActionResult({
      ageSegmentKey: segment.key,
      painPointKey: painPoint.key,
      createdAt: 1780000000000
    });
    assert.strictEqual(result.ageSegmentKey, segment.key, `${segment.key}/${painPoint.key} should preserve age segment key`);
    assert.strictEqual(result.ageSegmentLabel, segment.label, `${segment.key}/${painPoint.key} should preserve age segment label`);
    assert.strictEqual(result.ageGroup, segment.label, `${segment.key}/${painPoint.key} should expose age group label`);
    assert.strictEqual(result.categoryKey, painPoint.categoryKey, `${segment.key}/${painPoint.key} should preserve category key`);
    assert.strictEqual(result.categoryLabel, painPoint.categoryLabel, `${segment.key}/${painPoint.key} should preserve category label`);
    assert.strictEqual(result.painPointKey, painPoint.key, `${segment.key}/${painPoint.key} should preserve pain point key`);
    assert.strictEqual(result.painPointTitle, painPoint.title, `${segment.key}/${painPoint.key} should preserve pain point title`);
    assert.strictEqual(result.sceneLabel, painPoint.title, `${segment.key}/${painPoint.key} should map scene label to pain point title`);
    assert.ok(Array.isArray(result.focusAreas) && result.focusAreas.length >= 1, `${segment.key}/${painPoint.key} should include focus areas`);
    assert.ok(Array.isArray(result.observableSigns) && result.observableSigns.length >= 1, `${segment.key}/${painPoint.key} should include observable signs`);
    assert.ok(Array.isArray(result.abilityTags) && result.abilityTags.length >= 1, `${segment.key}/${painPoint.key} should include ability tags`);
    painPoint.abilityTags.forEach((abilityTag) => {
      assert.ok(result.abilityTags.indexOf(abilityTag) !== -1, `${segment.key}/${painPoint.key} should keep ability tag ${abilityTag}`);
    });
    assert.ok(result.bottleneckTitle, `${segment.key}/${painPoint.key} should include bottleneck title`);
    assert.ok(result.bottleneckText, `${segment.key}/${painPoint.key} should include bottleneck text`);
    assert.ok(result.actionTitle, `${segment.key}/${painPoint.key} should include action title`);
    assert.ok(Array.isArray(result.actionSteps) && result.actionSteps.length >= 1, `${segment.key}/${painPoint.key} should include action steps`);
    assert.strictEqual(result.sourceType, 'age_first_scene_recommendation', `${segment.key}/${painPoint.key} should expose age-first source type`);
    totalAgeFirstResultContexts += 1;
  });
});
assert.strictEqual(totalAgeFirstPainPoints, expectedTotalAgeFirstPainPoints, 'age-first catalog should expose 280 pain points in total');
assert.strictEqual(totalAgeFirstResultContexts, expectedTotalAgeFirstPainPoints, 'age-first results should cover all 280 pain point contexts');
const ageTwoThreeSegment = ageFirstSegments.find((item) => item.key === 'age_2_3');
const ageTwoThreeAttentionCategory = ageTwoThreeSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageTwoThreeAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageTwoThreeAttentionKeys,
  'age_2_3 attention learning category should use curated low-age scenes'
);
['学习启动', '注意转移', '简单指令', '短任务完成', '绘本注意'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageTwoThreeAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_2_3 attention learning should cover ${keyword}`);
});
const ageTwoThreeEmotionCategory = ageTwoThreeSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageTwoThreeEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageTwoThreeEmotionKeys,
  'age_2_3 emotion rules category should use curated low-age scenes'
);
['分离适应', '等待', '流程切换', '情绪恢复', '新环境'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageTwoThreeEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_2_3 emotion rules should cover ${keyword}`);
});
const ageTwoThreeMotorCategory = ageTwoThreeSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageTwoThreeMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageTwoThreeMotorKeys,
  'age_2_3 motor fitness category should use curated low-age scenes'
);
['走跑跳', '上下台阶', '平衡', '模仿动作', '精细动作'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageTwoThreeMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_2_3 motor fitness should cover ${keyword}`);
});
const ageTwoThreeSocialCategory = ageTwoThreeSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageTwoThreeSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageTwoThreeSocialKeys,
  'age_2_3 social expression category should use curated low-age scenes'
);
['开口', '手指', '哭', '模仿', '亲子互动'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageTwoThreeSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_2_3 social expression should cover ${keyword}`);
});
assert.strictEqual(ageTwoThreeSegment.painCategories.length, expectedCategoryCount, 'age_2_3 should keep four pain categories');
ageTwoThreeSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_2_3/${category.key} should keep ten low-age pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_2_3/${painPoint.key} should use curated low-age content`);
  });
});
const ageTwoThreeText = JSON.stringify(ageTwoThreeSegment);
ageTwoThreeBlockedWords.forEach((word) => {
  assert.strictEqual(ageTwoThreeText.indexOf(word), -1, `age_2_3 should not include high-age expression ${word}`);
});
const ageThreeFourSegment = ageFirstSegments.find((item) => item.key === 'age_3_4');
['入园适应', '感统基础', '规则萌芽'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageThreeFourSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_3_4 should focus on ${keyword}`);
});
ageThreeFourSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_3_4/${category.key} should keep ten preschool pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_3_4/${painPoint.key} should use curated preschool content`);
  });
});
const ageThreeFourAttentionCategory = ageThreeFourSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageThreeFourAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageThreeFourAttentionKeys,
  'age_3_4 attention learning category should use curated preschool scenes'
);
['入园适应', '坐圈圈', '短活动', '规则理解', '听觉注意'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageThreeFourAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_3_4 attention learning should cover ${keyword}`);
});
const ageThreeFourEmotionCategory = ageThreeFourSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageThreeFourEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageThreeFourEmotionKeys,
  'age_3_4 emotion rules category should use curated preschool scenes'
);
['等待轮流', '转换活动', '抢', '入园适应', '生活流程'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageThreeFourEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_3_4 emotion rules should cover ${keyword}`);
});
const ageThreeFourMotorCategory = ageThreeFourSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageThreeFourMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageThreeFourMotorKeys,
  'age_3_4 motor fitness category should use curated preschool scenes'
);
['平衡能力', '跳跃力量', '跑停控制', '上下台阶', '精细动作'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageThreeFourMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_3_4 motor fitness should cover ${keyword}`);
});
const ageThreeFourSocialCategory = ageThreeFourSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageThreeFourSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageThreeFourSocialKeys,
  'age_3_4 social expression category should use curated preschool scenes'
);
['需求表达', '同伴加入', '冲突表达', '集体表达', '亲子沟通'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageThreeFourSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_3_4 social expression should cover ${keyword}`);
});
const ageThreeFourText = JSON.stringify(ageThreeFourSegment);
ageThreeFourBlockedWords.forEach((word) => {
  assert.strictEqual(ageThreeFourText.indexOf(word), -1, `age_3_4 should not include high-age expression ${word}`);
});
const ageFourFiveSegment = ageFirstSegments.find((item) => item.key === 'age_4_5');
assert.strictEqual(ageFourFiveSegment.painCategories.length, expectedCategoryCount, 'age_4_5 should keep four pain categories');
ageFourFiveSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_4_5/${category.key} should keep ten preschool pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_4_5/${painPoint.key} should use curated preschool content`);
    assertCompletePainPoint(painPoint, `age_4_5/${category.key}`);
  });
});
assert.strictEqual(ageFourFiveSegment.painPoints.length, expectedPainPointsPerSegment, 'age_4_5 should expose forty curated pain points');
['专注力', '身体控制', '表达配合', '情绪调节'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageFourFiveSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_4_5 should cover ${keyword}`);
});
const ageFourFiveAttentionCategory = ageFourFiveSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageFourFiveAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageFourFiveAttentionKeys,
  'age_4_5 attention learning category should use curated preschool scenes'
);
['绘本阅读', '规则游戏', '画画', '短任务收尾', '动作计划'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFourFiveAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_4_5 attention learning should cover ${keyword}`);
});
const ageFourFiveEmotionCategory = ageFourFiveSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageFourFiveEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageFourFiveEmotionKeys,
  'age_4_5 emotion rules category should use curated preschool scenes'
);
['输', '规则变化', '被提醒委屈', '活动切换', '等待轮流'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFourFiveEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_4_5 emotion rules should cover ${keyword}`);
});
const ageFourFiveMotorCategory = ageFourFiveSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageFourFiveMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageFourFiveMotorKeys,
  'age_4_5 motor fitness category should use curated preschool scenes'
);
['接球', '跨越障碍', '核心稳定', '节奏动作', '精细动作耐受'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFourFiveMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_4_5 motor fitness should cover ${keyword}`);
});
const ageFourFiveSocialCategory = ageFourFiveSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageFourFiveSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageFourFiveSocialKeys,
  'age_4_5 social expression category should use curated preschool scenes'
);
['冲突表达', '合作游戏', '集体发言', '感受表达', '短对话'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFourFiveSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_4_5 social expression should cover ${keyword}`);
});
const ageFiveSixSegment = ageFirstSegments.find((item) => item.key === 'age_5_6');
assert.strictEqual(ageFiveSixSegment.painCategories.length, expectedCategoryCount, 'age_5_6 should keep four pain categories');
ageFiveSixSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_5_6/${category.key} should keep ten school-readiness pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_5_6/${painPoint.key} should use curated school-readiness content`);
    assertCompletePainPoint(painPoint, `age_5_6/${category.key}`);
  });
});
assert.strictEqual(ageFiveSixSegment.painPoints.length, expectedPainPointsPerSegment, 'age_5_6 should expose forty curated pain points');
['社交能力', '任务意识', '等待轮流', '幼小衔接'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageFiveSixSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_5_6 should cover ${keyword}`);
});
ageFiveSixSegment.featuredPainPointKeys.forEach((painPointKey) => {
  const featuredPoint = ageFiveSixSegment.painPoints.find((item) => item.key === painPointKey);
  assert.ok(featuredPoint && featuredPoint.sourceType === 'curated', `age_5_6/${painPointKey} featured point should use curated content`);
});
const ageFiveSixAttentionCategory = ageFiveSixSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageFiveSixAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageFiveSixAttentionKeys,
  'age_5_6 attention learning category should use curated school-readiness scenes'
);
['幼小衔接', '小任务', '课堂准备', '前书写', '作业意识'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFiveSixAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_5_6 attention learning should cover ${keyword}`);
});
const ageFiveSixEmotionCategory = ageFiveSixSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageFiveSixEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageFiveSixEmotionKeys,
  'age_5_6 emotion rules category should use curated school-readiness scenes'
);
['规则游戏', '轮流等待', '输赢恢复', '上学焦虑', '流程管理'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFiveSixEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_5_6 emotion rules should cover ${keyword}`);
});
const ageFiveSixMotorCategory = ageFiveSixSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageFiveSixMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageFiveSixMotorKeys,
  'age_5_6 motor fitness category should use curated school-readiness scenes'
);
['跳绳预备', '球类协调', '核心稳定', '跑跳耐力', '精细动作耐受'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFiveSixMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_5_6 motor fitness should cover ${keyword}`);
});
const ageFiveSixSocialCategory = ageFiveSixSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageFiveSixSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageFiveSixSocialKeys,
  'age_5_6 social expression category should use curated school-readiness scenes'
);
['同伴冲突', '合作分工', '表达拒绝', '向老师求助', '家庭复盘'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageFiveSixSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_5_6 social expression should cover ${keyword}`);
});
const ageSixEightSegment = ageFirstSegments.find((item) => item.key === 'age_6_8');
assert.strictEqual(ageSixEightSegment.painCategories.length, expectedCategoryCount, 'age_6_8 should keep four pain categories');
ageSixEightSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_6_8/${category.key} should keep ten primary-school pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_6_8/${painPoint.key} should use curated primary-school content`);
    assertCompletePainPoint(painPoint, `age_6_8/${category.key}`);
  });
});
assert.strictEqual(ageSixEightSegment.painPoints.length, expectedPainPointsPerSegment, 'age_6_8 should expose forty curated pain points');
['基础学习状态', '阅读坐得住', '协调体能', '课堂专注'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageSixEightSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_6_8 should cover ${keyword}`);
});
ageSixEightSegment.featuredPainPointKeys.forEach((painPointKey) => {
  const featuredPoint = ageSixEightSegment.painPoints.find((item) => item.key === painPointKey);
  assert.ok(featuredPoint && featuredPoint.sourceType === 'curated', `age_6_8/${painPointKey} featured point should use curated content`);
  const featuredResult = coreActionScenes.buildAgeFirstActionResult({
    ageSegmentKey: 'age_6_8',
    painPointKey,
    createdAt: 1780000000000
  });
  assert.strictEqual(featuredResult.fallbackReason, '', `age_6_8/${painPointKey} featured result should not fall back`);
  assert.strictEqual(featuredResult.ageGroup, '6-8岁', `age_6_8/${painPointKey} featured result should expose age group`);
  assert.strictEqual(featuredResult.painPointKey, painPointKey, `age_6_8/${painPointKey} featured result should preserve pain point key`);
  assert.ok(Array.isArray(featuredResult.actionSteps) && featuredResult.actionSteps.length >= 1, `age_6_8/${painPointKey} featured result should expose action steps`);
});
const ageSixEightAttentionCategory = ageSixEightSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageSixEightAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageSixEightAttentionKeys,
  'age_6_8 attention learning category should use curated primary-school scenes'
);
['写作业启动', '课堂走神', '阅读坐不住', '第一题启动', '检查习惯'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageSixEightAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_6_8 attention learning should cover ${keyword}`);
});
const ageSixEightEmotionCategory = ageSixEightSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageSixEightEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageSixEightEmotionKeys,
  'age_6_8 emotion rules category should use curated primary-school scenes'
);
['作业抗拒', '被提醒崩溃', '难题退缩', '流程拖延', '学习中断恢复'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageSixEightEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_6_8 emotion rules should cover ${keyword}`);
});
const ageSixEightMotorCategory = ageSixEightSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageSixEightMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageSixEightMotorKeys,
  'age_6_8 motor fitness category should use curated primary-school scenes'
);
['跳绳', '跑步耐力', '核心稳定', '球类协调', '运动习惯起步'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageSixEightMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_6_8 motor fitness should cover ${keyword}`);
});
const ageSixEightSocialCategory = ageSixEightSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageSixEightSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageSixEightSocialKeys,
  'age_6_8 social expression category should use curated primary-school scenes'
);
['冲突表达', '同伴加入', '课堂表达', '小组合作', '求助表达'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageSixEightSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_6_8 social expression should cover ${keyword}`);
});
const ageEightNineSegment = ageFirstSegments.find((item) => item.key === 'age_8_9');
assert.strictEqual(ageEightNineSegment.painCategories.length, expectedCategoryCount, 'age_8_9 should keep four pain categories');
ageEightNineSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_8_9/${category.key} should keep ten upper-primary pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_8_9/${painPoint.key} should use curated upper-primary content`);
    assertCompletePainPoint(painPoint, `age_8_9/${category.key}`);
  });
});
assert.strictEqual(ageEightNineSegment.painPoints.length, expectedPainPointsPerSegment, 'age_8_9 should expose forty curated pain points');
['学习能力底层支持', '执行力', '阅读效率', '体测准备起步'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageEightNineSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_8_9 should cover ${keyword}`);
});
ageEightNineSegment.featuredPainPointKeys.forEach((painPointKey) => {
  const featuredPoint = ageEightNineSegment.painPoints.find((item) => item.key === painPointKey);
  assert.ok(featuredPoint && featuredPoint.sourceType === 'curated', `age_8_9/${painPointKey} featured point should use curated content`);
  const featuredResult = coreActionScenes.buildAgeFirstActionResult({
    ageSegmentKey: 'age_8_9',
    painPointKey,
    createdAt: 1780000000000
  });
  assert.strictEqual(featuredResult.fallbackReason, '', `age_8_9/${painPointKey} featured result should not fall back`);
  assert.strictEqual(featuredResult.ageGroup, '8-9岁', `age_8_9/${painPointKey} featured result should expose age group`);
  assert.strictEqual(featuredResult.painPointKey, painPointKey, `age_8_9/${painPointKey} featured result should preserve pain point key`);
  assert.ok(Array.isArray(featuredResult.actionSteps) && featuredResult.actionSteps.length >= 1, `age_8_9/${painPointKey} featured result should expose action steps`);
});
const ageEightNineAttentionCategory = ageEightNineSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageEightNineAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageEightNineAttentionKeys,
  'age_8_9 attention learning category should use curated upper-primary scenes'
);
['阅读效率', '抓重点弱', '作业规划', '学习耐心', '错题复盘'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageEightNineAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_8_9 attention learning should cover ${keyword}`);
});
const ageEightNineEmotionCategory = ageEightNineSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageEightNineEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageEightNineEmotionKeys,
  'age_8_9 emotion rules category should use curated upper-primary scenes'
);
['学习烦躁', '拖到最后', '失败退缩', '计划变化', '家庭沟通冲突'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageEightNineEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_8_9 emotion rules should cover ${keyword}`);
});
const ageEightNineMotorCategory = ageEightNineSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageEightNineMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageEightNineMotorKeys,
  'age_8_9 motor fitness category should use curated upper-primary scenes'
);
['体测准备起步', '跳绳稳定', '跑步耐力', '核心力量', '运动习惯'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageEightNineMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_8_9 motor fitness should cover ${keyword}`);
});
const ageEightNineSocialCategory = ageEightNineSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageEightNineSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageEightNineSocialKeys,
  'age_8_9 social expression category should use curated upper-primary scenes'
);
['学习求助', '同伴合作', '表达观点', '复盘冲突', '家庭学习沟通'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageEightNineSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_8_9 social expression should cover ${keyword}`);
});
const ageNineTwelveSegment = ageFirstSegments.find((item) => item.key === 'age_9_12');
assert.strictEqual(ageNineTwelveSegment.painCategories.length, expectedCategoryCount, 'age_9_12 should keep four pain categories');
ageNineTwelveSegment.painCategories.forEach((category) => {
  assert.strictEqual(category.painPoints.length, expectedPainPointsPerCategory, `age_9_12/${category.key} should keep ten high-age pain points`);
  category.painPoints.forEach((painPoint) => {
    assert.strictEqual(painPoint.sourceType, 'curated', `age_9_12/${painPoint.key} should use curated high-age content`);
    assertCompletePainPoint(painPoint, `age_9_12/${category.key}`);
  });
});
assert.strictEqual(ageNineTwelveSegment.painPoints.length, expectedPainPointsPerSegment, 'age_9_12 should expose forty curated pain points');
['学习耐力', '中考体训准备', '专项体能', '体态核心'].forEach((keyword) => {
  const segmentText = JSON.stringify(ageNineTwelveSegment);
  assert.ok(segmentText.indexOf(keyword) !== -1, `age_9_12 should cover ${keyword}`);
});
ageNineTwelveSegment.featuredPainPointKeys.forEach((painPointKey) => {
  const featuredPoint = ageNineTwelveSegment.painPoints.find((item) => item.key === painPointKey);
  assert.ok(featuredPoint && featuredPoint.sourceType === 'curated', `age_9_12/${painPointKey} featured point should use curated content`);
  const featuredResult = coreActionScenes.buildAgeFirstActionResult({
    ageSegmentKey: 'age_9_12',
    painPointKey,
    createdAt: 1780000000000
  });
  assert.strictEqual(featuredResult.fallbackReason, '', `age_9_12/${painPointKey} featured result should not fall back`);
  assert.strictEqual(featuredResult.ageGroup, '9-12岁', `age_9_12/${painPointKey} featured result should expose age group`);
  assert.strictEqual(featuredResult.painPointKey, painPointKey, `age_9_12/${painPointKey} featured result should preserve pain point key`);
  assert.ok(Array.isArray(featuredResult.actionSteps) && featuredResult.actionSteps.length >= 1, `age_9_12/${painPointKey} featured result should expose action steps`);
});
const ageNineTwelveAttentionCategory = ageNineTwelveSegment.painCategories.find((item) => item.key === 'attention_learning');
assert.deepStrictEqual(
  ageNineTwelveAttentionCategory.painPoints.map((painPoint) => painPoint.key),
  ageNineTwelveAttentionKeys,
  'age_9_12 attention learning category should use curated high-age scenes'
);
['学习耐力', '学习效率下降', '错题整理', '计划执行', '复习节奏'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageNineTwelveAttentionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_9_12 attention learning should cover ${keyword}`);
});
const ageNineTwelveEmotionCategory = ageNineTwelveSegment.painCategories.find((item) => item.key === 'emotion_rules');
assert.deepStrictEqual(
  ageNineTwelveEmotionCategory.painPoints.map((painPoint) => painPoint.key),
  ageNineTwelveEmotionKeys,
  'age_9_12 emotion rules category should use curated high-age scenes'
);
['学习压力', '被批评敏感', '自我要求高', '计划中断', '亲子冲突'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageNineTwelveEmotionCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_9_12 emotion rules should cover ${keyword}`);
});
const ageNineTwelveMotorCategory = ageNineTwelveSegment.painCategories.find((item) => item.key === 'motor_fitness');
assert.deepStrictEqual(
  ageNineTwelveMotorCategory.painPoints.map((painPoint) => painPoint.key),
  ageNineTwelveMotorKeys,
  'age_9_12 motor fitness category should use curated high-age scenes'
);
['中考体训准备', '跑步耐力', '跳绳爆发力', '体态核心', '专项体能节奏'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageNineTwelveMotorCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_9_12 motor fitness should cover ${keyword}`);
});
const ageNineTwelveSocialCategory = ageNineTwelveSegment.painCategories.find((item) => item.key === 'social_expression');
assert.deepStrictEqual(
  ageNineTwelveSocialCategory.painPoints.map((painPoint) => painPoint.key),
  ageNineTwelveSocialKeys,
  'age_9_12 social expression category should use curated high-age scenes'
);
['同伴关系', '表达观点', '寻求帮助', '亲子协商', '学习压力表达'].forEach((keyword) => {
  const categoryText = JSON.stringify(ageNineTwelveSocialCategory);
  assert.ok(categoryText.indexOf(keyword) !== -1, `age_9_12 social expression should cover ${keyword}`);
});

lowAgeSegmentKeys.forEach((segmentKey) => {
  const segment = ageFirstSegments.find((item) => item.key === segmentKey);
  const segmentText = JSON.stringify(segment);
  highAgeBlockedWords.forEach((word) => {
    assert.strictEqual(segmentText.indexOf(word), -1, `${segmentKey} should not include high-age expression ${word}`);
  });
});

['age_8_9', 'age_9_12'].forEach((segmentKey) => {
  const segment = ageFirstSegments.find((item) => item.key === segmentKey);
  const segmentText = JSON.stringify(segment);
  assert.ok(highAgeCoverageWords.some((word) => segmentText.indexOf(word) !== -1), `${segmentKey} should cover learning support or fitness preparation entry`);
});

console.log('Core action scene tests passed.');
