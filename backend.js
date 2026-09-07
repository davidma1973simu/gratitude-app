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

  // ── 第三方 OAuth 身份源（微信 / 谷歌）──
  // 这两项 ID 来自控制台「身份认证 → 身份源」里你创建的微信/谷歌身份源（providerId）。
  // 创建后把对应字符串填进来；留空则登录按钮点击会提示未配置。
  // 前置：控制台需分别配置微信网页授权（微信开放平台网站应用 appid/secret）
  //       或谷歌 OAuth（Google Cloud client id/secret，回调域名含你的部署域名）。
  const OAUTH = {
    wechatProviderId: '',   // 例：'wechat-web' 或控制台给出的 providerId
    googleProviderId: '',   // 例：'google-web'
  };

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

    // ── 邮箱 + 密码 登录（CloudBase 控制台只有「邮箱验证码」+「用户名密码」，无独立「邮箱+密码」卡）──
    // 所以采用折中方案：
    //   1. 首次注册：邮箱验证码验证一次，同时用该次验证把「邮箱 + 自设密码」写进账号（signUp({email, password}) → verifyOtp）
    //   2. 之后登录：直接 email + password，不再需要验证码（signInWithEmailAndPassword）
    // 底层 authApi（t4）上 signUpWithEmailAndPassword / signInWithEmailAndPassword 真实存在（15290/15301），
    // 但 signUpWithEmailAndPassword 是 v1 激活链/平台代发风格；本环境 v2 邮箱验证码更稳，故混合使用。

    _pendingVerify: null,

    // 发送验证码到邮箱，并把用户要设的 password 一起绑定到本次验证闭包
    // 调用时用户已填好 email + password；下一步输入验证码后，用同一个 verifyOtp 完成注册并写入密码
    async sendEmailCode(email, password) {
      this._init();
      const res = await this._auth.signUp({ email, password });
      const verifyOtp = res && res.data && res.data.verifyOtp;
      if (typeof verifyOtp !== 'function') {
        console.error('[CB] sendEmailCode: 未返回 verifyOtp', JSON.stringify(res));
        throw new Error('EMAIL_CODE_SEND_FAILED');
      }
      this._pendingVerify = verifyOtp;
      console.log('[CB] sendEmailCode OK, 等待用户输入验证码');
      return res;
    },

    // 输入验证码，完成「邮箱 + 密码」注册并建立登录态
    async verifyEmailCode(code) {
      this._init();
      const verifyOtp = this._pendingVerify;
      this._pendingVerify = null;
      if (typeof verifyOtp !== 'function') throw new Error('EMAIL_CODE_EXPIRED');
      await verifyOtp({ token: String(code) });
      const s = await this._loginState();
      if (s) { this._tokens = s; return s; }
      throw new Error('EMAIL_VERIFIED_NO_SESSION');
    },

    // 已注册用户用邮箱 + 密码直接登录（无需验证码）
    // signInWithEmailAndPassword 内部调用 signIn({ username: email, password })，服务端会按邮箱匹配
    async signInWithEmailAndPassword(email, password) {
      this._init();
      const api = this._auth && this._auth.oauthInstance && this._auth.oauthInstance.authApi;
      if (!api || typeof api.signInWithEmailAndPassword !== 'function') {
        throw new Error('SDK 未暴露 signInWithEmailAndPassword');
      }
      try {
        await api.signInWithEmailAndPassword(email, password);
      } catch (e) {
        console.error('[CB] signInWithEmailAndPassword raw error:', e);
        throw e;
      }
      const s = await this._loginState();
      if (s) { this._tokens = s; return s; }
      throw new Error('LOGGED_IN_BUT_NO_SESSION');
    },

    // ── 第三方 OAuth 登录（微信 / 谷歌，CloudBase v2 官方流程）──
    // 流程：signInWithOAuth({provider}) 跳转授权页 → 授权后跳回本页并带 ?code=&state=
    //       → 在本页 initAuth 检测到 code+state 时调用 verifyOAuth({code,state,provider}) 建立登录态
    // provider 即上方 OAUTH.wechatProviderId / googleProviderId（控制台身份源的 providerId）
    // 注意：这是「整页跳转」流程（非弹窗），GitHub Pages 静态站完全支持。
    async signInWithOAuth(providerId, options) {
      this._init();
      if (!providerId) throw new Error('OAUTH_PROVIDER_NOT_CONFIGURED');
      const res = await this._auth.signInWithOAuth({ provider: providerId, options: options || {} });
      // 该方法内部会 window.location.assign 跳转到授权页；返回 { data:{url,provider} }
      if (res && res.error) throw res.error;
      return res;
    },

    // 授权回调：用 URL 中的 code+state 换取登录态。可在 initAuth 自动调用（检测到 code/state 时）。
    async verifyOAuth(params) {
      this._init();
      const res = await this._auth.verifyOAuth(params || {});
      if (res && res.error) throw res.error;
      const data = (res && res.data) || null;
      if (data && data.user) {
        const s = await this._loginState();
        if (s) { this._tokens = s; return s; }
      }
      return data;
    },

    // 把第三方账号绑定到当前已登录账号（可选增强：一个账号多种登录方式）
    async linkIdentity(providerId) {
      this._init();
      if (!providerId) throw new Error('OAUTH_PROVIDER_NOT_CONFIGURED');
      return await this._auth.linkIdentity({ provider: providerId });
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
