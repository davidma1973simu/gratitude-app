/* backend.js — 统一后端（腾讯云 CloudBase，匿名优先）
 * 替换原 SB（Supabase）封装，接口保持一致，调用点几乎不动。
 * 必须在 index.html 中先于本文件加载 vendor/cloudbase.js（挂在 window.cloudbase）。
 *
 * 控制台的准备步骤见 cloudbase-setup.md：
 *   1. 创建 CloudBase 环境（按量计费/免费额度），拿到 env ID
 *   2. 登录授权 → 开启「匿名登录」
 *   3. 安全配置 → 添加域名 *.github.io 到白名单
 *   4. 粘贴数据库安全规则（见 cloudbase-setup.md）
 *   5. 把下方 CB_ENV 改成你的环境 ID
 */
(function () {
  // TODO: 部署前替换为你的 CloudBase 环境 ID（控制台「环境」页查看）
  const CB_ENV = 'eureka-8g0iymqr969c1b32';

  const CB = {
    _tokens: null,
    _listeners: [],
    _app: null,
    _auth: null,
    _db: null,

    _init() {
      if (this._app) return;
      if (!window.cloudbase) throw new Error('CloudBase SDK 未加载（请先引入 vendor/cloudbase.js）');
      this._app = window.cloudbase.init({ env: CB_ENV });
      // 显式 local 持久化：匿名登录态写 localStorage，刷新后仍是同一匿名用户，
      // 否则每次刷新都新建匿名用户，云端旧记录就读不到了。
      const auth = (typeof this._app.auth === 'function') ? this._app.auth({ persistence: 'local' }) : this._app.auth;
      this._auth = auth;
      this._db = (typeof this._app.database === 'function') ? this._app.database() : this._app.database;
    },

    // 读取当前登录态（匿名或已绑定），并同步 _tokens
    async _loginState() {
      try { this._init(); } catch (e) { return null; }
      try {
        const state = await this._auth.getLoginState();
        console.log('[CB] getLoginState:', JSON.stringify(state && { hasUser: !!state.user, uid: state && state.user && state.user.uid }));
        if (state && state.user) {
          const u = state.user;
          this._tokens = { access_token: 'anon', user: { id: u.uid, email: u.email || '' } };
          console.log('[CB] session OK, uid =', u.uid);
          return this._tokens;
        }
      } catch (e) { console.warn('getLoginState error:', e); }
      this._tokens = null;
      return null;
    },

    // 匿名优先：无会话则自动匿名登录；返回会话或 null
    // 无论已有会话还是新匿名登录，只要最终拿到会话就通知 SIGNED_IN，
    // 这样刷新后（getLoginState 直接返回旧会话、不重新登录）也能驱动 UI 显示。
    async ensureSession() {
      let s = await this._loginState();
      if (!s) {
        try { await this._auth.signInAnonymously(); } catch (e) { console.error('匿名登录失败:', e); }
        s = await this._loginState();
      }
      if (s) this._notify('SIGNED_IN', s);
      return s;
    },

    async getSession() { return this._loginState(); },

    onAuthStateChange(cb) { this._listeners.push(cb); },
    _notify(event, session) { this._listeners.forEach(fn => { try { fn(event, session); } catch (e) {} }); },

    async signOut() {
      try { await this._auth.signOut(); } catch (e) {}
      this._tokens = null;
      this._notify('SIGNED_OUT', null);
    },

    // 读取某用户全部感恩记录（单文档模式：按 user_id 取 doc，entries 字段存日期映射）
    async getEntries(userId) {
      this._init();
      try {
        const res = await this._db.collection('grat_entries').doc(userId).get();
        if (res && res.data && res.data.entries) {
          const entries = res.data.entries;
          return Object.keys(entries)
            .sort((a, b) => b.localeCompare(a))
            .map(date => {
              const arr = entries[date] || [];
              return { date, content1: arr[0] || '', content2: arr[1] || '', content3: arr[2] || '' };
            });
        }
      } catch (e) { console.warn('getEntries error:', e); }
      return [];
    },

    // 写入/更新某天的感恩（单文档模式，避免复合索引与匿名 _openid 问题）
    async upsertEntry(userId, date, c1, c2, c3) {
      this._init();
      const ref = this._db.collection('grat_entries').doc(userId);
      let entries = {};
      try {
        const res = await ref.get();
        if (res && res.data && res.data.entries) entries = res.data.entries;
      } catch (e) { console.warn('[CB] upsert pre-get error:', e); }
      entries[date] = [c1 || '', c2 || '', c3 || ''];
      try {
        await ref.set({ user_id: userId, entries });
        console.log('[CB] upsertEntry OK:', userId, date);
      } catch (e) {
        console.error('[CB] upsertEntry FAILED:', (e && e.message) || e, e);
        throw e;
      }
    },

    // 行为埋点（无会话则静默跳过）
    async logEvent(event, properties) {
      if (!this._tokens || !this._tokens.user) return;
      try {
        await this._db.collection('grat_events').add({
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
