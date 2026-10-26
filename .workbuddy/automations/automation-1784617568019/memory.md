# Supabase 心跳保活 - 执行记录

## 2026-09-02 11:13 (GMT+7)
- **状态：❌ 失败（连续 35 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `curl` → HTTP_CODE:000 / exit 6 / 0.005s（DNS 解析失败，未到达服务器）
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 35 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-09-01 10:00 (GMT+7)
- **状态：❌ 失败（连续 34 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `curl` → HTTP_CODE:000 / exit 6 / 0.004s（DNS 解析失败，未到达服务器）
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 34 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-31 10:00 (GMT+7)
- **状态：❌ 失败（连续 33 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `curl` → HTTP_CODE:000 / 0.004s（DNS 解析失败，未到达服务器）
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 33 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-31 09:01 (GMT+7)
- **状态：❌ 失败（连续 32 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `curl` → HTTP_CODE:000 / 0.009s（DNS 解析失败，未到达服务器）
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 32 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-28 10:01 (GMT+8)
- **状态：❌ 失败（连续 29 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `curl` → HTTP_CODE:000 / libcurl 35 (`SSL_ERROR_SYSCALL`) / 7.97s timeout
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 29 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-27 10:45 (GMT+8)
- **状态：❌ 失败（连续 28 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- `curl` 返回 `SSL_ERROR_SYSCALL`（HTTP_CODE:000，443 端口 4s 后连接失败）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 28 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-23 10:01 (GMT+8)
- **状态：❌ 失败（连续 24 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- `curl` 返回 HTTP_CODE:000，443 端口无法连接
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 24 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-21 10:14 (GMT+8)
- **状态：❌ 失败（连续 22 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- `curl` 返回 `SSL_ERROR_SYSCALL`（HTTP_CODE:000，443 端口无法连接）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 22 天未恢复**：强烈建议迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-20 10:25 (GMT+8)
- **状态：❌ 失败（连续 21 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- `curl` 返回 `SSL_ERROR_SYSCALL`（HTTP_CODE:000，443 端口无法连接）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore
- **第 21 天未恢复**：建议考虑迁移到 Vercel + Neon / Cloudflare D1 / 或将项目升 Pro tier 避免再次被暂停

## 2026-08-19 10:17 (GMT+8)
- **状态：❌ 失败（连续 20 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- `curl` 返回 HTTP_CODE:000，连接 443 端口超时（10s）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-18 10:55 (GMT+8)
- **状态：❌ 失败（连续 19 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short` Google 8.8.8.8 + Cloudflare 1.1.1.1 均无 A 记录返回（空）
- `curl` 返回 `SSL_ERROR_SYSCALL`（HTTP_CODE:000，443 端口无法连接）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-16 09:50 (GMT+8)
- **状态：❌ 失败（连续 17 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `nslookup` 返回 NXDOMAIN（上海电信 DNS 202.96.209.133 确认）
- `curl` 返回 SSL_ERROR_SYSCALL，443 无法连接
- 父域 `supabase.co` 正常解析，仅该项目 DNS 被清除
- 项目仍处于暂停状态，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-14 10:47 (GMT+8)
- **状态：❌ 失败（连续 15 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- 父域 `supabase.co` 正常解析（76.76.21.21），仅该项目 DNS 被清除
- `curl` 返回 SSL_ERROR_SYSCALL（HTTP_CODE:000，443 无法连接）
- 项目仍处于暂停状态，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-13 10:20 (GMT+8)
- **状态：❌ 失败（连续 14 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig +short @8.8.8.8` + `@1.1.1.1` 均无 A 记录返回（空）
- `curl` 返回 SSL_ERROR_SYSCALL（HTTP_CODE:000，443 端口无法连接）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-12 17:12 (GMT+8)
- **状态：❌ 失败（连续 12 天失败，07-31 起持续）**
- WebFetch 报 fetch failed
- `dig` Google DNS (8.8.8.8) + Cloudflare DNS (1.1.1.1) 均无 A 记录返回（空）
- `curl` 超时（10s timeout, HTTP_CODE:000）
- 项目仍处于暂停状态，DNS 记录被清除，保活任务无法恢复
- **必须用户手动操作**：登录 Supabase Dashboard → 找到项目 → Resume/Restore

## 2026-08-11 10:52 (GMT+8)
- **状态：❌ 失败（连续 11 天失败）**
- WebFetch 报 fetch failed，HTTP 请求无法到达实例
- `dig +short reaoliuszbameeibzjvl.supabase.co @8.8.8.8` → 无返回（空）
- `dig +short reaoliuszbameeibzjvl.supabase.co @1.1.1.1` → 无返回（空）
- 项目 DNS 记录仍不存在，Supabase 暂停状态未解除
- **结论：保活任务无法恢复已暂停项目，必须用户手动操作**
- **建议**：登录 https://supabase.com/dashboard → 找到项目 `reaoliuszbameeibzjvl` → 点击 Resume / Restore

## 2026-08-10 09:50 (GMT+8)
- **状态：❌ 失败（连续 10 天失败）**
- WebFetch 报 fetch failed
- `dig` Google DNS + Cloudflare DNS 均无 A 记录返回，NXDOMAIN
- 父域 `supabase.co` 正常解析（`76.76.21.21`），仅该项目 DNS 被清除
- 项目仍处于暂停状态，保活任务无法恢复
- **必须用户手动去 Supabase Dashboard 恢复项目**

## 2026-07-31 10:01 (GMT+8)
- **状态：❌ 失败**
- Health endpoint 无法访问
- DNS 查询返回 NXDOMAIN（Google 8.8.8.8 + Cloudflare 1.1.1.1 均确认）
- 项目 URL `reaoliuszbameeibzjvl.supabase.co` 的 DNS 记录已不存在
- 项目可能已被暂停或删除
- **需要用户手动去 Supabase Dashboard 检查并恢复项目**

## 2026-08-02 10:01 (GMT+8)
- **状态：❌ 失败**
- Health endpoint 无法访问
- DNS 查询返回 NXDOMAIN（上海电信 DNS 202.96.209.133 确认）
- `dig +short reaoliuszbameeibzjvl.supabase.co @8.8.8.8` 无返回
- `curl` 返回 `SSL_ERROR_SYSCALL`，无法建立连接
- 项目仍处在暂停/不可解析状态
- **需要用户手动去 Supabase Dashboard 检查并恢复项目**

## 2026-08-04 10:07 (GMT+8)
- **状态：❌ 失败**
- Health endpoint 无法访问（fetch failed）
- `dig +short reaoliuszbameeibzjvl.supabase.co @8.8.8.8` DNS 无返回
- 域名 DNS 记录仍然不存在，项目持续处于暂停状态
- **需要用户手动去 Supabase Dashboard 恢复项目**

## 2026-08-05 10:12 (GMT+8)
- **状态：❌ 失败（连续 6 天失败，07-31 / 08-02 / 08-04 / 08-05）**
- Health endpoint 无法访问（WebFetch fetch failed + curl SSL_ERROR_SYSCALL）
- DNS 查询（Google 8.8.8.8 + Cloudflare 1.1.1.1）均无 A 记录返回
- `dig` 仅显示 supabase.co 父域 SOA，子域名仍无解析
- 项目连续多日处于暂停/不可解析状态
- **必须用户手动操作才能恢复（保活任务无能为力）**

## 2026-08-07 09:57 (GMT+8)
- **状态：❌ 失败（连续多天失败，07-31 / 08-02 / 08-04 / 08-05 / 08-07）**
- WebFetch 报 fetch failed
- `curl` 返回 `SSL_ERROR_SYSCALL`（连接 443 端口失败）
- `host` / `dig` 均返回 NXDOMAIN，DNS 记录不存在
- 项目仍处于暂停状态，保活任务无法恢复
- **需要用户手动去 Supabase Dashboard 恢复项目**

## 2026-08-08 15:37 (GMT+8)
- **状态：❌ 失败（连续多天失败，已持续 7 天以上）**
- WebFetch 报 fetch failed
- `curl` 返回 `Could not resolve host: reaoliuszbameeibzjvl.supabase.co` (exit code 6, NXDOMAIN)
- 多 DNS 解析均无 A 记录返回：
  - Google DNS `8.8.8.8` → 空
  - Cloudflare DNS `1.1.1.1` → 空
- 父域 `supabase.co` 正常解析（`76.76.21.21`）→ Supabase 平台服务正常，仅该项目 DNS 被清除
- **结论**：这是 Supabase 暂停非活跃项目的典型表现——项目特定 DNS 记录被删除
- **必须用户手动操作**：登录 Supabase Dashboard → 找到该项目 → 恢复/恢复配额
- **保活任务的局限**：DNS 记录未恢复前，任何外部 HTTP 请求都到不了实例，保活任务完全无效
- **建议下一步**：考虑改用其他方式（迁移到 Vercel + Neon / 切换到 Cloudflare D1 / Supabase 恢复后立即配置为 Pro tier 避免再次暂停）
