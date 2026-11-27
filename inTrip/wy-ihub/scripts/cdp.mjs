#!/usr/bin/env node
/**
 * 最小 CDP 客户端：直接连 Chromium（SunBrowser / 本地 Chrome / 任何开了调试端口的浏览器）里的某个标签页执行 JS。
 * 用于 browser-control 够不到的场景——SunBrowser 是独立 Chromium，内置浏览器和扩展都不在它上面。
 *
 *   node cdp.mjs list --port 64669
 *   node cdp.mjs eval --port 64669 --id A8653FAC6D0D --expr "return document.title"
 *   node cdp.mjs eval --port 64669 --url-contains 'exam/preparation' --file /tmp/probe.js
 *
 * 注意：
 * - 端口从 <profile>/DevToolsActivePort 第一行读，SunBrowser 是随机端口；
 * - --expr / --file 里可以写多条语句 + return（内部包成 async IIFE）；
 * - 需要 Node ≥ 22（用内置 WebSocket）。本机可用 ~/.nvm/versions/node/v24.15.0/bin/node。
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const cmd = args[0];
const opt = {};
for (let i = 1; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];

const port = opt.port;
if (!port) {
  console.error('缺少 --port（SunBrowser：head -1 <user-data-dir>/DevToolsActivePort）');
  process.exit(1);
}

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();

if (cmd === 'list') {
  for (const t of list.filter((t) => t.type === 'page')) {
    console.log(t.id.slice(0, 12), '|', (t.title || '').slice(0, 40), '|', (t.url || '').slice(0, 110));
  }
  process.exit(0);
}

let target = null;
if (opt.id) target = list.find((t) => t.id.startsWith(opt.id));
else if (opt['url-contains']) target = list.find((t) => t.type === 'page' && t.url.includes(opt['url-contains']));
if (!target) {
  console.error('没找到匹配的 page target，先跑 list 看看');
  process.exit(1);
}

const expr = opt.file ? readFileSync(opt.file, 'utf8') : opt.expr;
if (!expr) {
  console.error('缺少 --expr 或 --file');
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let seq = 0;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

ws.addEventListener('open', async () => {
  try {
    const r = await send('Runtime.evaluate', {
      expression: `(async () => { ${expr} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) {
      console.error('页面里抛错:', r.exceptionDetails.text, r.exceptionDetails.exception?.description || '');
      process.exitCode = 1;
    } else {
      const v = r.result?.value;
      console.log(typeof v === 'string' ? v : JSON.stringify(v, null, 2));
    }
  } catch (e) {
    console.error('失败:', e.message);
    process.exitCode = 1;
  } finally {
    ws.close();
  }
});

ws.addEventListener('error', (e) => {
  console.error('ws 连接失败:', e.message || e);
  process.exit(1);
});
