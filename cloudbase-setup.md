# 腾讯云 CloudBase 控制台设置指南（迁移用）

> 配套文件：`backend.js`（统一后端封装）、`vendor/cloudbase.js`（本地化 SDK）
> 适用版本：先以 V2 为样板，跑通后再复制到 v1 / v1-diary / v2-care / index
> 状态：代码已就绪，等你完成以下步骤并给 env ID 即可上线

---

## 一、控制台操作步骤（约 10 分钟）

### 1. 创建环境
- 打开 https://console.cloud.tencent.com/tcb
- 「新建环境」→ 环境名称随意（如 `gratitude-app`）→ **计费模式选「按量计费」**（有免费额度，不自动暂停）
- 创建后进入环境，左上角「环境 ID」复制下来（形如 `gratitude-app-1gabcdef`）

### 2. 开启匿名登录
- 环境内 → **「登录授权」** → 打开 **「匿名登录」** 开关
- （可选）后期若要做「绑邮箱云同步」，再开「邮箱登录」

### 3. 添加域名白名单（关键，否则浏览器端请求被拒）
- 环境内 → **「安全配置」** → 「Web 安全域名」→ 添加：
  - `https://davidma1973simu.github.io`
  - （本地调试用）`http://localhost`
- 注意：必须是**部署后的真实 origin**，否则 `signInAnonymously` 会报安全域名错误

### 4. 建集合（数据库）
- 环境内 → **「数据库」** → 新建集合：
  - `entries`（感恩记录）
  - `events`（行为埋点）
- 字段无需预定义（文档库 schemaless），首条写入自动建索引

### 5. 粘贴数据库安全规则（防越权）
- 「数据库」→ 某集合 → **「安全规则」** → 粘贴下方规则（两个集合各贴一次）：

```json
{
  "read":  "auth.uid == doc.user_id",
  "write": "auth.uid == doc.user_id"
}
```

> 说明：规则要求「只有登录用户本人能读写自己 user_id 的记录」。匿名用户的 `auth.uid` 即其匿名身份，归属感正确。
> 若控制台提示语法不符，以控制台实时校验为准（不同版本表述可能为 `resource.user_id`，按提示微调即可）。

### 6. 填入环境 ID
- 把 `gratitude-app/backend.js` 第一行的：
  ```js
  const CB_ENV = 'REPLACE_WITH_ENV_ID';
  ```
  改成你的环境 ID：
  ```js
  const CB_ENV = 'gratitude-app-1gabcdef';
  ```

---

## 二、数据模型（与旧 Supabase 对齐，调用点零改）

**entries 集合**（每条记录 = 某用户某一天）：
```
{
  user_id:  "匿名用户uid",
  date:     "2026-09-01",
  content1: "今天同事帮我递了文件",
  content2: "晚饭很好吃",
  content3: "天气终于凉快了"
}
```
- 读取：`db.collection('entries').where({user_id}).orderBy('date','desc').get()`
- 写入：先按 `user_id+date` 查，有则 `doc(_id).update`，无则 `add`（CloudBase 无原生 upsert）

**events 集合**（埋点）：
```
{ user_id, event: "entry_submitted", properties: {...}, ts: "ISO时间" }
```

---

## 三、部署与验证

1. 填好 env ID 后，提交并同步：
   ```
   git push origin main && git push origin main:gh-pages --force
   ```
2. 打开 https://davidma1973simu.github.io/gratitude-app/v2/
3. 预期：加载后**自动匿名登录**（无登录表单），可直接写感恩 → 刷新页面数据仍在（云端）
4. 验证清单：
   - [ ] 打开页面 2 秒内自动进入，无邮箱/密码表单
   - [ ] 写 1 条感恩 → 提交 → 刷新页面 → 记录仍在（证明云端读写成功）
   - [ ] 控制台「数据库 → entries」能看到刚写的记录，且 `user_id` 非空
   - [ ] 「安全规则」生效：用另一个浏览器/隐身窗口写的数据，在前窗口读不到

---

## 四、待你提供
- [ ] **CloudBase 环境 ID**（步骤 1 复制）
- [ ] 确认已开启「匿名登录」+ 白名单已加 `github.io`
- 给齐后我填 env ID、部署，并把验证清单发你逐项确认。
