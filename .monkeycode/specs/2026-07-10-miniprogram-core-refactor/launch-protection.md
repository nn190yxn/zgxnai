# 小程序核心重构上线保护清单

## 上线门槛

- 新版首页必须通过 `RUNTIME_CORE_REFACTOR_ENABLED`、`RUNTIME_CORE_REFACTOR_ROLLOUT_PERCENT`、`RUNTIME_CORE_REFACTOR_USER_WHITELIST` 控制展示范围。
- 新版上线必须同时具备：首页入口收敛、6 个高频场景完整结果、今晚小任务、次日记录、AI 追问、成长记录、会员承接、关键埋点、后台统计。
- 只有本地基础闭环或只完成 P0 时，保持 `RUNTIME_CORE_REFACTOR_ENABLED=false` 且 `RUNTIME_CORE_REFACTOR_ROLLOUT_PERCENT=0`。
- 灰度期间先使用白名单验证，再使用 5%、20%、50%、100% 的灰度比例推进。

## 快速回退

- 全量关闭新版：首页运行时配置设为 `RUNTIME_CORE_REFACTOR_ENABLED=false`。
- 关闭灰度新版：首页运行时配置设为 `RUNTIME_CORE_REFACTOR_ROLLOUT_PERCENT=0`。
- 移除指定用户灰度：从 `RUNTIME_CORE_REFACTOR_USER_WHITELIST` 中移除对应用户标识。
- 回退后旧首页区块展示，旧测评、育儿知识、营养、阅读练习、成长记录、周报、会员入口继续可达。
- 新版本地记录只作为首页继续行动和周总结兜底使用，回退后不阻塞旧功能。

## 新旧入口映射

| 原功能 | 新版入口位置 | 回退位置 |
| --- | --- | --- |
| 小牛问答 | 第一动作结果页“继续问细节”、更多工具“继续追问细节” | 旧首页 Hero、小牛问答 tab |
| 成长观察 | 更多工具“做观察”、AI 回答后行动 | 旧首页成长观察入口 |
| 育儿知识 | 第一动作结果页“找相关锦囊”、更多工具“找方法” | 旧首页育儿锦囊入口 |
| 营养建议 | 更多工具“看营养”、AI 回答后行动 | 旧首页营养食谱建议入口 |
| 阅读练习 | 更多工具“做练习”、相关场景结果承接 | 旧首页每日练习入口 |
| 成长记录 | 第一动作结果页“记到成长记录”、更多工具“记成长” | 旧首页成长记录入口 |
| 周总结 | 连续记录主卡片、更多工具“看周报” | 旧首页周总结入口 |
| 会员服务 | 连续陪伴承接卡、更多工具“成长服务” | 会员页路由 `/pages/membership/index` |

## 核心优势验收

- 首页首屏表达“先判断孩子当前卡点，再做今晚第一步”。
- 场景选择在首屏直接出现，并覆盖 6 个高频家庭场景。
- 结果页同时展示“卡点判断”和“今晚第一步”。
- 保存小任务后能在次日回到效果记录。
- 效果记录后能看到下一步建议，并能保存为新小任务。
- 成长记录、周总结、AI 追问、育儿知识和会员服务都从结果或更多工具承接。

## 观测指标

- 首页新版曝光：`home_core_claim_view`。
- 第一动作点击：`first_action_entry_click`。
- 场景选择：`scene_select`。
- 年龄选择：`age_select`。
- 表现选择：`symptom_select`。
- 结果生成：`bottleneck_result_view`。
- 小任务保存：`tonight_action_save`。
- 次日记录曝光：`next_day_record_view`。
- 效果提交：`action_effect_submit`。
- 下一步建议曝光：`next_action_view`。
- 管理后台必须展示总漏斗、按场景漏斗和核心场景内容缺口。
