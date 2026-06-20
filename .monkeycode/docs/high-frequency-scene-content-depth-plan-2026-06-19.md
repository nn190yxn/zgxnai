# 高频场景内容深度总规划（2026-06-19）

## 目标

当前高频场景建设已经完成第一阶段：把高频家庭问题拆成可命中的细分 `scene` 入口。

下一阶段目标是把这套入口补成“可稳定回答、可回测、可持续扩库”的内容网络，避免局部修补叠加出整体失衡。

本规划覆盖四个层面：

1. 入口层
2. 内容层
3. 回测层
4. 发布层

## 当前基线

截至 2026-06-19，已经完成：

1. `parenting_scene_tags` 从 `37` 增长到 `57`
2. 新增 `20` 个高频细分 `scene`
3. 新增并补强 `200` 条 `alias`
4. 新增并补强 `80` 条 `recommendation`
5. 关键词数据库回测 `44/44` 通过

当前基线文档：

1. [high-frequency-scene-coverage-gap-2026-06-19.md](/workspace/.monkeycode/docs/high-frequency-scene-coverage-gap-2026-06-19.md)
2. [high-frequency-scene-keyword-audit-2026-06-19.md](/workspace/.monkeycode/docs/high-frequency-scene-keyword-audit-2026-06-19.md)
3. [high-frequency-scene-density-audit-2026-06-19.md](/workspace/.monkeycode/docs/high-frequency-scene-density-audit-2026-06-19.md)

## 核心问题

当前真正的风险已经从“场景命不中”转成“场景虽然能命中，但后面内容太薄”。

最新密度审计结果：

1. `22` 个细分场景里，`strong=5`
2. `medium=17`
3. `thin=0`

这说明：

1. 场景入口建设已经领先于内容厚度建设
2. 后续再继续无计划地立新入口，整体结构会越来越虚
3. 现在进入下一阶段：继续把 `medium` 高价值场景按收益排序推入 `strong`

## 总体策略

后续工作固定按四阶段推进。

### 阶段 1：入口冻结

目标：先冻结高频细分入口集合，减少继续扩散。

规则：

1. 现有 22 个细分场景先作为主干集合
2. 新增 `scene` 进入严格准入，只有出现明显新大类缺口时才允许扩
3. 接下来优先补内容厚度，不再默认继续拆更多 `scene`

阶段完成标准：

1. 高频问题主干入口清单稳定
2. 每次迭代都以补厚度为主，新增入口为例外动作

### 阶段 2：内容厚度建设

目标：把每个细分场景从“只有入口”补到“有文章、有锦囊、有动作结构”。

每个场景的最低目标配置：

1. `1` 个 `scene`
2. `8-12` 条 `alias`
3. `4+` 条 `recommendation`
4. `3-5` 篇关联 `article`
5. `5-10` 条可复用 `tip`

优先级固定按密度审计执行：

1. `p0`：`article=0 && tip=0`
2. `p1`：`article<=6 || tip<=1`
3. `p2`：已有底子，但 `tip` 明显偏少
4. `p3`：内容已足，进入维护态

### 阶段 3：回测固化

目标：每补一批内容，都能验证它确实在改善系统，而不是只增加数据量。

固定回测项：

1. `npm run verify:scene-keywords-db`
2. `npm run verify:scene-density`
3. `npm run lint`
4. 条件允许时再跑接口级 `/search/solutions` 回测

回测结果要求：

1. 关键词命中率维持 `100%`
2. `thin` 场景数量持续下降
3. 新补内容优先落在 `p0/p1` 场景，而不是继续堆强场景

### 阶段 4：发布与复盘

目标：每一批补库都有清晰的输入、输出和结果记录。

固定产出：

1. 补库批次清单
2. 命中回测结果
3. 密度变化结果
4. 剩余缺口清单

## 批次规划

后续不再按“想到一个补一个”执行，固定按批次推进。

### 批次 A：P0 场景补厚度

目标场景：

1. `homework_start_resistance`
2. `task_freeze_at_first_question`
3. `prolonged_mealtime_delay`
4. `morning_rush`
5. `rejected_request_meltdown`
6. `wakeup_activation_delay`
7. `peer_join_hesitation`
8. `boundary_breaks_in_the_moment`
9. `slow_emotional_recovery_after_no`

本批动作：

1. 每个场景补 `3-5` 篇文章
2. 每个场景补 `5-10` 条锦囊
3. 文章和锦囊统一标出对应场景关键词

本批验收：

1. 所有 `p0` 场景从 `0/0` 提升为至少 `article>=3 && tip>=3`

当前进度：

1. 已完成两轮补库，新增批次 A 文章 `36` 篇
2. 已完成提炼规则补强：`认知发展`、`纪律管理` 已纳入锦囊提炼白名单
3. 已完成“全部脱离 `0/0`”这一阶段目标
4. 当前最接近过线的场景：
   - `task_freeze_at_first_question`：`3/6`
   - `peer_join_hesitation`：`3/6`
   - `slow_emotional_recovery_after_no`：`3/3`
   - `homework_start_resistance`：`4/5`
5. 第三轮补库后已推进到：
   - `prolonged_mealtime_delay`：`4/3`
   - `morning_rush`：`5/3`
   - `wakeup_activation_delay`：`6/3`
6. 当前仍需继续补 `tip` 的场景：
   - `rejected_request_meltdown`：`6/1`
   - `boundary_breaks_in_the_moment`：`6/2`
7. 当前执行判断：
   - 这两个场景的文章量已经到位
   - 下一步重点改成补更容易被提炼器命中的短动作句内容

8. 第五轮补库后结果：
   - `rejected_request_meltdown`：`8/3`
   - `boundary_breaks_in_the_moment`：`8/3`
9. 批次 A 状态：
   - 已完成原始验收线：全部 `p0` 场景达到至少 `article>=3 && tip>=3`
   - 下一步可以进入批次 B，或者先继续把批次 A 中高价值场景往 `tip>=5` 推

### 批次 B：P1 场景补厚度

目标场景：

1. `sore_loser_meltdown`
2. `peer_exclusion_support`
3. `chasing_feed_loop`
4. `sleep_resist`
5. `fall_asleep_delay`
6. `leave_table_after_two_bites`

本批动作：

1. 优先补 `tip`，再补缺口较大的文章
2. 把已有文章拆成更可召回的小块

本批验收：

1. 所有 `p1` 场景达到至少 `article>=6 && tip>=4`

当前进度：

1. 已完成两轮补库，新增批次 B 文章 `12` 篇
2. 当前达到或超过 `tip>=4` 的场景：
   - `sore_loser_meltdown`：`3/6`
   - `peer_exclusion_support`：`5/4`
   - `chasing_feed_loop`：`5/6`
   - `sleep_resist`：`7/4`
   - `leave_table_after_two_bites`：`9/4`
3. 当前最主要剩余缺口：
   - `fall_asleep_delay`：`7/3`
4. 密度盘子变化：
   - `leave_table_after_two_bites` 已进入 `medium`
   - `thin` 场景数量已从 `18` 降到 `17`
5. 第三轮补库后进一步变化：
   - `fall_asleep_delay`：`9/5`
   - `sleep_resist`：`8/5`
   - `peer_exclusion_support`：`6/5`
6. 当前密度盘子：
   - `medium` 场景已增至 `4`
   - `thin` 场景已从 `17` 降到 `15`

### 批次 C：P2 场景补锦囊密度

当前进度：

1. 已完成首轮补库，新增批次 C 文章 `5` 篇
2. 当前达到 `medium` 的场景：
   - `screen_time_boundary`：`13/5`
   - `kindergarten_separation_anxiety`：`9/5`
3. 当前已明显增厚但仍为 `thin` 的场景：
   - `slow_emotional_recovery_after_no`：`4/4`
   - `prolonged_mealtime_delay`：`5/5`
4. 当前最主要剩余缺口：
   - `backtalk_defiance`：`13/2`
5. 当前密度盘子：
   - `medium` 场景已增至 `6`
   - `thin` 场景已从 `15` 降到 `13`
6. 第二轮补库后进一步变化：
   - `backtalk_defiance`：`15/3`
   - `slow_emotional_recovery_after_no`：`5/5`
   - `morning_rush`：`6/4`
7. 当前判断：
   - `backtalk_defiance` 仍是这组里最主要剩余缺口
   - 其余已补场景处于继续增厚阶段
8. 后续收口补库完成后结果：
   - `backtalk_defiance`：`16/4`
   - `rejected_request_meltdown`：`9/5`
   - `boundary_breaks_in_the_moment`：`9/4`
   - `wakeup_activation_delay`：`8/4`
   - `morning_rush`：`8/5`
   - `peer_exclusion_support`：`8/5`
   - `chasing_feed_loop`：`8/6`
   - `prolonged_mealtime_delay`：`8/5`
   - `slow_emotional_recovery_after_no`：`8/9`
   - `homework_start_resistance`：`8/5`
   - `sore_loser_meltdown`：`8/10`
   - `task_freeze_at_first_question`：`8/6`
   - `peer_join_hesitation`：`8/6`
9. 当前密度盘子：
   - `medium` 场景已增至 `19`
   - `thin` 场景已降到 `0`
10. 当前阶段结论：
   - “消灭薄场景” 已完成
   - 下一步应按价值排序把 `medium` 推入 `strong`
11. 继续补强后的新增结果：
   - `screen_time_boundary`：`20/18`，已进入 `strong`
   - `backtalk_defiance`：`22/14`，已进入 `strong`
12. 当前最新密度盘子：
   - `strong=5`
   - `medium=17`
   - `thin=0`
13. 下一批最接近 `strong` 的场景：
   - `sore_loser_meltdown`：`15/20`
   - `slow_emotional_recovery_after_no`：`16/21`
14. 当前判断：
   - 这两个场景已经完成 `tip` 厚度建设
   - 下一轮只需要补文章量就能继续扩大 `strong` 盘子
15. 补齐文章量后的新增结果：
   - `sore_loser_meltdown`：`20/29`，已进入 `strong`
   - `slow_emotional_recovery_after_no`：`20/27`，已进入 `strong`
16. 当前最新密度盘子：
   - `strong=7`
   - `medium=15`
   - `thin=0`
17. 下一批推进后的最新位置：
   - `rejected_request_meltdown`：`17/19`
   - `leave_table_after_two_bites`：`16/9`
   - `fall_asleep_delay`：`14/5`
18. 当前判断：
   - `rejected_request_meltdown` 离 `strong` 最近
   - `leave_table_after_two_bites` 次之
   - `fall_asleep_delay` 当前主要缺口仍是文章量
19. 继续补强后的新增结果：
   - `rejected_request_meltdown`：`22/24`，已进入 `strong`
   - `leave_table_after_two_bites`：`19/9`
20. 当前最新密度盘子：
   - `strong=8`
   - `medium=14`
   - `thin=0`
21. 继续补量后的当前状态：
   - `leave_table_after_two_bites`：`20/9`
   - `fall_asleep_delay`：`15/5`
22. 当前判断：
   - `leave_table_after_two_bites` 只差 `1` 条 `tip`
   - `fall_asleep_delay` 继续缺文章量
23. 新一轮高提炼命中补量后的观察：
   - `leave_table_after_two_bites`：`23/9`
   - `fall_asleep_delay`：`16/5`
24. 当前判断：
   - `leave_table_after_two_bites` 的主阻塞已经从文章量转成 `tip` 去重重合
   - 下一轮需要刻意补一条全新表达的动作型 `tip` 才能过线

### 批次 C：P2 场景补锦囊密度

目标场景：

1. `kindergarten_separation_anxiety`
2. `screen_time_boundary`
3. `backtalk_defiance`

本批动作：

1. 重点补 `tip`
2. 扩别名问法到每场景 `5-8` 条真实回测样本

本批验收：

1. 每个场景 `tip>=6`
2. 回测样本从 `2` 条扩到 `5-8` 条

## 执行规则

后续执行必须遵守以下规则：

1. 每次先看总规划和当前批次目标，再动手
2. 每次只做一个批次，不跨批次混做
3. 每批先补文章，再补锦囊，再跑回测
4. 未完成回测的批次，不进入下一批
5. 若某批出现命中回退或密度异常，先修复本批，再继续推进

## 风险控制

需要重点防的不是某条数据错，而是结构性漂移。

主要风险：

1. 继续新增过多 `scene`，导致厚度越来越薄
2. 强场景继续堆内容，弱场景始终空心
3. 别名扩多了，但文章和锦囊没有跟上
4. 新内容补进去后，回测样本不更新，形成“看起来变多，实际上没变强”

对应控制：

1. 入口冻结
2. 按 `p0 -> p1 -> p2` 固定顺序补厚度
3. 每批都跑密度审计和关键词回测
4. 所有批次都留文档记录

## 里程碑

### 里程碑 1

1. 完成批次 A
2. `p0` 场景全部脱离 `0/0`

### 里程碑 2

1. 完成批次 B
2. `thin` 场景从 `18` 压到 `10` 以下

### 里程碑 3

1. 完成批次 C
2. 核心高频场景全部具备“入口 + 文章 + 锦囊 + 回测样本”四层结构
3. 当前状态：已完成

## 结论

后续最合理的推进方式是：先冻结入口，再分批补厚度，再用回测和密度审计做闭环。

接下来我会按这个总规划推进，默认从批次 A 开始，不再无计划横向扩新入口。
