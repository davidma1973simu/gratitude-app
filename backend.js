/* backend.js — 统一后端（腾讯云 CloudBase，匿名优先）
 * 替换原 SB（Supabase）封装，接口保持一致，调用点几乎不动。
 * 必须在 index.html 中先于本文件加载 vendor/cloudbase.js（挂在 window.cloudbase）。
 *
 * ── LOCAL MODE（本地模式）──
 * CloudBase 环境被暂停 / 未付费 / 无法连接时，把「登录鉴权层」整个摘掉：
 *   • 启动直接进入应用，不再弹登录页
 *   • 数据读写改走 localStorage（grat_entries_local / grat_events_local）
 * 恢复云端：把下方 LOCAL_MODE 改回 false 即可，其余逻辑不变。
 */

(function () {
  // TODO: 部署前替换为你的 CloudBase 环境 ID（控制台「环境」页查看）
  const CB_ENV = 'eureka-8g0iymqr969c1b32';

  // ── 第三方 OAuth 身份源（微信 / 谷歌）──
  const OAUTH = {
    wechatProviderId: '',   // 例：'wechat-web' 或控制台给出的 providerId
    googleProviderId: '',   // 例：'google-web'
  };

  // ★★★ 本地模式总开关 ★★★
  //   true  = 摘掉云鉴权，纯本地运行（无需 CloudBase，数据存浏览器）
  //   false = 走 CloudBase（需环境已付费且配置好登录方式）
  const LOCAL_MODE = true;

  const LOCAL_USER = { id: 'local', email: '', username: '' };
  const LOCAL_SESSION = { user: LOCAL_USER };
  const LS_ENTRIES = 'grat_entries_local';
  const LS_EVENTS = 'grat_events_local';

  function _lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function _lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  const CB = {
    _tokens: null,
    _listeners: [],
    _app: null,
    _auth: null,
    _db: null,
    OAUTH: OAUTH,

    _init() {
      if (LOCAL_MODE) return;            // 本地模式：完全不碰 CloudBase
      if (this._app) return;
      if (!window.cloudbase) throw new Error('CloudBase SDK 未加载（请先引入 vendor/cloudbase.js）');
      this._app = window.cloudbase.init({ env: CB_ENV });
      // 显式 local 持久化：匿名登录态写 localStorage，刷新后仍是同一匿名用户
      const auth = (typeof this._app.auth === 'function') ? this._app.auth({ persistence: 'local' }) : this._app.auth;
      this._auth = auth;
      this._db = (typeof this._app.database === 'function') ? this._app.database() : this._app.database;
    },

    // 读取当前登录态（匿名或已绑定），并同步 _tokens
    async _loginState() {
      try { this._init(); } catch (e) { return null; }
      try {
        const state = await this._auth.getLoginState();
        if (state && state.user) {
          const u = state.user;
          this._tokens = { access_token: 'anon', user: { id: u.uid, email: u.email || '', username: u.username || '' } };
          return this._tokens;
        }
      } catch (e) { console.warn('getLoginState error:', e); }
      this._tokens = null;
      return null;
    },

    // 匿名优先：内部同 ensureSession，无会话自动匿名登录
    async ensureSession() {
      if (LOCAL_MODE) { this._notify('SIGNED_IN', LOCAL_SESSION); return LOCAL_SESSION; }
      let s = await this._loginState();
      if (!s) {
        try { await this._auth.signInAnonymously(); } catch (e) { console.error('匿名登录失败:', e); }
        s = await this._loginState();
      }
      if (s) this._notify('SIGNED_IN', s);
      return s;
    },

    // 仅恢复已有会话（localStorage / getLoginState），不自动创建匿名用户
    async restoreSession() {
      if (LOCAL_MODE) return LOCAL_SESSION;
      return this._loginState();
    },

    // 显式匿名登录（用户点击「匿名开始」时调用）
    async anonymousLogin() {
      if (LOCAL_MODE) return LOCAL_SESSION;
      this._init();
      try { await this._auth.signInAnonymously(); } catch (e) { console.error('[CB] 匿名登录失败:', e); throw e; }
      const s = await this._loginState();
      if (s) this._tokens = s;
      return s;
    },

    async getSession() {
      if (LOCAL_MODE) return LOCAL_SESSION;
      return this._loginState();
    },

    onAuthStateChange(cb) { this._listeners.push(cb); },
    _notify(event, session) { this._listeners.forEach(fn => { try { fn(event, session); } catch (e) {} }); },

    async signOut() {
      if (LOCAL_MODE) { this._tokens = null; this._notify('SIGNED_OUT', null); return; }
      try { await this._auth.signOut(); } catch (e) {}
      this._tokens = null;
      this._notify('SIGNED_OUT', null);
    },

    // ── 邮箱 / OAuth 登录方法 ──
    // 本地模式下登录页不会再出现，这些方法不会被触发；
    // 保留为安全 no-op（返回本地会话），避免任何误调路径崩溃。
    _pendingVerify: null,
    async sendEmailCode() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },
    async verifyEmailCode() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },
    async signInWithEmailAndPassword() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },
    async signInWithOAuth() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },
    async verifyOAuth() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },
    async linkIdentity() { if (LOCAL_MODE) return LOCAL_SESSION; this._init(); throw new Error('NOT_IMPLEMENTED_IN_LOCAL'); },

    // ── 数据层：本地模式走 localStorage，云端模式走 CloudBase ──

    // 读取某用户全部感恩记录（每天一条；本地模式直接读 localStorage）
    async getEntries(userId) {
      if (LOCAL_MODE) {
        const obj = _lsGet(LS_ENTRIES, {});
        return Object.keys(obj)
          .sort((a, b) => b.localeCompare(a))
          .map(date => {
            const d = obj[date];
            return { date, content1: d.content1 || '', content2: d.content2 || '', content3: d.content3 || '' };
          });
      }
      this._init();
      try {
        const res = await this._db.collection('grat_entries').where({ _openid: userId }).get();
        if (res && res.data) {
          const latestByDate = {};
          res.data.forEach(doc => {
            const d = doc.date;
            if (!d) return;
            if (!latestByDate[d] || (doc.createdAt || 0) > (latestByDate[d].createdAt || 0)) {
              latestByDate[d] = doc;
            }
          });
          return Object.keys(latestByDate)
            .sort((a, b) => b.localeCompare(a))
            .map(date => {
              const doc = latestByDate[date];
              return { date, content1: doc.content1 || '', content2: doc.content2 || '', content3: doc.content3 || '' };
            });
        }
      } catch (e) { console.error('[CB] getEntries error:', e); }
      return [];
    },

    // 写入/更新某天的感恩（本地模式直接写 localStorage，按日期覆盖）
    async upsertEntry(userId, date, c1, c2, c3) {
      if (LOCAL_MODE) {
        const obj = _lsGet(LS_ENTRIES, {});
        obj[date] = { content1: c1 || '', content2: c2 || '', content3: c3 || '', createdAt: Date.now() };
        _lsSet(LS_ENTRIES, obj);
        console.log('[LOCAL] upsertEntry OK:', date);
        return;
      }
      this._init();
      try {
        await this._db.collection('grat_entries').add({
          _openid: userId,
          user_id: userId,
          date,
          content1: c1 || '',
          content2: c2 || '',
          content3: c3 || '',
          createdAt: Date.now()
        });
        console.log('[CB] upsertEntry OK:', userId, date);
      } catch (e) {
        console.error('[CB] upsertEntry FAILED:', (e && e.message) || e, e);
        throw e;
      }
    },

    // 行为埋点（本地模式存 localStorage，云端模式写集合）
    async logEvent(event, properties) {
      if (LOCAL_MODE) {
        const arr = _lsGet(LS_EVENTS, []);
        arr.push({ event, properties: properties || {}, ts: new Date().toISOString() });
        _lsSet(LS_EVENTS, arr.slice(-200));
        return;
      }
      if (!this._tokens || !this._tokens.user) return;
      try {
        await this._db.collection('grat_events').add({
          _openid: this._tokens.user.id,
          user_id: this._tokens.user.id,
          event: event,
          properties: properties || {},
          ts: new Date().toISOString()
        });
      } catch (e) {}
    }
  };

  // 暴露为 SB，与各版本现有调用点（SB.getSession / SB.getEntries / ...）保持一致
  window.SB = CB;
})();
