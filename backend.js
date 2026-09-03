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
          this._tokens = { access_token: 'anon', user: { id: u.uid, email: u.email || '', username: u.username || '' } };
          console.log('[CB] session OK, uid =', u.uid);
          return this._tokens;
        }
      } catch (e) { console.warn('getLoginState error:', e); }
      this._tokens = null;
      return null;
    },

    // 匿名优先（保留接口兼容）：内部同 ensureSession，无会话自动匿名登录
    async ensureSession() {
      let s = await this._loginState();
      if (!s) {
        try { await this._auth.signInAnonymously(); } catch (e) { console.error('匿名登录失败:', e); }
        s = await this._loginState();
      }
      if (s) this._notify('SIGNED_IN', s);
      return s;
    },

    // 仅恢复已有会话（localStorage / getLoginState），不自动创建匿名用户。
    // 用于 initAuth：无痕窗口/新会话没有会话时返回 null，由开屏页让用户选择登录方式。
    async restoreSession() { return this._loginState(); },

    // 显式匿名登录（用户点击「匿名开始」时调用，而非自动）
    async anonymousLogin() {
      this._init();
      try {
        await this._auth.signInAnonymously();
      } catch (e) { console.error('[CB] 匿名登录失败:', e); throw e; }
      const s = await this._loginState();
      if (s) this._tokens = s;
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

    // ── 邮箱验证码注册/登录（CloudBase v2 邮件验证码流程，平台邮件代发，零 SMTP）──
    // 关键事实：CloudBase 原生不支持「用户名 + 密码」自注册；邮箱走验证码，
    // 公开 auth.signUp({email}) 发码并返回 verifyOtp 闭包，闭包内按 is_user 自动区分新用户注册 / 老用户登录。
    _pendingVerify: null,

    // 发送验证码到邮箱（新 / 老邮箱均可发送）
    async sendEmailCode(email) {
      this._init();
      const res = await this._auth.signUp({ email });
      const verifyOtp = res && res.data && res.data.verifyOtp;
      if (typeof verifyOtp !== 'function') {
        console.error('[CB] sendEmailCode: 未返回 verifyOtp', JSON.stringify(res));
        throw new Error('EMAIL_CODE_SEND_FAILED');
      }
      this._pendingVerify = verifyOtp; // 闭包已绑定本次 verification_id
      console.log('[CB] sendEmailCode OK, 等待用户输入验证码');
      return res;
    },

    // 用验证码完成注册 / 登录，建立登录态
    async verifyEmailCode(code) {
      this._init();
      const verifyOtp = this._pendingVerify;
      this._pendingVerify = null;
      if (typeof verifyOtp !== 'function') throw new Error('EMAIL_CODE_EXPIRED');
      await verifyOtp({ token: String(code) });
      // 刷新一次登录态，确保 email 已写入
      const fresh = await this._auth.getLoginState();
      if (fresh && fresh.user && !fresh.user.email) {
        try { const cu = await this._auth.getCurrentUser(); if (cu && cu.email) fresh.user.email = cu.email; } catch (e) {}
      }
      const s = await this._loginState();
      if (s) { this._tokens = s; return s; }
      throw new Error('EMAIL_VERIFIED_NO_SESSION');
    },

    // 读取某用户全部感恩记录（多文档模式，每天一条；按 _openid 查询，CloudBase SDK 自动注入并匹配 PRIVATE 规则）
    async getEntries(userId) {
      this._init();
      try {
        const res = await this._db.collection('grat_entries').where({ _openid: userId }).get();
        console.log('[CB] getEntries raw count:', res && res.data && res.data.length);
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

    // 写入/更新某天的感恩（add 新文档，让 CloudBase SDK 自动注入 _openid，满足 PRIVATE 安全规则）
    async upsertEntry(userId, date, c1, c2, c3) {
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

    // 行为埋点（无会话则静默跳过）
    async logEvent(event, properties) {
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
