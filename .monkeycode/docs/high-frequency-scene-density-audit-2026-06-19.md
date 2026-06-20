# 高频场景内容密度审计（2026-06-19）

## 结果

已完成 22 个高频细分场景的内容密度审计，维度包括：

1. `articleCount`
2. `tipCount`
3. `aliasCount`
4. `recommendationCount`

本轮审计脚本：

1. [audit-high-frequency-scene-density.js](/workspace/backend/src/scripts/audit-high-frequency-scene-density.js)
2. 命令：`npm run verify:scene-density`

审计结果：

1. `total=22`
2. `strongCount=3`
3. `mediumCount=1`
4. `thinCount=18`

批次 A 两轮补库后，最新阶段性变化：

1. `homework_start_resistance`：`articles=4`、`tips=5`
2. `task_freeze_at_first_question`：`articles=3`、`tips=6`
3. `prolonged_mealtime_delay`：`articles=3`、`tips=2`
4. `morning_rush`：`articles=4`、`tips=2`
5. `rejected_request_meltdown`：`articles=3`、`tips=1`
6. `wakeup_activation_delay`：`articles=5`、`tips=2`
7. `peer_join_hesitation`：`articles=3`、`tips=6`
8. `boundary_breaks_in_the_moment`：`articles=3`、`tips=1`
9. `slow_emotional_recovery_after_no`：`articles=3`、`tips=3`

这说明批次 A 已经完成“全部脱离 `0/0`”这一阶段目标，接下来重点从“补到有”切到“补到过线”。

批次 A 第三轮补库后，进一步变化：

1. `prolonged_mealtime_delay`：`4/3`
2. `morning_rush`：`5/3`
3. `wakeup_activation_delay`：`6/3`
4. `rejected_request_meltdown`：`4/1`
5. `boundary_breaks_in_the_moment`：`4/1`

当前批次 A 已达到 `tip>=3` 的场景：

1. `homework_start_resistance`
2. `task_freeze_at_first_question`
3. `prolonged_mealtime_delay`
4. `morning_rush`
5. `wakeup_activation_delay`
6. `peer_join_hesitation`
7. `slow_emotional_recovery_after_no`

当前批次 A 剩余主缺口收敛到两个场景：

1. `rejected_request_meltdown`
2. `boundary_breaks_in_the_moment`

批次 A 第四轮补库后，两个剩余缺口进一步变化：

1. `rejected_request_meltdown`：`6/1`
2. `boundary_breaks_in_the_moment`：`6/2`

当前判断：

1. 这两个场景的 `article` 已经足够支撑继续提炼
2. 下一步更适合继续补“短句、高动作、强关键词重合”的内容，而不是继续补泛说明文章

批次 A 第五轮补库后，这两个场景已推进到：

1. `rejected_request_meltdown`：`8/3`
2. `boundary_breaks_in_the_moment`：`8/3`

这意味着批次 A 原始 9 个 `p0` 场景已经全部达到至少 `article>=3 && tip>=3`。

批次 B 两轮补库后的阶段结果：

1. `sore_loser_meltdown`：`3/6`
2. `peer_exclusion_support`：`5/4`
3. `chasing_feed_loop`：`5/6`
4. `sleep_resist`：`7/4`
5. `fall_asleep_delay`：`7/3`
6. `leave_table_after_two_bites`：`9/4`

当前阶段变化：

1. `leave_table_after_two_bites` 已从 `thin` 进入 `medium`
2. 总体 `thin` 场景数量从 `18` 下降到 `17`
3. 批次 B 当前剩余主缺口集中在：
   - `fall_asleep_delay`
   - `sleep_resist`
   - `peer_exclusion_support`

批次 B 第三轮补库后，进一步变化：

1. `fall_asleep_delay`：`9/5`
2. `sleep_resist`：`8/5`
3. `peer_exclusion_support`：`6/5`

当前阶段变化：

1. `fall_asleep_delay` 已从 `thin` 进入 `medium`
2. `sleep_resist` 已从 `thin` 进入 `medium`
3. 总体 `thin` 场景数量从 `17` 下降到 `15`

P2 补厚度首轮后，进一步变化：

1. `screen_time_boundary`：`13/5`
2. `kindergarten_separation_anxiety`：`9/5`
3. `slow_emotional_recovery_after_no`：`4/4`
4. `prolonged_mealtime_delay`：`5/5`
5. `backtalk_defiance`：`13/2`

当前阶段变化：

1. `screen_time_boundary` 已从 `thin` 进入 `medium`
2. `kindergarten_separation_anxiety` 已从 `thin` 进入 `medium`
3. 总体 `medium` 场景已增至 `6`
4. 总体 `thin` 场景数量从 `15` 下降到 `13`

P2 补厚度第二轮后，进一步变化：

1. `backtalk_defiance`：`15/3`
2. `slow_emotional_recovery_after_no`：`5/5`
3. `morning_rush`：`6/4`

当前判断：

1. `backtalk_defiance` 已完成从 `2 tip` 到 `3 tip` 的抬升
2. `slow_emotional_recovery_after_no` 和 `morning_rush` 内容继续增厚
3. 本轮 `thin` 场景总数维持 `13`

P2 补厚度第三轮后，进一步变化：

1. `backtalk_defiance`：`16/4`
2. `rejected_request_meltdown`：`9/5`
3. `boundary_breaks_in_the_moment`：`9/4`
4. `wakeup_activation_delay`：`8/4`

当前阶段变化：

1. `backtalk_defiance` 已从 `thin` 进入 `medium`
2. `rejected_request_meltdown` 已从 `thin` 进入 `medium`
3. `boundary_breaks_in_the_moment` 已从 `thin` 进入 `medium`
4. `wakeup_activation_delay` 已从 `thin` 进入 `medium`
5. 总体 `medium` 场景已增至 `10`
6. 总体 `thin` 场景数量从 `13` 下降到 `9`

P2/P3 收口补厚度继续推进后，进一步变化：

1. `morning_rush`：`8/5`
2. `peer_exclusion_support`：`8/5`
3. `chasing_feed_loop`：`8/6`
4. `prolonged_mealtime_delay`：`8/5`
5. `slow_emotional_recovery_after_no`：`8/9`
6. `homework_start_resistance`：`8/5`
7. `sore_loser_meltdown`：`8/10`
8. `task_freeze_at_first_question`：`8/6`
9. `peer_join_hesitation`：`8/6`

当前最新阶段结论：

1. `22` 个高频细分场景已全部脱离 `thin`
2. 内容密度基线更新为 `strong=3 medium=19 thin=0`
3. 高频场景当前阶段目标已从“消灭薄场景”进入“把中密度场景继续往 strong 推”

继续补强后新增变化：

1. `screen_time_boundary`：`20/18`
2. `backtalk_defiance`：`22/14`
3. 总体 `strong` 场景从 `3` 增长到 `5`
4. 总体密度基线更新为 `strong=5 medium=17 thin=0`

继续冲击下一批 `strong` 后的阶段位置：

1. `sore_loser_meltdown`：`15/20`
2. `slow_emotional_recovery_after_no`：`16/21`
3. 两个场景的 `tip` 已显著超过 `strong` 门槛
4. 当前主缺口已经集中在文章量补足

补齐文章量后的最新结果：

1. `sore_loser_meltdown`：`20/29`，进入 `strong`
2. `slow_emotional_recovery_after_no`：`20/27`，进入 `strong`
3. 总体 `strong` 场景从 `5` 增长到 `7`
4. 总体密度基线更新为 `strong=7 medium=15 thin=0`

继续推进下一批高价值 `medium` 后的位置：

1. `rejected_request_meltdown`：`17/19`
2. `leave_table_after_two_bites`：`16/9`
3. `fall_asleep_delay`：`14/5`
4. 当前三者都已进入文章量补足阶段

继续补强后的最新结果：

1. `rejected_request_meltdown`：`22/24`，进入 `strong`
2. `leave_table_after_two_bites`：`19/9`
3. 总体 `strong` 场景从 `7` 增长到 `8`
4. 总体密度基线更新为 `strong=8 medium=14 thin=0`

继续补量后的当前状态：

1. `leave_table_after_two_bites`：`20/9`
2. `fall_asleep_delay`：`15/5`
3. `leave_table_after_two_bites` 当前只差 `1` 条 `tip` 即可进入 `strong`

高提炼命中补量后的观察：

1. `leave_table_after_two_bites`：`23/9`
2. `fall_asleep_delay`：`16/5`
3. 本轮新增文章已提升文章量
4. `leave_table_after_two_bites` 的 `tip` 仍为 `9`，说明新增内容与现有提炼结果发生去重重合

C14-C16 三轮补库后的最新结果：

1. `leave_table_after_two_bites`：`25/9`
2. `fall_asleep_delay`：`22/5`
3. `night_waking_repeat`：`17/4`
4. `boundary_breaks_in_the_moment`：`14/9`
5. `kindergarten_separation_anxiety`：`14/5`
6. `wakeup_activation_delay`：`10/6`
7. `peer_exclusion_support`：`10/5`
8. `homework_start_resistance`：`10/5`
9. `sleep_resist`：`10/5`
10. `task_freeze_at_first_question`：`10/6`
11. `peer_join_hesitation`：`9/6`
12. `prolonged_mealtime_delay`：`9/5`
13. `chasing_feed_loop`：`9/6`
14. `morning_rush`：`8/5`（未变化）

当前总体密度基线：`strong=8 medium=14 thin=0`

本轮主要变化：
1. `boundary_breaks_in_the_moment` 的 `tip` 从 `4` 显著增长到 `9`，离 `strong` 只差 `1 tip + 6 article`
2. `leave_table_after_two_bites` 的 `article` 已远超 `20`，但 `tip` 始终卡在 `9`
3. `fall_asleep_delay` 和 `night_waking_repeat` 的 `tip` 转化率持续偏低

## 分层结论

### Strong

1. `turn_taking_boundary`：`articles=26`、`tips=11`
2. `reward_system_fatigue`：`articles=55`、`tips=25`
3. `repeated_rule_ignoring`：`articles=291`、`tips=69`

### Medium

1. `night_waking_repeat`：`articles=11`、`tips=4`

### Thin

其余 18 个场景都属于薄覆盖，说明当前“入口已经立住”，内容厚度还远远不够。

## P0 缺口

初始审计时，以下场景 `articleCount=0` 且 `tipCount=0`，优先级最高：

1. `homework_start_resistance`
2. `task_freeze_at_first_question`
3. `prolonged_mealtime_delay`
4. `morning_rush`
5. `rejected_request_meltdown`
6. `wakeup_activation_delay`
7. `peer_join_hesitation`
8. `boundary_breaks_in_the_moment`
9. `slow_emotional_recovery_after_no`

这批场景已经具备：

1. 独立 `scene`
2. `10+` 条别名
3. `4+` 条推荐动作

当前剩余缺的是：

1. 把 `article` 从 `3-5` 提到更稳的覆盖量
2. 把 `tip` 从 `1-3` 提到批次验收线

## 当前 P1 缺口

以下场景已经有少量内容，但仍然偏薄：

1. `sore_loser_meltdown`：`articles=1`、`tips=0`
2. `peer_exclusion_support`：`articles=3`、`tips=0`
3. `rejected_request_meltdown`：`articles=3`、`tips=1`
4. `chasing_feed_loop`：`articles=3`、`tips=1`
5. `boundary_breaks_in_the_moment`：`articles=3`、`tips=1`
6. `prolonged_mealtime_delay`：`articles=3`、`tips=2`
7. `slow_emotional_recovery_after_no`：`articles=3`、`tips=3`
8. `task_freeze_at_first_question`：`articles=3`、`tips=6`
9. `peer_join_hesitation`：`articles=3`、`tips=6`
10. `sleep_resist`：`articles=5`、`tips=0`
11. `fall_asleep_delay`：`articles=5`、`tips=1`
12. `leave_table_after_two_bites`：`articles=6`、`tips=0`

## P2 缺口

这几类已经有一定底子，下一步更适合补锦囊密度：

1. `kindergarten_separation_anxiety`：`articles=8`、`tips=3`
2. `screen_time_boundary`：`articles=12`、`tips=2`
3. `backtalk_defiance`：`articles=12`、`tips=2`

## 建议顺序

### 下一轮先补剩余低 tip 场景

1. `rejected_request_meltdown`
2. `boundary_breaks_in_the_moment`
3. `peer_exclusion_support`
4. `sleep_resist`
5. `fall_asleep_delay`

### 再补仍未过线的晨起、社交和恢复类

1. `peer_exclusion_support`
2. `sleep_resist`
3. `fall_asleep_delay`
4. `leave_table_after_two_bites`
5. `sore_loser_meltdown`

### 第三轮把已起量场景推向验收线

1. `homework_start_resistance`
2. `task_freeze_at_first_question`
3. `peer_join_hesitation`
4. `slow_emotional_recovery_after_no`
5. `wakeup_activation_delay`

## 结论

当前高频补库已经完成“入口建设”阶段，接下来进入“内容厚度建设”阶段。

最值钱的动作是：

1. 继续把批次 A 场景从“脱离 `0/0`”推进到“达到 `article>=3 && tip>=3` 以上”
2. 优先补 `tip<=2` 的批次 A 场景
3. 每补完一轮后重跑 `npm run verify:scene-keywords-db` 和 `npm run verify:scene-density`
4. 再进入批次 B

## 最终状态（C25 完成后）

完整 25 轮补库 + Jaccard 阈值修复后的最终审计结果：

```
strong=18 medium=4 thin=0

strong (18):
  morning_rush 20/10          peer_join_hesitation 20/10
  peer_exclusion_support 20/12  chasing_feed_loop 20/16
  boundary_breaks_in_the_moment 20/25  slow_emotional_recovery_after_no 20/27
  sore_loser_meltdown 20/32    night_waking_repeat 21/14
  backtalk_defiance 22/15      rejected_request_meltdown 22/27
  wakeup_activation_delay 24/12  leave_table_after_two_bites 25/10
  turn_taking_boundary 27/13   fall_asleep_delay 27/18
  screen_time_boundary 28/25   kindergarten_separation_anxiety 34/29
  reward_system_fatigue 59/34  repeated_rule_ignoring 345/133

medium (4):
  prolonged_mealtime_delay 12/14  (articles 不足)
  homework_start_resistance 13/5  (articles + tips 均不足)
  task_freeze_at_first_question 25/6  (tips 转化率低)
  sleep_resist 25/9  (差 1 tip)
```

## 全链路变化汇总

| 指标 | 起点 | 终点 | 变化 |
|------|------|------|------|
| strong | 3 | 18 | +15 |
| medium | 1 | 4 | +3 |
| thin | 18 | 0 | -18 |
| keywords | 44/44 | 44/44 | — |
| tips | 约 4000+ | 7458 | +约 130% |
| scene_coverage | — | 4496/7458 (60%) | — |
| 新增文章 | — | ~238 | — |
| 补库批次 | — | C1-C25 | — |

## 关键工程决策

1. Jaccard 去重阈值从 0.55 → 0.70（最大单次收益：night_waking_repeat tip 4→14）
2. 审计关键词从纯问题描述扩展为"问题描述 + 策略关键词"双覆盖
3. 不新增 scene 入口，冻结 22 个
4. 内容写法从"叙事育儿文"转为"短句/高动作/强关键词重合"策略
5. buildSignature 从 first 3 chars → first 5 chars（降低误去重）

