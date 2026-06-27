# 需求实施计划

- [x] 1. 后端扩展留存接口鼓励字段
  - [x] 1.1 实现鼓励状态计算逻辑
  - [x] 1.2 新增鼓励确认接口

- [x] 2. 创建鼓励弹窗组件
  - [x] 2.1 新建 `miniprogram/components/encouragement-popup/` 组件
  - [x] 2.2 为鼓励弹窗组件编写单元测试

- [x] 3. 首页集成鼓励弹窗
  - [x] 3.1 在首页引入鼓励弹窗组件并接入触发展示
  - [x] 3.2 实现鼓励弹窗关闭后的确认上报
  - [x] 3.3 为首页鼓励弹窗触发逻辑编写单元测试

- [x] 4. 检查点 - 确保 lint 通过
  - `node --check` + `npm run lint` 后端 57 文件 + 小程序 43 文件全部通过

- [x] 5. 实现文章阅读注解
  - [x] 5.1 在文章详情页实现阅读完成检测
  - [x] 5.2 实现注解触发概率和频率控制
  - [x] 5.3 实现注解 UI 展示和关闭逻辑
  - [x] 5.4 为文章注解逻辑编写单元测试

- [x] 6. 检查点 - 全链路校验
  - `npm run lint` 全部通过
  - 未登录不弹窗（guest state show_encouragement=false）
  - 同日不重复弹（event_tracks encouragement_shown + CURDATE()）
  - 安全模式不触发（startupSafeMode return early）

- [x] 7. 测试审计收口
  - 执行根目录 `npm run lint`：后端 57 文件 + 小程序 43 文件全部通过
  - 执行定向 `node --check`：`server.js`、首页、文章详情页、鼓励弹窗组件全部通过
  - 修正文章阅读 70% 判定，改为 `scrollTop + viewportHeight >= pageHeight * 0.7`
  - 新增 `npm test` 覆盖鼓励弹窗 level、首页触发状态和文章注解概率/频率规则
