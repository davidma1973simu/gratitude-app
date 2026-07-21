# Supabase 替代方案对比 — 感恩日记商业化基础设施

> 核心问题：Supabase 免费版 1 周无活动后自动暂停，导致所有版本登录失败
> 目标：找到免费或低成本、不自动暂停、适合商业化的 BaaS
> 日期：2026-07-21

---

## 一、关键发现：谁会自动暂停？

| 平台 | 免费版暂停？ | 条件 | 暂停后数据 | 付费版最低 |
|------|:---:|------|------|------|
| **Supabase** | ⚠️ 是 | 1周无数据库活动 | 保留90天可恢复 | $25/月 |
| **Appwrite** | ⚠️ 是 | 1周无活动 | 可恢复 | $25/月 |
| **Firebase** | ❌ 否 | 永不暂停 | — | Spark免费/Blaze按量 |
| **PocketBase** | ❌ 否 | 自托管，你控制 | — | 服务器费用 |

> **结论：Appwrite 的暂停规则和 Supabase 完全一样，换它不能解决问题。**

---

## 二、四个可行方案详解

### 方案 A：Firebase（推荐 ⭐）

**为什么推荐**：Google 运营，永不暂停，免费额度对感恩日记绰绰有余。

| 特性 | Firebase Spark（免费） |
|------|------|
| 自动暂停 | **永不暂停** |
| Authentication | Email/Password + 社交登录，免费无限 |
| Firestore 存储 | 1 GB |
| Firestore 读取 | 50,000 次/天 |
| Firestore 写入 | 20,000 次/天 |
| Hosting | 可选（1GB存储 + 10GB流量/月） |
| 数据库类型 | NoSQL（文档型） |

**感恩日记的使用量评估**：
- 每用户每天写 1 条感恩 ≈ 1 次写入 + 2-3 次读取
- 1万用户 × 3 次/天 = 30,000 次/天 → **在免费额度内**
- 10万用户 × 3 次/天 = 300,000 次/天 → 需升级到 Blaze（但 Blaze 仍保留免费额度）

**迁移工作量**：
- Supabase 用 PostgreSQL + REST API
- Firebase 用 Firestore + SDK
- 感恩日记的数据模型极简（users / entries / events），NoSQL 完全够用
- 需要改的代码：auth（signUp/signIn）+ 数据读写
- 估计每版本 2-3 小时 × 5 版本 ≈ 10-15 小时

**商业化路径**：
- Spark → Blaze（按量付费，免费额度不变，超出部分按量计费）
- Blaze 1万用户 ≈ $0（免费额度内）
- Blaze 10万用户 ≈ $5-15/月

**缺点**：
- NoSQL 不是 SQL（但感恩日记不需要复杂查询）
- Google 锁定（但 Firebase SDK 可替换）
- 国内访问可能需要考虑网络问题（Firebase 在中国偶尔不稳定）

---

### 方案 B：Supabase Pro（最省事）

**为什么考虑**：零迁移成本，只改账单。

| 特性 | Supabase Pro |
|------|------|
| 自动暂停 | **永不暂停** |
| 数据库 | PostgreSQL 8 GB |
| MAU | 100,000 |
| 带宽 | 250 GB/月 |
| 日备份 | 7天 |
| 价格 | $25/月 ≈ ¥180/月 ≈ ¥2160/年 |

**优点**：
- 零迁移——所有代码不动
- PostgreSQL（SQL 查询、复杂关联都可以）
- Open source，可自托管

**缺点**：
- $25/月对于早期产品是固定成本
- 如果 0 收入，每年 ¥2160 是纯支出

**适合什么时候**：
- 已经开始有收入（哪怕 V3-Pro ¥12/年 × 1000人 = ¥12000/年）
- 或者你觉得 $25/月不是问题

---

### 方案 C：PocketBase + VPS（最省钱）

**为什么考虑**：完全掌控，永不暂停，成本极低。

| 特性 | PocketBase 自托管 |
|------|------|
| 自动暂停 | **永不暂停**（你控制服务器） |
| 数据库 | SQLite（嵌入式，性能优秀） |
| Auth | Email/Password + 15+ OAuth |
| Admin UI | 内置管理后台 |
| 文件存储 | 内置 |
| 价格 | 服务器费用 ≈ $4-5/月 |

**推荐 VPS 选择**：

| VPS | 最低价格 | 说明 |
|------|------|------|
| Hetzner CAX11 | €3.29/月 | 2vCPU, 4GB RAM, 德国 |
| Vultr | $2.5/月 | 1vCPU, 512MB RAM |
| DigitalOcean | $4/月 | 1vCPU, 512MB RAM |

**迁移工作量**：
- PocketBase 有 JS SDK，API 风格类似 Supabase（collection-based）
- 但 API 调用方式不同，需要改每个版本
- 需要设置服务器 + SSL + 域名
- 估计 2-3 小时/版本 × 5 + 2小时服务器设置 ≈ 15 小时

**优点**：
- 完全掌控数据
- 成本极低（$4-5/月 vs Supabase $25/月）
- 单 Go 二进制，运维极简
- SQLite 性能超过 PostgreSQL（读操作）

**缺点**：
- 需要自己管服务器（备份、升级、安全）
- SQLite 单机，不能横向扩展（但感恩日记不需要）
- 需要域名 + SSL（Let's Encrypt 免费）

---

### 方案 D：Supabase Free + 心跳保活（临时方案）

**思路**：用定时任务每天请求一次 Supabase API，防止被判定为"无活动"而暂停。

| 特性 | 心跳方案 |
|------|------|
| 成本 | ¥0 |
| 迁移 | 无 |
| 可靠性 | ⚠️ 不100%（Supabase 可能改暂停规则） |

**实现方式**：
- 用 WorkBuddy 自动化任务，每天请求一次 Supabase health endpoint
- 或者在代码里加一个 `setInterval` 每6小时请求一次

**优点**：零成本、零迁移

**缺点**：
- 如果心跳失败（比如服务器维护），可能还是被暂停
- Supabase 可能随时改暂停规则
- 90天暂停后数据删除——这是个风险
- **不适合商业化产品**

---

## 三、方案对比总结

| 维度 | Firebase ⭐ | Supabase Pro | PocketBase+VPS | 心跳保活 |
|------|:---:|:---:|:---:|:---:|
| 暂停风险 | 无 | 无 | 无 | ⚠️ 有 |
| 迁移成本 | 中（10-15h） | 无 | 中（15h） | 无 |
| 月成本 | $0→$5-15 | $25 | $4-5 | $0 |
| 国内可用性 | ⚠️ 偶尔不稳定 | ✅ 正常 | ✅ 自选服务器 | ✅ 正常 |
| 商业化适配 | ✅ Blaze按量 | ✅ Pro固定 | ✅ 完全掌控 | ❌ 不适合 |
| 数据库 | NoSQL | PostgreSQL | SQLite | PostgreSQL |
| 扩展性 | 强（Google全球） | 强 | 单机 | — |

---

## 四、我的建议

### 短期（现在）：方案 D 心跳保活

你现在刚恢复了 Supabase，加个心跳保活是最快的，不改任何代码。

### 中期（商业化启动时）：方案 A Firebase 或 方案 B Supabase Pro

**如果国内用户为主** → Supabase Pro（$25/月，国内访问稳定）
**如果海外用户也多** → Firebase（免费永不暂停，但国内偶有不稳定）
**如果想最低成本+完全掌控** → PocketBase + Hetzner（$4/月）

### 决策树：

```
你愿意每月花 $25？
  → 是：Supabase Pro（零迁移，最稳）
  → 否：
    → 你能接受 NoSQL + 偶尔国内不稳定？
      → 是：Firebase（免费永不暂停）
      → 否：PocketBase + $4/月 VPS（完全掌控）
```

---

## 五、如果选 Firebase，迁移需要改什么？

感恩日记目前用 Supabase 的部分：

| 功能 | Supabase API | Firebase 替代 |
|------|------|------|
| 注册 | `supabase.auth.signUp({email, password})` | `firebase.auth().createUserWithEmailAndPassword()` |
| 登录 | `supabase.auth.signIn({email, password})` | `firebase.auth().signInWithEmailAndPassword()` |
| Token | `supabase.auth.session()` | `firebase.auth().currentUser` |
| 写入 | `supabase.from('entries').insert({...})` | `firebase.firestore().collection('entries').add({...})` |
| 读取 | `supabase.from('entries').select().eq(...)` | `firebase.firestore().collection('entries').where(...).get()` |
| 事件 | `supabase.from('events').insert({...})` | `firebase.firestore().collection('events').add({...})` |

数据模型映射：
- `users` → Firebase Auth（内置，不需要单独表）
- `entries` → Firestore `entries` collection（文档型，字段一样）
- `events` → Firestore `events` collection

---

## 六、如果选 PocketBase，迁移需要改什么？

| 功能 | Supabase API | PocketBase 替代 |
|------|------|------|
| 注册 | `supabase.auth.signUp()` | `pb.collection('users').create()` + `pb.authStore.save()` |
| 登录 | `supabase.auth.signIn()` | `pb.collection('users').authWithPassword()` |
| Token | `supabase.auth.session()` | `pb.authStore.token` |
| 写入 | `supabase.from('entries').insert()` | `pb.collection('entries').create()` |
| 读取 | `supabase.from('entries').select().eq()` | `pb.collection('entries').getList()` / `.getFirstListItem()` |

需要额外：
- 设置 PocketBase 服务器
- 在 Admin UI 创建 collections（users, entries, events）
- 配置域名 + SSL
- 设置 Litestream 备份（可选）

---

## 七、补充：国内网络问题

如果目标用户在中国大陆：

| 平台 | 国内访问 | 说明 |
|------|------|------|
| Supabase | ✅ 正常 | 服务器在亚太区域 |
| Firebase | ⚠️ 偶尔不稳定 | Google 服务在中国受限 |
| PocketBase（自选服务器） | ✅ 正常 | 可以选亚太VPS |

**如果用户在中国**，Firebase 不是最优选择，PocketBase 或 Supabase Pro 更合适。

---

> **下一步**：你决定选哪个方案后，我来做迁移。建议先加心跳保活（方案D），同时你考虑商业化阶段选哪个长期方案。
