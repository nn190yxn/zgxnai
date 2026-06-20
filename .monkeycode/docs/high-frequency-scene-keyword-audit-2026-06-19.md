# 高频场景关键词回测（2026-06-19）

## 结果

已完成 22 个高频细分场景、44 条代表性家长问法的数据库级关键词回测。

回测结果：

1. `total=44`
2. `passed=44`
3. `failed=0`

本轮回测使用脚本：

1. [audit-high-frequency-scene-keywords.js](/workspace/backend/src/scripts/audit-high-frequency-scene-keywords.js)
2. 命令：`npm run verify:scene-keywords-db`

## 覆盖范围

本轮覆盖以下 22 个细分场景：

1. `kindergarten_separation_anxiety`
2. `screen_time_boundary`
3. `night_waking_repeat`
4. `backtalk_defiance`
5. `turn_taking_boundary`
6. `sore_loser_meltdown`
7. `peer_exclusion_support`
8. `reward_system_fatigue`
9. `repeated_rule_ignoring`
10. `homework_start_resistance`
11. `task_freeze_at_first_question`
12. `prolonged_mealtime_delay`
13. `leave_table_after_two_bites`
14. `sleep_resist`
15. `morning_rush`
16. `fall_asleep_delay`
17. `rejected_request_meltdown`
18. `chasing_feed_loop`
19. `wakeup_activation_delay`
20. `peer_join_hesitation`
21. `boundary_breaks_in_the_moment`
22. `slow_emotional_recovery_after_no`

说明：脚本按“每个场景 2 条代表性问法”设计，因此当前样本总量是 44 条。

## 代表性命中样本

1. `上幼儿园就哭` -> `kindergarten_separation_anxiety`
2. `总想看手机` -> `screen_time_boundary`
3. `半夜总醒` -> `night_waking_repeat`
4. `孩子总顶嘴` -> `backtalk_defiance`
5. `轮到别人就生气` -> `turn_taking_boundary`
6. `一输就哭` -> `sore_loser_meltdown`
7. `没人一起玩` -> `peer_exclusion_support`
8. `奖励一停就不做` -> `reward_system_fatigue`
9. `反复提醒还是没用` -> `repeated_rule_ignoring`
10. `拖到最后才写作业` -> `homework_start_resistance`
11. `看题就说不会` -> `task_freeze_at_first_question`
12. `一顿饭吃很长时间` -> `prolonged_mealtime_delay`
13. `吃两口就跑` -> `leave_table_after_two_bites`
14. `睡前拖拖拉拉` -> `sleep_resist`
15. `上学前磨蹭` -> `morning_rush`
16. `躺下很久睡不着` -> `fall_asleep_delay`
17. `不答应就大哭` -> `rejected_request_meltdown`
18. `不追着喂就不吃` -> `chasing_feed_loop`
19. `叫很多次还不动` -> `wakeup_activation_delay`
20. `站在旁边不敢加入` -> `peer_join_hesitation`
21. `一到现场守不住` -> `boundary_breaks_in_the_moment`
22. `被拒绝后缓不过来` -> `slow_emotional_recovery_after_no`

## 结论

当前高频场景补库已经从“手工抽样确认”升级到“可重复跑的数据库级回测”。

下一步最值钱的是：

1. 给这 22 个细分场景补更多关联文章
2. 给这 22 个细分场景补更多短锦囊
3. 继续扩每个场景的真实问法样本，把每场景从 `2` 条提升到 `5-8` 条
4. 在正式服务进程上再跑一次接口级 `/search/solutions` 回测
