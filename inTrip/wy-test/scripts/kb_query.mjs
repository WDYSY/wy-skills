#!/usr/bin/env node
/**
 * kb_query.mjs —— 从 wy-test 知识库召回与本次改动相关的历史 bug
 *
 * 用法：
 *   node kb_query.mjs --kb=<kb 目录> [--page=product-baseinfo] \
 *        [--keywords=置灰,多语言,资源组] [--tester=S41665] [--limit=30] [--json]
 *
 * 打分：标题命中 ×3、摘要命中 ×1、场景标签命中 +2、指定同学 +5；按主场景分组输出。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = path.resolve(__dirname, '..')

const args = (() => {
  const out = {}
  for (const raw of process.argv.slice(2)) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(raw)
    if (!m) continue
    out[m[1]] = m[2] === undefined ? true : m[2]
  }
  return out
})()

const KB_DIR = args.kb ? path.resolve(args.kb) : path.join(SKILL_DIR, 'kb')
const PAGE = args.page || ''
const KEYWORDS = args.keywords
  ? String(args.keywords)
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
  : []
const TESTER = args.tester || ''
const LIMIT = Number(args.limit || 30)

const SCENARIO_NAME = {
  gray_readonly: '置灰 / 只读',
  multi_language: '多语言展示与拦截',
  language_check: '服务语言校验（CN/普通话/目的地）',
  mutex_link: '互斥 / 联动 / 默认角色',
  clause: '条款联动',
  data_consistency: '数据一致性',
  scope_out: '范围外 / 灰度',
  display_copy: '展示 / 文案 / 交互',
  unclassified: '未分类',
}
const ORDER = Object.keys(SCENARIO_NAME)

const bugsDir = path.join(KB_DIR, 'bugs')
if (!fs.existsSync(bugsDir)) {
  console.error(`知识库为空：${bugsDir} 不存在，先跑 kb_sync.mjs`)
  process.exit(1)
}

const all = []
for (const f of fs.readdirSync(bugsDir).filter((x) => x.endsWith('.json'))) {
  const obj = JSON.parse(fs.readFileSync(path.join(bugsDir, f), 'utf8'))
  for (const b of Object.values(obj)) all.push(b)
}

const scoped = PAGE ? all.filter((b) => b.page === PAGE) : all
if (!scoped.length) {
  console.log(JSON.stringify({ ok: true, total: 0, note: `页面 ${PAGE} 暂无历史 bug` }))
  process.exit(0)
}

const scored = scoped.map((b) => {
  let score = 0
  const hits = []
  for (const kw of KEYWORDS) {
    const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (re.test(b.title || '')) {
      score += 3
      hits.push(kw)
    } else if (re.test(b.excerpt || '')) {
      score += 1
      hits.push(kw)
    }
    if ((b.scenarios || []).some((s) => re.test(SCENARIO_NAME[s] || ''))) score += 2
  }
  if (TESTER && b.creatorId === TESTER) score += 5
  return { ...b, score, hits }
})

const result = scored
  .filter((b) => (KEYWORDS.length ? b.score > 0 : true))
  .sort((a, b) => b.score - a.score || b.created - a.created)
  .slice(0, LIMIT)

if (args.json) {
  console.log(JSON.stringify({ ok: true, page: PAGE, keywords: KEYWORDS, total: result.length, bugs: result }, null, 2))
  process.exit(0)
}

const groups = new Map()
for (const b of result) {
  const arr = groups.get(b.primary) || []
  arr.push(b)
  groups.set(b.primary, arr)
}

console.log(`# 召回结果 · page=${PAGE || '(全部)'} · keywords=${KEYWORDS.join('/') || '(无)'} · 命中 ${result.length}`)
for (const [key, arr] of [...groups.entries()].sort((a, b) => ORDER.indexOf(a[0]) - ORDER.indexOf(b[0]))) {
  console.log(`\n## ${SCENARIO_NAME[key] || key}（${arr.length}）`)
  for (const b of arr) {
    const hit = b.hits?.length ? ` ← ${b.hits.join('、')}` : ''
    console.log(`- **${b.key}** [${b.status}] ${b.title}（${b.creator}）${hit}`)
    if (b.excerpt) console.log(`  ${b.excerpt.slice(0, 160)}`)
  }
}
