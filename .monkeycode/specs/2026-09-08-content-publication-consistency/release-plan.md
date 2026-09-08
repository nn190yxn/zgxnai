# 内容发布修复上线清单

核对时间：2026-09-08。业务代码基线：c5aca1d。

## 已验证

- 生产 Node.js v20.20.2，可解析新版 server.js；express、mysql2/promise、jsonwebtoken、cors、helmet、morgan 可解析。
- 生产 `/api/v1/health` 返回正常的 niuniu-backend 响应。
- 静态运行依赖及后台资源清单共 41 个文件，其中 30 个一致、9 个内容变化、2 个新增文件缺失。
- 生产运营迁移定义文件与当前工作区一致；生产数据库实际已应用迁移状态仍须核对。
- 差异文件可匹配仓库历史版本。生产食谱与工作区均 600 条，ID 集合一致；40 条存在食材、标题、描述或营养字段差异。本次保留生产食谱文件，540 条适龄食谱均通过新版编辑字段校验。
- 生产 package.json 的依赖声明保持一致，差异为命令脚本；本次保留生产 package.json。

## 最小同步清单

目标根目录：`/home/ubuntu/niuniu-parenting`。仅以下 9 个文件纳入发布。

| 文件 | 目标 SHA-256 |
| --- | --- |
| admin-portal/app.js | 1f119908cbcb717b1a540102836c18cee0049d13c54608597cabd5b309642d67 |
| admin-portal/modules/operations.js | f27d52d970e79bec86bdcbc54155d365f4a43b0f470a4d682d8c2826c3d71d73 |
| backend/src/mysql-production/admin-access.js | df64cdb550fc2fea37289efe8bbbc457efcef517abc831afacf9c52e94bbb4dd |
| backend/src/mysql-production/content-publishing.js | 502ebe8faa9eec6eecace015996c3e32595b7d8c76c2090763644b0ec92e3237 |
| backend/src/mysql-production/knowledge-content.js | 9790d992e8fb12b963af1d8b42704d86d007efc043c15dff64421e2c859fe3ad |
| backend/src/mysql-production/managed-editing.js | 56990e7394b2ce62ec2684f2e2b6cdffa8a9ae855883345c01d6eb36f00fa49d |
| backend/src/mysql-production/platform-routes.js | 9889baaed47e747affb9664b2ed7f296051e02a0491183b56ec5f24518907fb2 |
| backend/src/mysql-production/recipe-content.js | ce339603caeb1f44a723f8563203232a96c39d717133ffb09a1520ba9e52d341 |
| backend/src/mysql-production/server.js | 6ad3b25348af76418a867ce764c934b0e173086d30f524dce1ab30f74b98c0be |

managed-editing.js、recipe-content.js 为新增文件。其余 7 个文件先备份。后台 app.js 包含登录后刷新运营模块的历史修复；admin-access.js 包含编辑与数据运营角色的 Banner 能力声明。

发布前必须重新核对以下生产原始 SHA-256；两个新增文件应继续保持缺失状态。任何一项变化都需要重新比较。

| 文件 | 生产原始 SHA-256 |
| --- | --- |
| admin-portal/app.js | 321a5ef90920a57c0dbbba32ba608c8ebde7bd485f9a330ed183546c59694234 |
| admin-portal/modules/operations.js | b2f232f689a20da95402cb8f2469fae5a8dcb998cb4b7a6408d8e027b483add6 |
| backend/src/mysql-production/admin-access.js | 57f54010282b25daa232213fd4ad3e4b98caee660b90d29d9ce17604d22d42e2 |
| backend/src/mysql-production/content-publishing.js | b25882a7f601d94d172490454a7ea7232527901d5c69259fc221705faf6ee38b |
| backend/src/mysql-production/knowledge-content.js | 265b28a8e99466e70c448cf4ce0db49dfb6db23f03de8e5d95b4f23fec4a4a27 |
| backend/src/mysql-production/platform-routes.js | d843557f28e0afe0c702c07a75ea4befe00b64efa0e0c29bc51e91c6d7ab8112 |
| backend/src/mysql-production/server.js | acfaeb44a13b6e8e3c3f1f3e6557cca9926c257170bbdd4870d6a64c9494683e |

## 执行顺序

1. 取得生产备份、文件同步和 niuniu-backend 重启授权。
2. 再次核对生产目标文件校验值，出现新差异时重新比较。
3. 在 `backups/content-publication-c5aca1d-<timestamp>/` 保存 7 个旧文件、文件校验清单及当前 PM2 启动信息；数据库备份使用项目既有连接配置和 `--no-tablespaces`，备份结果仅存生产备份目录。
4. 核对 schema_migrations 的已应用状态、关键表列和后台功能开关。异常时停止发布并保留当前进程。
5. 上传 9 个文件至同目录暂存区域，校验 SHA-256，再替换目标文件。完成替换后只重启 niuniu-backend。
6. 检查启动、迁移、健康接口及已知公开知识路由；确认后台静态资源内容一致。
7. 管理员使用既有账号验收登录、文章草稿、训练及食谱编辑。正式内容写入验收需单独选定测试内容与恢复方案。真机验收由用户侧微信开发者工具或设备完成。

## 回滚

若进程启动或健康验证失败，恢复备份中的 7 个旧文件，把两个新增文件移动至备份隔离目录，只重启 niuniu-backend，再次验证健康接口。本轮目标迁移文件相同；若发现启动会应用额外迁移，先补充数据库恢复方案。数据库恢复属于独立操作，禁止自动覆盖生产数据。

## 当前状态

本轮 `npm test` 全部通过，其中 pretest 包括 57 条文章请求用例、UI 状态回归及 16 项 Node 测试（包含新增发布清单测试）。`npm run lint` 通过后端 88 个文件、小程序 66 个文件的语法检查。

用户确认生产操作后，已完成备份、9 个文件同步和 niuniu-backend 重启。生产 schema_migrations 的 6 项迁移均为 applied，checksum 与部署定义一致；6 张关键表字段检查通过，本次无需应用新增迁移。数据库包含 63 张 InnoDB 表。

## 发布结果

- 发布业务版本：c5aca1d；发布准备提交：e1776df。
- 服务重启时间：2026-09-08 15:07:31 UTC（北京时间 23:07:31）。
- 备份目录：`/home/ubuntu/niuniu-parenting/backups/content-publication-e1776df-20260908-01/`。
- 备份内容：7 个原始文件、仅含必要进程信息的清单，以及 `niuniu_parenting.sql`。数据库备份大小 15,296,344 字节，SHA-256 为 `bdd80da9111a0b34e7696fe0d1537c436dd459b4da7151b76d9bac88fc3f2027`；63 个建表定义及导出完成标记已核对。
- 同步后再次校验 41 个文件：9 个目标文件符合本方案目标 hash，其余文件符合生产原始 hash。生产食谱 JSON 和 backend/package.json 保留原版本。
- PM2 重启次数由 117 增至 118，后续复核保持 118；进程 online，启动后 startup 类告警为 0，本地健康接口通过。
- 三个开关均为 true：server_content_read_enabled、miniprogram_remote_content_enabled、admin_content_write_enabled。
- 公网 11 项 GET 验收通过：health、runtime/config、knowledge/contents、knowledge/ability-content、pain-points、nutrition/recipes、已有食谱详情、home/banners，以及后台 index.html、app.js、modules/operations.js。两个知识接口携带 schema_version: 1，三个后台文件均与工作区 SHA-256 一致。
- 以上操作仅针对小牛育儿部署目录、niuniu_parenting 数据库和 niuniu-backend 进程。

后台账号登录、生产内容编辑/审核/发布操作，以及小程序真机验收仍待完成。本轮公网验收仅调用已知公开 GET 接口。
