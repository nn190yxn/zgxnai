# 小程序核心重构需求

## Introduction

本轮重构目标是解决小程序打开率和使用率下降、首页功能密集、核心优势表达不清的问题。小程序应从“多个育儿功能集合”收敛为“帮家长先看懂孩子当前卡点，并给出今晚能执行的一步”的专业育儿陪伴工具。

相对通用 AI 工具，小牛育儿的优势应体现在：基于孩子档案和年龄阶段判断问题、把家庭场景转成可执行步骤、沉淀成长记录、持续给出下一步。

## Glossary

- **核心主张**: 小程序向用户传达的单一价值表达，推荐为“先看懂孩子当前卡点，再做今晚第一步”。
- **第一动作**: 新用户或回访用户进入小程序后最优先完成的动作，推荐为“选择孩子当前场景并获得一条可执行建议”。
- **家庭场景**: 家长能直接代入的日常情境，例如写作业、亲子共读、吃饭、睡前洗漱、出门上课。
- **卡点判断**: 系统根据年龄、孩子档案、用户选择和历史记录判断孩子当前更可能卡在什么环节。
- **行动建议**: 系统给出的可在当天家庭场景中执行的短步骤。
- **连续陪伴**: 系统在一次建议之后提供记录、复盘和下一步建议。
- **功能仓库**: 多个功能并列展示、用户需要自行判断入口优先级的页面状态。

## Requirements

### Requirement 1: Core Product Positioning

**User Story:** AS a parent, I want to understand what the mini program is best at within the first screen, so that I can decide whether to continue using the mini program.

#### Acceptance Criteria

1. WHEN a user opens the home page, the mini program SHALL present one core product claim focused on child bottleneck judgment and next action.
2. WHEN the home page renders the first screen, the mini program SHALL present one primary call to action for starting the first action.
3. WHEN secondary capabilities are displayed, the mini program SHALL group secondary capabilities under the primary flow instead of presenting all capabilities as equal entry points.
4. WHEN copy mentions AI, the mini program SHALL explain AI as a parenting judgment and action assistant based on child context.

### Requirement 2: First Action Flow

**User Story:** AS a parent with a concrete child situation, I want to choose a familiar family scene and get one practical step, so that I can use the suggestion the same day.

#### Acceptance Criteria

1. WHEN a user starts the first action, the mini program SHALL ask for a family scene or current concern before showing long-form content.
2. WHEN a user selects a scene, the mini program SHALL request or infer the child age range before producing a recommendation.
3. WHEN scene and age information are available, the mini program SHALL return a bottleneck judgment and one action suggestion.
4. IF child profile information is missing, the mini program SHALL provide a lightweight profile completion path inside the first action flow.
5. WHEN the action suggestion is shown, the mini program SHALL provide a way to record whether the parent plans to try the suggestion.

### Requirement 3: Home Page Information Hierarchy

**User Story:** AS a returning user, I want the home page to show what I should do next, so that I do not need to compare many feature entrances.

#### Acceptance Criteria

1. WHEN a user has an unfinished action or plan, the home page SHALL prioritize the continuation card above feature modules.
2. WHEN a user has no recent context, the home page SHALL prioritize the first action card.
3. WHEN a user has recent growth records, the home page SHALL show the latest child status summary and next suggested action.
4. WHEN secondary features are shown, the home page SHALL display them as supporting tools under a compact section.
5. WHEN a user enters the home page, the mini program SHALL reduce visible competing entry points in the first two screen heights.

### Requirement 4: Difference From General AI

**User Story:** AS a parent who already uses a general AI tool, I want to see why this mini program is useful, so that I understand the reason to open this mini program again.

#### Acceptance Criteria

1. WHEN the mini program describes its value, the mini program SHALL emphasize child profile, age stage, scenario templates, growth records, and next-step continuity.
2. WHEN a user asks a parenting question, the mini program SHALL use available child context to personalize the answer.
3. WHEN the answer requires daily execution, the mini program SHALL convert the answer into an action card or plan continuation.
4. WHEN the user completes an action, the mini program SHALL save the outcome into growth context for future recommendations.
5. WHEN comparing with open-ended chat behavior, the mini program SHALL guide the user toward structured parenting decisions.

### Requirement 5: Feature Reduction And Reframing

**User Story:** AS a user, I want fewer visible choices and clearer next steps, so that the mini program feels focused and easy to use.

#### Acceptance Criteria

1. WHEN the home page displays existing capabilities, the mini program SHALL classify them into core flow, supporting tools, and account services.
2. WHEN a capability does not support the first action flow, the mini program SHALL move that capability to a lower-priority area or a profile page entry.
3. WHEN content modules are retained, the mini program SHALL expose content through scene-based recommendations and search paths.
4. WHEN a user completes the first action, the mini program SHALL reveal relevant supporting tools based on the result.
5. WHEN feature flags disable a feature, the mini program SHALL keep the main flow readable and actionable.

### Requirement 6: Measurement And Validation

**User Story:** AS the product owner, I want measurable signals for the refactor, so that I can judge whether the new focus improves usage.

#### Acceptance Criteria

1. WHEN a user opens the home page, the system SHALL track home exposure, first action exposure, and first action click.
2. WHEN a user completes the first action, the system SHALL track scene selection, recommendation generation, and action save.
3. WHEN a user returns after completing an action, the system SHALL track continuation card exposure and continuation click.
4. WHEN the refactor is released, the product owner SHALL compare home-to-first-action conversion, recommendation completion rate, next-day return rate, and seven-day return rate.
5. WHEN metrics regress after release, the system SHALL support feature flag rollback of the redesigned home layout.

## Open Questions

1. 核心主张是否采用“先看懂孩子当前卡点，再做今晚第一步”？
2. 第一动作是否优先从“选择家庭场景”开始，而非先做完整测评？
3. 首批聚焦年龄段是否锁定 3-6 岁，兼顾现有 1-3 岁内容入口？
