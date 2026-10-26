# 迁移到腾讯云 CloudBase — 方案与工作量评估

> 背景：Supabase 免费项目 `reaoliuszbameeibzjvl` 第二次被自动暂停（DNS ENOTFOUND），所有版本登录失败。
> 目标：迁到国内原生、不暂停、适合商业化的 BaaS；**用户界面零改动**。
> 日期：2026-09-01

---

## 一、结论速览

| 维度 | 结论 |
|------|------|
| 界面/UI | **零改动**（登录页、按钮、卡片、字体全部原样） |
| 登录方式 | CloudBase **原生支持邮箱+密码**，现有流程可保留 |
| 国内访问 | ✅ 原生，无 GFW 问题（对比 Firebase 被墙） |
| 自动暂停 | ❌ 不暂停（按量计费/免费额度，无 7 天回收） |
| 数据安全 | ✅ 行级安全规则（auth.uid 归属校验，等同 Supabase RLS） |
| 成本 | 早期基本在免费额度内；规模化按量计费，预计 <¥30/月（低于 Supabase Pro $25/月） |
| 唯一真坑 | **密码无法迁移**——老用户需重新注册（或改匿名登录） |

---

## 二、能力对照（Supabase → CloudBase）

| 能力 | 现在（Supabase） | 迁移后（CloudBase） | 改动 |
|------|------|------|------|
| 注册 | `SB.signUp(email,password)` | `auth.signUpWithEmailAndPassword({email,password})` | 重写封装 |
| 登录 | `SB.signInWithPassword(email,password)` | `auth.signInWithPassword({email,password})` | 重写封装 |
| 会话 | `SB.getSession()` / JWT | `auth.getLoginState()` / `auth.currentUser` | 重写封装 |
| 登出 | `SB.signOut()` | `auth.signOut()` | 重写封装 |
| 状态监听 | `SB.onAuthStateChange(cb)` | `auth.onLoginStateChanged(cb)` 或轮询 | 重写封装 |
| 写感恩 | `supabase.from('entries').insert(...)` / REST `_api('/rest/v1/entries')` | `db.collection('entries').add({...})` | 重写数据层 |
| 读历史 | `.select().eq('user_id',uid)` | `db.collection('entries').where({user_id:uid}).get()` | 重写数据层 |
| 行为埋点 | `logEvent()` → events 表 | `db.collection('events').add({...})`（或保留 localStorage） | 重写数据层 |
| 权限 | Postgres RLS | CloudBase 数据库安全规则（`auth.uid == resource.user_id`） | 新写规则 |

---

## 三、改动范围（按文件）

代码里**已有 `SB` 抽象封装**（root / v2 / v2-care），v1 用 REST `_api` 封装——这降低了风险：只需重写封装内部，调用点基本不动。

| 文件 | 需改内容 | 量级 |
|------|------|------|
| `index.html`（root） | `SB` 类（auth 5 方法）+ entries 读写 + logEvent | 中 |
| `v2/index.html` | 同上（`SB` 类 + 数据层） | 中 |
| `v2-care/index.html` | 同上（+ AI 设置读取） | 中 |
| `v1/index.html` | REST `_api` 封装 → CloudBase SDK + entries 读写 | 中 |
| `v1-diary/index.html` | auth 封装（数据疑似本地，仅 auth + logEvent） | 小 |
| 全部 | 引入 `@cloudbase/js-sdk`（建议 vendor 到仓库，避免 CDN 依赖）+ 域名白名单 | 小 |

**UI 文件（HTML/CSS/卡片/字体/流程）：一律不动。**

---

## 四、关键风险与坑

1. **密码无法迁移（最重要）**
   - CloudBase 无批量导入；密码哈希不可转移。
   - 老用户必须重新注册，或走「找回密码」流程。
   - 产品早期可接受；若 Supabase 项目已 Deleted（非 Paused），本就无数据可迁。

2. **登录模型建议二选一**
   - **A. 保留邮箱+密码**（CloudBase 支持，UX 不变，但老用户要重注册）
   - **B. 改匿名优先**（CloudBase 匿名登录，用户秒进、零摩擦；想云同步时再绑邮箱）——对感恩日记反而更顺，且天然解决密码迁移问题。
   - 倾向推荐 **B**，但这是产品决策，需你拍板。

3. **Web SDK 域名白名单**
   - CloudBase 浏览器端需在控制台「安全配置」添加 `*.github.io` 域名，否则请求被拒。一次性配置。

4. **安全规则必须写对**
   - `entries` / `events` 集合需规则：`仅当 auth.uid == 记录.user_id 可读写`，否则数据泄露。需测试越权访问。

5. **SDK 加载（国内可达）**
   - 不要把 SDK 放境外 CDN。建议 **vendor 进仓库**（`/vendor/cloudbase.js`），与 GitHub Pages 同源，最稳。

---

## 五、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| P0 环境 | 建 CloudBase 环境、开邮箱/匿名登录、加域名白名单、写安全规则、拿 env ID | 1–2h |
| P1 后端模块 | 写统一 `backend.js`（`CB` 封装：auth 5 方法 + entries CRUD + events），对齐 `SB` 接口 | 3–4h |
| P2 接入 | 替换 root/v2/v2-care 的 `SB` 类；v1 改 REST 封装；v1-diary 改 auth | 3–4h |
| P3 规则+测试 | 安全规则验证（越权测试）、5 版本登录/写/读联调 | 2–3h |
| P4 部署 | 提交 + 同步 gh-pages + 线上回归 | 1h |
| （可选）迁移 | 老用户导入云函数 + 密码重置通知 | 2h |
| **合计** | | **≈ 12–18h（约 2–3 个工作日，含联调）** |

> 注：若采用「统一 `backend.js` 一处封装、各版本引入」的架构（而非每文件各写一遍），未来再换后端只改 1 个文件——也顺手解决了你之前担心的「跨版本重复改」问题。

---

## 六、推荐执行路径

1. 你确认登录模型（邮箱密码 / 匿名优先）。
2. 我先把 `backend.js` 抽象层写好（含 CloudBase 初始化、auth、entries、events）。
3. 逐版本接入并自检（`node --check` + 本地起服务点一遍登录）。
4. 统一提交 + gh-pages 同步。
5. 给你回归清单（每个版本点：登录 → 写 → 关页重开 → 历史读取）。

---

## 七、待你决策

- [ ] 登录模型：保留邮箱密码，还是改匿名优先？
- [ ] 是否要保留老用户数据（决定要不要写迁移云函数 + 密码重置流程）？
- [ ] 确认后我是否直接开工（先建 `backend.js` 抽象层）？
