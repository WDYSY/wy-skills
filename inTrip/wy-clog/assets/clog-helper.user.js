// ==UserScript==
// @name         CLOG 查询助手（wy-clog）
// @namespace    https://github.com/wangyan/wy-clog
// @version      1.0.0
// @description  把 clog 分享链接里的 left 参数解析成人话，一键复制等价的 wy-clog 命令，按工号 + title + 时间窗快速重查
// @author       wangyan
// @match        *://bat.fx.ctripcorp.com/clog*
// @match        *://bat.fx.ctripcorp.com/*/clog*
// @grant        GM_setClipboard
// @grant        GM.setClipboard
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  var LEVELS_ALL = "log_level IN ('ERROR','FATAL','DEBUG','INFO','WARN')";
  var PANEL_ID = 'wy-clog-helper';

  // ---------------------------------------------------------------- URL 解析

  function parseTarget(url) {
    var u = new URL(url);
    var app = u.searchParams.get('leftHitName');
    var raw = u.searchParams.get('left');
    if (!raw) return null;
    var left;
    try {
      left = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    var q = (left.queries && left.queries[0]) || {};
    var where = [q.where || q._where || '', q.whereQuery || ''].join(' AND ');
    var conds = [];
    var seen = {};
    where.split(/\s+AND\s+/).forEach(function (c) {
      c = c.trim();
      if (c && !seen[c]) { seen[c] = 1; conds.push(c); }
    });
    var titleM = /title\s*=\s*'([^']*)'/.exec(conds.join(' AND '));
    var tags = {};
    var tagRe = /_tags\['(\w+)'\]\s*=\s*'([^']*)'/g;
    var m;
    while ((m = tagRe.exec(conds.join(' AND ')))) tags[m[1]] = m[2];
    var lvM = /log_level\s+IN\s*\(([^)]*)\)/.exec(conds.join(' AND '));
    var range = left.range || {};
    return {
      left: left,
      app: app || q.scenario || (/fx_log_(\d+)_all/.exec(q.table || '') || [])[1] || '',
      table: q.table || '',
      region: left.region || 'SHA',
      from: range.from ? Number(range.from) : null,
      to: range.to ? Number(range.to) : null,
      title: titleM ? titleM[1] : '',
      modelTitle: (q.clogQueryModel && q.clogQueryModel.title) || '',
      tags: tags,
      level: lvM ? lvM[1] : '',
      where: conds.join(' AND ')
    };
  }

  // ---------------------------------------------------------------- 时间格式

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fmt(ms) {
    if (!ms) return '-';
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function shortTime(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function describeSpan(from, to) {
    if (!from || !to) return '';
    var s = Math.round((to - from) / 1000);
    if (s < 90) return s + ' 秒';
    if (s < 5400) return Math.round(s / 60) + ' 分钟';
    return (s / 3600).toFixed(1) + ' 小时';
  }

  // ---------------------------------------------------------------- 生成命令

  function buildCommand(t) {
    var parts = ['clog.py search'];
    if (t.app) parts.push('--app ' + t.app);
    if (t.tags.user) parts.push("--user '" + t.tags.user + "'");
    if (t.title) parts.push("--title '" + t.title + "'");
    if (t.from && t.to) parts.push('--from "' + shortTime(t.from) + '" --to "' + shortTime(t.to) + '"');
    var lv = (t.level || '').toLowerCase();
    if (lv && !/info/.test(lv)) parts.push('--level ' + lv.replace(/[^a-z,]/g, ''));
    return parts.join(' ');
  }

  function buildTraceCmd(t) {
    return 'clog.py titles --app ' + t.app + (t.tags.user ? " --user '" + t.tags.user + "'" : '') +
      ' --from "' + shortTime(t.from) + '" --to "' + shortTime(t.to) + '" --top 40';
  }

  // ---------------------------------------------------------------- 复制

  function copy(text, okText) {
    function done() { flash(okText || '已复制'); }
    try {
      if (typeof GM_setClipboard === 'function') { GM_setClipboard(text, 'text'); return done(); }
      if (typeof GM !== 'undefined' && GM && GM.setClipboard) { GM.setClipboard(text, 'text'); return done(); }
    } catch (e) { /* 落到下面的兜底 */ }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
      return;
    }
    fallback();

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { alert('复制失败，请手动选择：\n' + text); }
      document.body.removeChild(ta);
    }
  }

  // ---------------------------------------------------------------- 构造 where

  function buildWhere(user, title) {
    var conds = [LEVELS_ALL];
    if (title) conds.push("title = '" + title.replace(/'/g, "''") + "'");
    if (user) conds.push("_tags['user'] = '" + user.replace(/'/g, "''") + "'");
    return conds.join(' AND ');
  }

  function navigate(user, title, minutes) {
    var base = parseTarget(location.href);
    if (!base) { flash('当前页面没有可解析的查询参数'); return; }
    var now = Date.now();
    var left = JSON.parse(JSON.stringify(base.left));
    var q = left.queries[0];
    q.where = buildWhere(user, title);
    q._where = q.where;
    q.whereQuery = '';
    if (q.clogQueryModel) q.clogQueryModel.title = title || '';
    left.range = { from: now - minutes * 60 * 1000, to: now };
    var u = new URL(location.href);
    u.searchParams.set('left', JSON.stringify(left));
    u.searchParams.set('leftHitName', base.app);
    location.href = u.toString();
  }

  // ---------------------------------------------------------------- 面板样式

  var CSS = [
    '#' + PANEL_ID + '{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:392px;',
    'font:12px/1.55 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2329;',
    'background:#fff;border:1px solid #d0d3d6;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.16);overflow:hidden}',
    '#' + PANEL_ID + ' .wh-hd{display:flex;align-items:center;justify-content:space-between;',
    'padding:8px 10px;background:#f5f6f7;border-bottom:1px solid #e5e6eb;cursor:default}',
    '#' + PANEL_ID + ' .wh-hd b{font-size:12.5px}',
    '#' + PANEL_ID + ' .wh-hd span{cursor:pointer;color:#646a73;padding:0 4px}',
    '#' + PANEL_ID + ' .wh-bd{padding:10px 12px;max-height:72vh;overflow:auto}',
    '#' + PANEL_ID + ' .wh-row{margin:3px 0;display:flex;gap:6px}',
    '#' + PANEL_ID + ' .wh-k{flex:0 0 58px;color:#8f959e}',
    '#' + PANEL_ID + ' .wh-v{flex:1;word-break:break-all;font-family:ui-monospace,Menlo,Consolas,monospace}',
    '#' + PANEL_ID + ' .wh-warn{color:#d4380d}',
    '#' + PANEL_ID + ' .wh-btns{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0 2px}',
    '#' + PANEL_ID + ' button{font:inherit;padding:4px 9px;border:1px solid #c9cdd4;border-radius:6px;',
    'background:#fff;color:#1f2329;cursor:pointer}',
    '#' + PANEL_ID + ' button:hover{background:#f2f3f5;border-color:#8f959e}',
    '#' + PANEL_ID + ' button.wh-primary{background:#1664ff;border-color:#1664ff;color:#fff}',
    '#' + PANEL_ID + ' button.wh-primary:hover{background:#0f4fd1}',
    '#' + PANEL_ID + ' .wh-sep{height:1px;background:#e5e6eb;margin:10px 0 8px}',
    '#' + PANEL_ID + ' .wh-form{display:flex;flex-direction:column;gap:6px}',
    '#' + PANEL_ID + ' .wh-form label{display:flex;align-items:center;gap:6px}',
    '#' + PANEL_ID + ' .wh-form label i{flex:0 0 42px;font-style:normal;color:#8f959e}',
    '#' + PANEL_ID + ' input,#' + PANEL_ID + ' select{flex:1;min-width:0;font:inherit;padding:3px 6px;',
    'border:1px solid #d0d3d6;border-radius:5px;background:#fff;color:#1f2329}',
    '#' + PANEL_ID + ' .wh-tip{color:#8f959e;margin-top:6px}',
    '#' + PANEL_ID + ' .wh-collapsed .wh-bd{display:none}',
    '#' + PANEL_ID + ' .wh-ok{color:#00a870}'
  ].join('');

  var flashTimer = null;
  function flash(msg) {
    var el = document.getElementById(PANEL_ID + '-flash');
    if (!el) return;
    el.textContent = msg;
    el.className = 'wh-ok';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { el.textContent = ''; }, 1800);
  }

  // ---------------------------------------------------------------- 渲染

  var lastHref = '';

  function render() {
    var t = parseTarget(location.href);
    var host = document.getElementById(PANEL_ID);
    if (!t) {
      if (host) host.style.display = 'none';
      return;
    }
    if (!host) host = mount();

    var bd = host.querySelector('.wh-bd');
    var titleNote = t.modelTitle && t.title && t.modelTitle !== t.title
      ? ' <span class="wh-warn">（查询框是 ' + escapeHtml(t.modelTitle) + '，注意别抄错）</span>' : '';
    var tagsTxt = Object.keys(t.tags).length
      ? Object.keys(t.tags).map(function (k) { return k + '=' + t.tags[k]; }).join('  ')
      : '<span class="wh-warn">无</span>';

    bd.innerHTML =
      row('应用', escapeHtml(t.app || '-') + ' · ' + escapeHtml(t.region) +
        (t.table ? ' · ' + escapeHtml(t.table) : '')) +
      row('窗口', fmt(t.from) + ' ~ ' + fmt(t.to) + ' <span class="wh-tip">(' +
        describeSpan(t.from, t.to) + ')</span>') +
      row('title', (t.title ? escapeHtml(t.title) : '<span class="wh-warn">无</span>') + titleNote) +
      row('tag', escapeHtml(tagsTxt).replace(/&amp;/g, '&').replace(/&#39;/g, "'")) +
      row('级别', escapeHtml(t.level || '全部')) +
      '<div class="wh-btns">' +
      '<button class="wh-primary" data-act="cmd">复制 clog 命令</button>' +
      '<button data-act="titlecmd">反查 title 命令</button>' +
      '<button data-act="left">复制 left JSON</button>' +
      '</div>' +
      '<div class="wh-tip"><span id="' + PANEL_ID + '-flash"></span></div>' +
      '<div class="wh-sep"></div>' +
      '<div class="wh-form">' +
      '<label><i>user</i><input id="' + PANEL_ID + '-user" placeholder="工号或 advisor__WeChat…" value="' +
      escapeAttr(t.tags.user || '') + '"></label>' +
      '<label><i>title</i><input id="' + PANEL_ID + '-title" placeholder="如 searchResourceList.req，留空=不按 title 过滤" value="' +
      escapeAttr(t.title || '') + '"></label>' +
      '<label><i>窗口</i><select id="' + PANEL_ID + '-span">' +
      [['15', '最近 15 分钟'], ['60', '最近 1 小时'], ['360', '最近 6 小时'], ['1440', '最近 1 天']]
        .map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="wh-btns"><button class="wh-primary" data-act="go">按以上条件重查</button>' +
      '<button data-act="go-nouser">去掉 user 再查</button></div>' +
      '</div>';

    bd.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.getAttribute('data-act');
        if (act === 'cmd') copy(buildCommand(t));
        else if (act === 'titlecmd') copy(buildTraceCmd(t));
        else if (act === 'left') copy(JSON.stringify(t.left, null, 2));
        else if (act === 'go' || act === 'go-nouser') {
          var user = act === 'go-nouser' ? '' : val('-user').trim();
          var title = val('-title').trim();
          var minutes = Number(val('-span') || 60);
          navigate(user, title, minutes);
        }
      });
    });
  }

  function val(suffix) {
    var el = document.getElementById(PANEL_ID + suffix);
    return el ? el.value : '';
  }

  function row(k, v) {
    return '<div class="wh-row"><span class="wh-k">' + k + '</span><span class="wh-v">' + v + '</span></div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function mount() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML =
      '<div class="wh-hd"><b>CLOG 查询助手</b>' +
      '<span data-act="toggle" title="收起/展开">—</span></div><div class="wh-bd">解析中…</div>';
    document.body.appendChild(panel);

    panel.querySelector('[data-act="toggle"]').addEventListener('click', function () {
      panel.classList.toggle('wh-collapsed');
      this.textContent = panel.classList.contains('wh-collapsed') ? '+' : '—';
    });
    return panel;
  }

  // clog 是单页应用，地址变化要重新解析
  setInterval(function () {
    if (location.href !== lastHref) {
      lastHref = location.href;
      render();
    }
  }, 1200);

  lastHref = location.href;
  render();
})();
