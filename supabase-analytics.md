# Gratitude App — Supabase 行为数据查询手册

events 表已建好，代码里的 `logEvent()` 自动采集以下事件：

| 事件名 | 说明 | 版本 |
|--------|------|------|
| `session_start` | 用户登录/恢复会话 | V1 + V2 |
| `entry_submitted` | 提交感恩（properties 带 entries_count） | V1 + V2 |
| `history_opened` | 点击历史标签 | V1 + V2 |
| `pwa_install_prompt` | 浏览器弹出安装提示 | V1 + V2 |
| `reunion_opened` | 打开 Reunion 全屏 | V2 |
| `card_generated` | 生成 Polaroid 卡片 | V2 |
| `card_saved` | 保存卡片到相册 | V2 |

---

## 常用查询

在 Supabase → SQL Editor 中粘贴运行即可。

### 1. 今日活跃用户数
```sql
SELECT COUNT(DISTINCT user_id) FROM events
WHERE event = 'session_start' AND created_at::date = CURRENT_DATE;
```

### 2. 功能使用排行（近30天）
```sql
SELECT event, COUNT(*) as cnt FROM events
WHERE created_at > now() - interval '30 days'
GROUP BY event ORDER BY cnt DESC;
```

### 3. 感恩提交频次（谁写了多少天）
```sql
SELECT user_id, COUNT(DISTINCT created_at::date) as active_days
FROM events WHERE event = 'entry_submitted'
GROUP BY user_id ORDER BY active_days DESC;
```

### 4. 每日用户趋势（近30天）
```sql
SELECT created_at::date as day,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events
FROM events
WHERE created_at > now() - interval '30 days'
GROUP BY day ORDER BY day DESC;
```

### 5. V2 卡片功能使用率
```sql
SELECT
  (SELECT COUNT(*) FROM events WHERE event = 'reunion_opened') as reunions,
  (SELECT COUNT(*) FROM events WHERE event = 'card_generated') as cards_generated,
  (SELECT COUNT(*) FROM events WHERE event = 'card_saved') as cards_saved;
```

### 6. PWA 安装提示触发次数
```sql
SELECT COUNT(*) FROM events WHERE event = 'pwa_install_prompt';
```

### 7. 每条感恩写了多少条目（properties.entries_count）
```sql
SELECT properties->>'entries_count' as entries, COUNT(*) as cnt
FROM events WHERE event = 'entry_submitted'
GROUP BY properties->>'entries_count' ORDER BY cnt DESC;
```

### 8. 7日留存率（第1天提交 → 7天内再次提交）
```sql
WITH first_day AS (
  SELECT user_id, MIN(created_at::date) as first_date
  FROM events WHERE event = 'entry_submitted' GROUP BY user_id
),
returned AS (
  SELECT f.user_id
  FROM first_day f
  JOIN events e ON e.user_id = f.user_id AND e.event = 'entry_submitted'
    AND e.created_at::date BETWEEN f.first_date + 1 AND f.first_date + 6
)
SELECT
  COUNT(DISTINCT first_day.user_id) as total_users,
  COUNT(DISTINCT returned.user_id) as retained_users,
  ROUND(COUNT(DISTINCT returned.user_id)::numeric / NULLIF(COUNT(DISTINCT first_day.user_id), 0) * 100, 1) as retention_pct
FROM first_day LEFT JOIN returned ON first_day.user_id = returned.user_id;
```

---

## 直浏览数据

Supabase Dashboard → **Table Editor → events** 可直接查看所有记录，无需写 SQL。

## 注意事项

- RLS 策略让普通用户只能读写自己的数据；SQL Editor 以管理员身份运行，不受 RLS 限制
- 数据需要有人使用才会产生——先自己操作一遍 App，然后跑查询验证
- events 表只记录行为，不记录内容（感恩文本仍然在 entries 表）
