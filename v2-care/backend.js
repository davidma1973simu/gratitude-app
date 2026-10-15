/* backend.js — V2-Care 统一后端
 * 双模式：
 *   • WB 托管域名（*.app.workbuddy.host）→ WorkBuddy Cloud Service（邮箱+密码登录 + 云端数据库 + 无 Key LLM）
 *   • 其他域名（GitHub Pages / localhost）→ 本地模式（localStorage，无登录，行为不变）
 * 对外保持 window.SB 接口不变，调用点几乎不动。
 *
 * 仅在 WB 托管域名下才启用云端；GitHub Pages 版保持纯本地兜底，不会被破坏。
 */

(function () {
  // ── WorkBuddy Cloud Service publicConfig（来自 workbuddy_cloud_service 激活结果）──
  const WB_ENDPOINT = 'https://gratitude-v2.app.workbuddy.host';
  const WB_PUBLISHABLE_KEY = 'wbpk_iidbBEWzY9Q3yMiseInMwa_r903cSeVtvGl3nDGTGS5i950vh4kJZNa';
  const WB_OAUTH_RELAY = 'https://www.workbuddy.cn/v2/as/genie-baas/oauth';

  // 仅在 WB 托管域名下启用云端（服务器校验 Origin，其余域名回退本地）
  const USE_CLOUD = typeof location !== 'undefined' && location.hostname.endsWith('app.workbuddy.host');

  // 用户在云端版选择「不登录，先记下来」时置为 true —— 整个会话退回本地模式，
  // 全程不触碰云端数据（不是匿名登录，也不是伪造会话，就是不读不写云端）。
  let _forceLocal = false;
  function _isCloud() { return USE_CLOUD && !_forceLocal; }

  // ── 本地模式常量 ──
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

  // ── WorkBuddy Cloud 客户端（懒初始化）──
  let cloud = null;
  let _cloudInitTried = false;
  let _pendingSignup = null;

  function initCloud() {
    if (cloud) return cloud;
    if (!_isCloud()) return null;
    if (_cloudInitTried) return cloud; // 已尝试但 SDK 未就绪
    _cloudInitTried = true;
    if (typeof window.WorkBuddyCloud === 'undefined') {
      console.error('[WB] SDK 未加载（请先引入 workbuddy-cloud-sdk）');
      return null;
    }
    try {
      cloud = window.WorkBuddyCloud.createWorkBuddyCloud({
        endpoint: WB_ENDPOINT,
        oauthRelayBaseUrl: WB_OAUTH_RELAY,
        publishableKey: WB_PUBLISHABLE_KEY,
      });
    } catch (e) {
      console.error('[WB] client init failed', e);
      return null;
    }
    // 桥接云端鉴权事件 → SB 监听器
    try {
      cloud.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          CB._tokens = { access_token: 'wb', user: { id: session.user.id, email: session.user.email || '' } };
          CB._notify('SIGNED_IN', CB._tokens);
        } else if (!session) {
          CB._tokens = null;
          CB._notify('SIGNED_OUT', null);
        }
      });
    } catch (e) { console.error('[WB] onAuthStateChange failed', e); }
    return cloud;
  }

  function _sessionFromWB(session) {
    return { access_token: 'wb', user: { id: session.user.id, email: session.user.email || '' } };
  }

  const CB = {
    _cloud: USE_CLOUD,
    // 动态：选择「不登录」后应为 false
    get isCloud() { return _isCloud(); },
    // 云端版里主动退回纯本机模式（不读写云端，不是匿名登录）
    forceLocalMode() { _forceLocal = true; },
    _tokens: null,
    _listeners: [],

    onAuthStateChange(cb) { this._listeners.push(cb); },
    _notify(event, session) { this._listeners.forEach(fn => { try { fn(event, session); } catch (e) {} }); },

    getCloudClient() { return initCloud(); },

    // ── 会话 ──
    async ensureSession() {
      if (!_isCloud()) { this._tokens = LOCAL_SESSION; this._notify('SIGNED_IN', LOCAL_SESSION); return LOCAL_SESSION; }
      const c = initCloud();
      if (!c) return null;
      try {
        const { data: session } = await c.auth.getSession();
        if (session && session.user) {
          this._tokens = _sessionFromWB(session);
          this._notify('SIGNED_IN', this._tokens);
          return this._tokens;
        }
      } catch (e) { console.error('[WB] getSession error', e); }
      this._tokens = null;
      return null;
    },

    async restoreSession() {
      if (!_isCloud()) return LOCAL_SESSION;
      return this.ensureSession();
    },

    async getSession() {
      if (!_isCloud()) return LOCAL_SESSION;
      const c = initCloud();
      if (!c) return null;
      try {
        const { data: session } = await c.auth.getSession();
        if (session && session.user) {
          this._tokens = _sessionFromWB(session);
          return this._tokens;
        }
      } catch (e) {}
      return null;
    },

    async signOut() {
      if (!_isCloud()) { this._tokens = null; this._notify('SIGNED_OUT', null); return; }
      const c = initCloud();
      if (c) { try { await c.auth.signOut(); } catch (e) {} }
      this._tokens = null;
      this._notify('SIGNED_OUT', null);
    },

    // ── 邮箱 + 密码登录 ──
    async signInWithEmailAndPassword(email, password) {
      if (!_isCloud()) throw new Error('NOT_CLOUD');
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      const { data: session, error } = await c.auth.signInWithPassword({ email, password });
      if (error) throw error;
      this._tokens = _sessionFromWB(session);
      this._notify('SIGNED_IN', this._tokens);
      return this._tokens;
    },

    // 注册第一步：发送邮箱验证码
    async startSignUp(email, password) {
      if (!_isCloud()) throw new Error('NOT_CLOUD');
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      const sent = await c.auth.sendOtp({ email });
      if (sent.error) throw sent.error;
      _pendingSignup = { email, password, verificationId: sent.data.verificationId, isExistingUser: sent.data.isExistingUser };
      return sent.data;
    },

    // 注册第二步：用验证码 + 密码完成注册
    async completeSignUp(code) {
      if (!USE_CLOUD || !_pendingSignup) throw new Error('NO_PENDING_SIGNUP');
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      const p = _pendingSignup;
      const res = await c.auth.verifyOtp({
        email: p.email,
        verificationId: p.verificationId,
        isExistingUser: false,
        token: code,
        password: p.password,
      });
      if (res.error) throw res.error;
      _pendingSignup = null;
      this._tokens = _sessionFromWB(res.data);
      this._notify('SIGNED_IN', this._tokens);
      return this._tokens;
    },

    async resetPassword(email) {
      if (!_isCloud()) return;
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      const r = await c.auth.resetPasswordForEmail(email);
      if (r.error) throw r.error;
    },

    // ── 数据层 ──
    // 读取隐藏标记：字段缺失（老数据）一律视为未隐藏
    _flags(d) {
      return [!!d.hidden1, !!d.hidden2, !!d.hidden3];
    },

    async getEntries() {
      if (!_isCloud()) {
        const obj = _lsGet(LS_ENTRIES, {});
        return Object.keys(obj)
          .sort((a, b) => b.localeCompare(a))
          .map(date => {
            const d = obj[date];
            return {
              date,
              content1: d.content1 || '', content2: d.content2 || '', content3: d.content3 || '',
              hidden: this._flags(d)
            };
          });
      }
      const c = initCloud();
      if (!c) return [];
      try {
        // RLS 已按 owner 隔离，无需传 userId
        const { data, error } = await c.database
          .from('grat_entries')
          .select('date, content1, content2, content3, hidden1, hidden2, hidden3')
          .order('date', { ascending: false });
        if (error) { console.error('[WB] getEntries', error); return []; }
        return (data || []).map(r => ({
          date: r.date,
          content1: r.content1 || '', content2: r.content2 || '', content3: r.content3 || '',
          hidden: this._flags(r)
        }));
      } catch (e) { console.error('[WB] getEntries error', e); return []; }
    },

    // flags = [bool,bool,bool] 隐藏标记；省略则全部不隐藏
    async upsertEntry(_userId, date, c1, c2, c3, flags) {
      const f = Array.isArray(flags) ? flags : [false, false, false];
      const patch = {
        content1: c1 || '', content2: c2 || '', content3: c3 || '',
        hidden1: !!f[0], hidden2: !!f[1], hidden3: !!f[2]
      };
      if (!_isCloud()) {
        const obj = _lsGet(LS_ENTRIES, {});
        obj[date] = Object.assign({ createdAt: Date.now() }, obj[date], patch);
        _lsSet(LS_ENTRIES, obj);
        return;
      }
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      try {
        const { data: existing } = await c.database
          .from('grat_entries')
          .select('id')
          .eq('date', date)
          .maybeSingle();
        if (existing && existing.id) {
          const { error } = await c.database
            .from('grat_entries')
            .update(patch)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await c.database
            .from('grat_entries')
            .insert(Object.assign({ date }, patch));
          if (error) throw error;
        }
      } catch (e) { console.error('[WB] upsertEntry error', e); throw e; }
    },

    // ── 无 Key LLM（仅云端）──
    async callLLM(systemText, userText, opts) {
      if (!_isCloud()) throw new Error('NOT_CLOUD');
      const c = initCloud();
      if (!c) throw new Error('CLOUD_UNAVAILABLE');
      try {
        // 先取模型列表，选第一个可用模型（空列表按错误降级到模拟）
        const models = await c.llm.models.list();
        const list = Array.isArray(models) ? models : (models?.data || []);
        const model = list.find(m => m.disabled !== true) || list[0];
        if (!model || !model.id) throw new Error('NO_MODEL');
        let acc = '';
        for await (const chunk of c.llm.chat.completions.create({
          model: model.id,
          messages: [
            { role: 'system', content: systemText },
            { role: 'user', content: userText }
          ],
          stream: true,
          temperature: opts?.temperature ?? 0.82,
          max_tokens: opts?.max_tokens ?? 600,
          response_format: { type: 'json_object' },
        })) {
          const delta = chunk?.choices?.[0]?.delta?.content;
          if (delta) acc += delta;
        }
        return acc;
      } catch (e) {
        console.error('[WB] callLLM error', e);
        throw e;
      }
    },

    async logEvent(event, properties) {
      if (!_isCloud()) {
        const arr = _lsGet(LS_EVENTS, []);
        arr.push({ event, properties: properties || {}, ts: new Date().toISOString() });
        _lsSet(LS_EVENTS, arr.slice(-200));
        return;
      }
      // 云端行为埋点（非关键路径，失败静默）
      const c = initCloud();
      if (!c) return;
      try {
        await c.database.from('grat_events').insert({ event, properties: properties || {} });
      } catch (e) { /* 非致命 */ }
    },
  };

  window.SB = CB;
})();
