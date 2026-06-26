// ═══ v2-care: AI Features (clean, hidden from user) ═══
// All 4 features auto-enabled when API Key is set.
// User only sees a small gear icon → clean API key input.

var V2CARE_API_KEY = localStorage.getItem('v2care_api_key') || '';

// ── DeepSeek Call ─────────────────────────────────────────────────────────
async function callDeepSeek(userPrompt, systemPrompt, timeoutMs) {
  timeoutMs = timeoutMs || 19000;
  if (!V2CARE_API_KEY) return null;
  var ctrl = new AbortController();
  var tid = setTimeout(function() { ctrl.abort(); }, timeoutMs);
  try {
    var res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + V2CARE_API_KEY
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.82,
        max_tokens: 300
      }),
      signal: ctrl.signal
    });
    clearTimeout(tid);
    if (!res.ok) { if (res.status === 401) console.warn('DeepSeek 401: invalid key'); return null; }
    var data = await res.json();
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return text ? text.trim() : null;
  } catch (e) {
    clearTimeout(tid);
    return null;
  }
}

function hasAICare() { return !!V2CARE_API_KEY; }

// ── Settings Panel (v1-diary style: toggle + save) ────────────────────────
function toggleAISettings() {
  var panel = document.getElementById('aiSettingsOverlay');
  if (!panel) return;
  if (panel.classList.contains('active')) {
    panel.classList.remove('active');
  } else {
    document.getElementById('aiApiKeyInput').value = V2CARE_API_KEY;
    var st = document.getElementById('aiSettingsStatus');
    if (st) { st.className = 'ai-settings-status'; st.textContent = ''; }
    panel.classList.add('active');
    setTimeout(function() { document.getElementById('aiApiKeyInput').focus(); }, 100);
  }
}

function saveAISettings() {
  var key = document.getElementById('aiApiKeyInput').value.trim();
  var status = document.getElementById('aiSettingsStatus');
  if (!key) {
    localStorage.removeItem('v2care_api_key');
    V2CARE_API_KEY = '';
    status.className = 'ai-settings-status ok';
    status.textContent = '已清除 API Key，将使用默认模式';
    setTimeout(function() { toggleAISettings(); }, 1200);
    return;
  }
  if (!key.startsWith('sk-')) {
    status.className = 'ai-settings-status err';
    status.textContent = 'Key 格式不正确，应以 sk- 开头';
    return;
  }
  localStorage.setItem('v2care_api_key', key);
  V2CARE_API_KEY = key;
  status.className = 'ai-settings-status ok';
  status.textContent = '已保存 ✦ AI 功能已启用';
  // Re-trigger encouragement with new key
  if (typeof showEncouragementHintAI === 'function') showEncouragementHintAI();
  setTimeout(function() { toggleAISettings(); }, 1000);
}

// Close on overlay click
setTimeout(function() {
  var ov = document.getElementById('aiSettingsOverlay');
  if (ov) ov.addEventListener('click', function(e) {
    if (e.target === ov) toggleAISettings();
  });
}, 200);

// ── Feature 1: Personalized Encouragement ────────────────────────────────
async function showEncouragementHintAI() {
  var count = getTotalCount ? getTotalCount() : 0;
  var encArea = document.getElementById('encouragementArea');
  var encText = document.getElementById('encouragementText');
  if (!encArea || !encText) return;

  if (!V2CARE_API_KEY) return showEncouragementHintFallback();

  var recent = getRecentEntries(6);
  var name = localStorage.getItem('gratitude_nickname') || '';

  var systemPrompt = '你是感恩日记App的鼓励语助手。App哲学是"低语，不喊叫"——安静、克制、温暖的支持。\n根据用户最近的感恩条目，生成一句20-40字的个性化鼓励语。\n不要用感叹号。要温暖但有克制感。如果可以，引用用户条目中的具体细节。\n只输出鼓励语本身，不要解释。';

  var userPrompt = '用户累计记录 ' + count + ' 条感恩。\n';
  if (name) userPrompt += '用户昵称：' + name + '\n';
  if (recent.length) {
    userPrompt += '最近的感恩条目：\n';
    recent.forEach(function(e, i) { userPrompt += '  ' + (i+1) + '. ' + e + '\n'; });
  }
  userPrompt += '\n请生成一句20-40字的个性化鼓励语，风格安静克制温暖。';

  encText.textContent = '✦ …';
  encArea.style.display = 'block';
  requestAnimationFrame(function() { encArea.classList.add('visible'); });

  var aiText = await callDeepSeek(userPrompt, systemPrompt, 15000);
  if (aiText && aiText.length >= 5 && aiText.length <= 200) {
    encText.textContent = '✦ ' + aiText;
  } else {
    showEncouragementHintFallback();
  }
}

function showEncouragementHintFallback() {
  var count = getTotalCount ? getTotalCount() : 0;
  var encArea = document.getElementById('encouragementArea');
  var encText = document.getElementById('encouragementText');
  if (!encArea || !encText) return;
  var hint = '';
  if (count === 0) {
    hint = '✦ 每一束光都值得被记录，从今天开始吧';
  } else if (count < 3) {
    hint = '✦ 你已经记录了 ' + count + ' 束光，继续收集';
  } else if (count < 7) {
    hint = '✦ 已记录 ' + count + ' 束光，光是会蔓延的';
  } else if (count < 20) {
    hint = '✦ 光的收藏家，已收集 ' + count + ' 束光';
  } else {
    hint = '✦ ' + count + ' 束光，你的气场已被净化';
  }
  encText.textContent = hint;
  encArea.style.display = 'block';
  requestAnimationFrame(function() { encArea.classList.add('visible'); });
}

function getRecentEntries(n) {
  n = n || 6;
  var keys = Object.keys(typeof allEntries !== 'undefined' ? allEntries : {}).sort(function(a, b) { return b.localeCompare(a); });
  var result = [];
  for (var i = 0; i < keys.length && result.length < n; i++) {
    var entries = ((allEntries || {})[keys[i]] || []);
    for (var j = 0; j < entries.length && result.length < n; j++) {
      if (entries[j] && entries[j].trim()) result.push(entries[j].trim());
    }
  }
  return result;
}

// Patch showEncouragementHint with AI version
setTimeout(function() {
  if (typeof showEncouragementHint === 'function') {
    window.showEncouragementHint = showEncouragementHintAI;
  }
  // Run on load
  if (V2CARE_API_KEY) showEncouragementHintAI();
}, 0);

// ── Feature 4: Emotion-based Signature Word ───────────────────────────────
var SIG_CATEGORIES = {
  warm:   ['love','warmth','bloom','kiss','shine','golden','radiance','kindness','alive'],
  calm:   ['peaceful','serenity','calm','breathe','soft','present','mindful','whisper'],
  hope:   ['hope','light','sunrise','shine','bloom','alive','free'],
  gentle: ['gentle','tender','kindness','whisper','embrace','mindful','soft']
};

function detectEmotion(text) {
  var warmKw = ['爱','暖','温','笑','开心','快乐','喜','甜','阳光','光','热','朋友','家人','感谢','幸福','美好'];
  var calmKw = ['静','安','平','宁','息','放松','冥想','呼吸','安静','平静','宁静','淡','慢'];
  var hopeKw = ['希望','梦想','未来','期待','明天','相信','可能','光明','星光','路','前'];
  var gentleKw = ['温柔','柔软','细腻','轻轻','慢慢','柔和','微风','月光','花','叶','水'];
  var scores = { warm: 0, calm: 0, hope: 0, gentle: 0 };
  warmKw.forEach(function(kw) { if (text.indexOf(kw) >= 0) scores.warm++; });
  calmKw.forEach(function(kw) { if (text.indexOf(kw) >= 0) scores.calm++; });
  hopeKw.forEach(function(kw) { if (text.indexOf(kw) >= 0) scores.hope++; });
  gentleKw.forEach(function(kw) { if (text.indexOf(kw) >= 0) scores.gentle++; });
  var best = 'gentle', bestScore = -1;
  Object.keys(scores).forEach(function(k) { if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }});
  return best;
}

function pickEmotionBasedSigWord() {
  if (typeof _sigWordsAll === 'undefined') return 'light';
  var todayKey = window.todayKey ? window.todayKey() : null;
  var todayEntries = todayKey && allEntries && allEntries[todayKey] ? allEntries[todayKey] : [];
  var text = todayEntries.filter(function(e) { return e && e.trim(); }).join(' ');
  var emotion = detectEmotion(text);
  var words = SIG_CATEGORIES[emotion] || _sigWordsAll;
  return words[Math.floor(Math.random() * words.length)];
}

// ── Feature 2: Semantic Reunion Matching ──────────────────────────────────
function _extractKeywords(text) {
  var stop = new Set(['的','了','是','在','我','有','和','就','不','人','都','一','上','也','很','到','说','要','去','你','会','着','没有','看','好','自己','这','那']);
  var words = new Set();
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (/[\u4e00-\u9fff]/.test(ch)) {
      if (!stop.has(ch)) words.add(ch);
      if (i < text.length - 1) { var bg = ch + text[i+1]; if (!stop.has(bg)) words.add(bg); }
    }
  }
  return words;
}
function _jaccardSimilarity(a, b) {
  var sA = new Set(a), sB = new Set(b);
  var inter = 0; sA.forEach(function(x) { if (sB.has(x)) inter++; });
  var union = sA.size + sB.size - inter;
  return union === 0 ? 0 : inter / union;
}

setTimeout(function() {
  if (typeof window.pickMemory === 'function') {
    var _origPickMemory = window.pickMemory;
    window.pickMemory = function() {
      if (!V2CARE_API_KEY) return _origPickMemory();
      var tk = window.todayKey ? window.todayKey() : null;
      if (!tk || !allEntries) return _origPickMemory();
      var todayEntries = allEntries[tk] || [];
      var todayText = todayEntries.filter(function(e) { return e && e.trim(); }).join(' ');
      if (!todayText.trim()) return _origPickMemory();
      var todayWords = _extractKeywords(todayText);
      var keys = Object.keys(allEntries).sort();
      var pastKeys = keys.filter(function(k) { return k < tk; });
      if (pastKeys.length < 1) return _origPickMemory();
      var bestMatch = null, bestScore = -1;
      for (var i = 0; i < pastKeys.length; i++) {
        var pk = pastKeys[i];
        var pEntries = (allEntries[pk] || []).filter(function(e) { return e && e.trim(); });
        if (!pEntries.length) continue;
        var pWords = _extractKeywords(pEntries.join(' '));
        var score = _jaccardSimilarity(todayWords, pWords);
        var diff = Math.floor((new Date(tk) - new Date(pk)) / 86400000);
        if (diff >= 30 && diff <= 180) score *= 1.4;
        if (score > bestScore) { bestScore = score; bestMatch = pk; }
      }
      if (bestMatch && bestScore > 0.04) {
        return { date: bestMatch, entries: allEntries[bestMatch], isAnniversary: false, _semantic: true };
      }
      return _origPickMemory();
    };
  }
}, 300);

// ── Feature 3: "给今天的我" Insight ─────────────────────────────────────
async function generateTodaysInsight() {
  if (!V2CARE_API_KEY) return null;
  var tk = window.todayKey ? window.todayKey() : null;
  var entries = (tk && allEntries && allEntries[tk]) || [];
  var nonEmpty = entries.filter(function(e) { return e && e.trim(); });
  if (!nonEmpty.length) return null;

  var systemPrompt = '你是感恩日记App的"给今天的我"功能。用户刚写完今天的感恩条目。请根据内容生成一句30-50字的安静洞察，像是对自己说的一句轻声提醒或有温度的发现。风格：诗意、克制、有洞察力（不是彩虹屁）。不要用感叹号。只输出洞察本身，不要解释或加前缀。';

  var userPrompt = '今天的感恩条目：\n';
  nonEmpty.forEach(function(e, i) { userPrompt += (i+1) + '. ' + e + '\n'; });
  userPrompt += '\n请生成一句30-50字、安静、有洞察力的话，像对自己轻声说的。';

  var result = await callDeepSeek(userPrompt, systemPrompt, 15000);
  if (result && result.length >= 8 && result.length <= 300) {
    _displayInsight(result);
  }
  return result;
}

function _displayInsight(text) {
  var echo = document.getElementById('echoSection');
  if (!echo) return;
  var el = document.getElementById('aiInsight');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aiInsight';
    el.style.cssText = 'margin-top:14px;font-size:12.5px;color:#86a882;line-height:1.8;font-family:-apple-system,"SF Pro Text",sans-serif;opacity:0;transition:opacity 1.8s ease;';
    echo.parentNode.insertBefore(el, echo.nextSibling);
  }
  el.textContent = '✦ ' + text;
  setTimeout(function() { el.style.opacity = '1'; }, 200);
}

// Hook into submit flow
setTimeout(function() {
  var submitBtn = document.getElementById('submitBtn');
  if (submitBtn && !submitBtn._aiInsightPatched) {
    submitBtn._aiInsightPatched = true;
    submitBtn.addEventListener('click', function() {
      setTimeout(function() {
        if (V2CARE_API_KEY) generateTodaysInsight();
      }, 2800);
    });
  }
}, 500);
