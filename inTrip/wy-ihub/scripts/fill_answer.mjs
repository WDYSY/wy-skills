#!/usr/bin/env node
/**
 * wy-ihub 答题框写入 / 校验脚本
 *
 *   node fill_answer.mjs fill  --tab b2 --index 0 --file /tmp/q1.txt
 *   node fill_answer.mjs check --tab b2
 *   node fill_answer.mjs dump  --tab b2 --index 1        # 把框里现有内容打出来
 *
 * 原理：iHub 答题框是 wangEditor v5（Slate）。fill / execCommand / 粘贴都不会进应用状态，
 * 唯一可靠的入口是从答题框 DOM 往上找 React fiber，调组件 props 里的 getChangeData(text)。
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const BROWSER =
  process.env.BROWSER_CTL ||
  '/Users/temptrip/.chengxiaobang/builtin/plugins/browser-control/skills/browser-control/scripts/browser.mjs';

const EDITOR = "[...document.querySelectorAll('[role=textarea]')]";

/** 从答题框往上找 getChangeData：答题框本身是 snabbdom 渲染的，React fiber 只在祖先节点上 */
const FIND_OWNER = `
function findOwner(el){
  let node = el, key = null, host = null;
  for (let i = 0; i < 20 && node; i++) {
    const k = Object.keys(node).find(k => k.startsWith('__reactFiber$'));
    if (k) { key = k; host = node; break; }
    node = node.parentElement;
  }
  if (!key) return null;
  let f = host[key];
  while (f) {
    const p = f.memoizedProps;
    if (p && typeof p.getChangeData === 'function') return p;
    f = f.return;
  }
  return null;
}`;

function runJs(tab, code) {
  let out;
  try {
    out = execFileSync('node', [BROWSER, 'js', '--tab', tab, code], { encoding: 'utf8' });
  } catch (e) {
    const msg = (e.stderr || e.message || '').toString().trim();
    console.error(msg || '执行失败');
    process.exit(1);
  }
  // browser.mjs 会带一行 "Executed in the page's main world. Return value:" 前缀
  const idx = out.indexOf('\n');
  return idx >= 0 ? out.slice(idx + 1).trim() : out.trim();
}

function parseArgs(argv) {
  const [, , cmd, ...rest] = argv;
  const opt = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i].startsWith('--')) continue;
    opt[rest[i].slice(2)] = rest[i + 1];
  }
  return { cmd, opt };
}

const { cmd, opt } = parseArgs(process.argv);
const tab = opt.tab;
if (!tab) {
  console.error('缺少 --tab（用 browser-control 的 tabs 子命令查，内置浏览器是 b1/b2 这种 id）');
  process.exit(1);
}

if (cmd === 'fill') {
  const index = Number(opt.index ?? 0);
  if (!opt.file) {
    console.error('缺少 --file');
    process.exit(1);
  }
  const text = readFileSync(opt.file, 'utf8').trim();
  if (!text) {
    console.error('文件是空的：' + opt.file);
    process.exit(1);
  }
  const b64 = Buffer.from(text, 'utf8').toString('base64');
  const code = `
const text = new TextDecoder().decode(Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0)));
const editors = ${EDITOR};
if (!editors[${index}]) return { ok: false, reason: '没有第 ${index} 个答题框，实际有 ' + editors.length + ' 个' };
${FIND_OWNER}
const owner = findOwner(editors[${index}]);
if (!owner) return { ok: false, reason: '没找到 getChangeData（题目结构变了？）' };
owner.getChangeData(text);
return { ok: true, itemId: owner.itemId || null, chars: text.length };`;
  console.log(runJs(tab, code));
} else if (cmd === 'check') {
  const code = `
const editors = ${EDITOR};
const body = document.body.innerText;
const done = (body.match(/完成\\n(\\d+)\\n共\\n(\\d+)/) || []).slice(1);
const counters = [...body.matchAll(/(\\d+)\\n\\/\\n(\\d+)/g)].map(m => m[1] + '/' + m[2]);
const remain = (body.match(/剩余时间\\n([\\d:]+)/) || [])[1] || null;
return {
  完成: done.length ? done[0] + '/' + done[1] : null,
  字数: counters,
  剩余时间: remain,
  各框字符数: editors.map(e => (e.innerText || '').trim().length),
  各框开头: editors.map(e => (e.innerText || '').trim().slice(0, 24)),
};`;
  console.log(runJs(tab, code));
} else if (cmd === 'dump') {
  const index = Number(opt.index ?? 0);
  const code = `
const editors = ${EDITOR};
const e = editors[${index}];
return e ? (e.innerText || '') : '没有第 ${index} 个答题框';`;
  console.log(runJs(tab, code));
} else {
  console.error('用法: fill_answer.mjs <fill|check|dump> --tab <id> [--index N] [--file path]');
  process.exit(1);
}
