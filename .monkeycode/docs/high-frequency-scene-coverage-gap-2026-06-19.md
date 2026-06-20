# 高频场景覆盖缺口清单（2026-06-19）

## 目的

这份清单用于判断当前小程序知识库在高频家庭场景上的覆盖深度，明确下一轮补库优先级。

本次评估聚焦 8 类高频场景：

1. 入园分离焦虑
2. 不肯写作业
3. 吃饭拖拉和挑食
4. 睡前拖延和夜醒
5. 发脾气和顶嘴
6. 同伴冲突和分享
7. 屏幕时间管理
8. 规则建立与执行

## 评估方法

从当前数据库盘点以下四类内容：

1. `parenting_scene_tags`：是否已经形成独立场景入口
2. `parenting_scene_aliases`：是否支持家长真实问法别名
3. `articles`：是否已有知识内容支撑
4. `parenting_tips`：是否已有可直接复用的短建议

说明：

1. `articles` 和 `tips` 数量是关键词命中后的粗覆盖量，用于判断“有没有内容底子”。
2. 真正决定 `/chat` 稳定命中的，优先看 `scene_tags + scene_aliases + scene_recommendations` 是否成型。
3. `reading_tasks` 在本轮只作为间接参考，不作为场景成熟度主指标。

## 覆盖盘点

| 场景 | scene_tags | scene_aliases | articles | tips | 当前判断 |
| --- | ---: | ---: | ---: | ---: | --- |
| 入园分离焦虑 | 0 | 0 | 56 | 19 | 有内容，无场景入口 |
| 不肯写作业 | 2 | 6 | 107 | 760 | 场景已成型 |
| 吃饭拖拉和挑食 | 4 | 11 | 114 | 270 | 场景较完整 |
| 睡前拖延和夜醒 | 4 | 8 | 64 | 23 | 睡前有结构，夜醒偏弱 |
| 发脾气和顶嘴 | 2 | 17 | 132 | 47 | 情绪场景较强，顶嘴偏弱 |
| 同伴冲突和分享 | 2 | 8 | 101 | 36 | 有结构，细分不够 |
| 屏幕时间管理 | 0 | 0 | 159 | 58 | 有内容，无场景入口 |
| 规则建立与执行 | 4 | 0 | 384 | 81 | 原则内容强，真实问法弱 |

## 本轮已完成补强

本轮已经把前五批高优先级场景补入 `parenting_scene_*`。

第一批已落地：

1. `kindergarten_separation_anxiety`：入园分离焦虑
2. `screen_time_boundary`：屏幕时间管理
3. `night_waking_repeat`：半夜反复夜醒
4. `backtalk_defiance`：孩子一说就顶嘴

第二批已落地：

1. `turn_taking_boundary`：轮到别人就不肯给
2. `sore_loser_meltdown`：一输就哭和输不起
3. `peer_exclusion_support`：被同伴排斥没人一起玩
4. `reward_system_fatigue`：奖励贴纸渐渐失效
5. `repeated_rule_ignoring`：规则说很多次还是不听

第三批已落地：

1. `homework_start_resistance`：作业拖到最后才开始写
2. `task_freeze_at_first_question`：一看题就说不会
3. `prolonged_mealtime_delay`：一顿饭拖很久
4. `leave_table_after_two_bites`：吃两口就下桌

第四批已落地：

1. `sleep_resist`：睡前磨蹭（已有场景增强）
2. `morning_rush`：早晨出门磨蹭（已有场景增强）
3. `fall_asleep_delay`：躺下很久还是睡不着
4. `rejected_request_meltdown`：一被拒绝就情绪爆炸

第五批已落地：

1. `chasing_feed_loop`：不追着喂就不吃
2. `wakeup_activation_delay`：叫很多次还不起床
3. `peer_join_hesitation`：站在旁边却不敢加入
4. `boundary_breaks_in_the_moment`：一到现场规则就守不住
5. `slow_emotional_recovery_after_no`：被拒绝后很久缓不过来

本轮新增总量：

1. 新增 `20` 个高频细分 `scene`
2. 新增并补强 `200` 条 `alias`
3. 新增并补强 `80` 条 `recommendation`
4. `parenting_scene_tags` 总量已从 `37` 增长到 `57`

抽样问法命中已确认：

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

## 当前已成型场景

这几类已经具备“用户提问 -> 场景识别 -> 推荐结构”的基础：

1. `写作业坐不住`
2. `吃饭挑食`
3. `睡前流程`
4. `小朋友之间抢玩具`
5. `公共场合闹情绪`
6. `当孩子情绪崩溃时`
7. `正面管教实践`

已查到的代表性场景与推荐结构：

1. `homework_focus`：`solution_card x1`
2. `meal_picky`：`solution_card x1`
3. `bedtime_routine`：`action x4`
4. `sharing_conflict`：`action x4`
5. `peer_conflict`：`solution_card x1`
6. `tantrum_public`：`solution_card x1`
7. `handling_child_big_emotions`：`action x2`
8. `positive_discipline`：`action x4`
9. `building_discipline_for_child`：`action x3`

## 主要缺口

### P1：有内容底子，但没有场景入口

这类问题最影响 `/chat` 稳定命中。

1. 入园分离焦虑
2. 屏幕时间管理

当前状态：

1. 这两类问题在本轮开始前都有内容底子。
2. 现在已经补齐独立 `scene`、别名和推荐动作。
3. 下一步重点从“有没有入口”切到“入口够不够细、够不够稳”。

建议动作：

1. 继续补更贴近年龄段的别名问法
2. 补足入园适应和屏幕边界的关联文章与锦囊
3. 用真实问法回测命中稳定性

### P1：已有大场景，子问题还不够细

1. 睡前拖延和夜醒
2. 发脾气和顶嘴
3. 同伴冲突和分享

当前状态：

1. `睡前流程` 已成型，`夜醒` 现在已有独立场景入口。
2. `发脾气` 相关别名很多，`顶嘴` 现在已有独立场景入口。
3. `抢玩具 / 分享` 已有基础，`被排斥 / 不会轮流 / 一输就哭` 这类真实子场景也已补齐独立入口。

建议动作：

1. 睡眠场景已经补到 `夜醒反复 / 睡前磨蹭 / 入睡难` 三层
2. 情绪场景已经补到 `顶嘴对抗 / 被拒绝就爆炸`
3. 继续从同伴场景里补更细的分享边界和社交开场问题

### P2：规则类内容多，但问法入口弱

1. 规则建立与执行

当前状态：

1. 原则型文章很多，`articles=384`。
2. 有 `正面管教实践`、`纪律教育` 这类场景。
3. 本轮已经补上“奖励失效”和“规则说很多次还是不听”两个直达入口。

建议动作：

1. 规则执行入口已经补到 `说很多次不听 / 临场守不住` 两层
2. 继续补更多规则执行关联文章和可复用锦囊

## 优先级建议

### 下一批优先补

1. 饭桌追着喂
2. 起床叫很多次还不动
3. 同伴开场困难
4. 界限不清和临场失守

理由：

1. 上述五类场景已经补进独立入口。
2. 下一轮最值钱的是继续补它们对应的关联文章和锦囊密度。

### 继续补细分

1. 饭桌追喂的替代过渡句
2. 起床启动慢的年龄分层问法
3. 同伴开场句和加入动作模板
4. 外出高诱惑场景的规则执行变体
5. 情绪恢复慢的安抚动作模板

### 第三批补深度

1. 作业启动难 vs 不会写 vs 坐不住
2. 挑食 vs 吃饭拖拉 vs 饭桌节奏混乱
3. 睡前磨蹭 vs 入睡难 vs 夜醒反复

## 补库形式建议

下一轮补库优先补 `scene`，再补 `article` 和 `tip`，顺序固定如下：

1. 先建场景主标题
2. 再补别名问法
3. 再补原则与推荐动作
4. 最后补关联文章和锦囊

建议每个新场景至少包含：

1. `1` 个场景主标题
2. `8-12` 条别名
3. `3-4` 条推荐动作
4. `3-5` 篇关联文章
5. `5-10` 条可直接引用的短锦囊

## 结论

当前知识库已经具备可用底座，强项在：

1. 写作业
2. 挑食吃饭
3. 情绪崩溃
4. 睡前流程

总规划文档已经建立：

1. [high-frequency-scene-content-depth-plan-2026-06-19.md](/workspace/.monkeycode/docs/high-frequency-scene-content-depth-plan-2026-06-19.md)

当前最值钱的补库方向仍然是“把已有内容整理成更强的场景入口”，这轮已经补完五批高频细分入口。

关键词回测基线已经落地：

1. 脚本：[audit-high-frequency-scene-keywords.js](/workspace/backend/src/scripts/audit-high-frequency-scene-keywords.js)
2. 命令：`npm run verify:scene-keywords-db`
3. 当前结果：`44/44` 代表性问法通过
4. 审计文档：[high-frequency-scene-keyword-audit-2026-06-19.md](/workspace/.monkeycode/docs/high-frequency-scene-keyword-audit-2026-06-19.md)

下一轮最值得继续下钻的是：

1. 给新场景补更强的关联文章密度
2. 给新场景补可直接复用的短锦囊
3. 继续按真实家长问法扩别名
4. 用真实问法做更大范围回测
5. 再决定第六批是否继续下钻年龄分层和场景变体

这批补完后，再做一轮真实家长问法回测，最能看出 `/chat` 的实际提升。
