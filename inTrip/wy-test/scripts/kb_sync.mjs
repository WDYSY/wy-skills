#!/usr/bin/env node
/**
 * kb_sync.mjs —— iDev2 查询结果 → wy-test 知识库（幂等）
 *
 * 用法：
 *   node kb_sync.mjs --input=<iDev2 query 结果文件> --parent=XLSP-3806 \
 *        --page=product-baseinfo [--creator-filter=S41665] [--kb=<kb 目录>] [--dry]
 *
 * 输入支持：iDev2-issue-query 的完整响应（{records:[...]}）或纯数组。
 * 只保留 issueType.id ∈ {3 Bug, 9 Sub-bug}（可用 --types 覆盖）。
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

if (!args.input || !args.parent) {
  console.error('用法: kb_sync.mjs --input=<文件> --parent=<父KEY> [--page=] [--creator-filter=] [--kb=] [--types=3,9] [--dry]')
  process.exit(1)
}

const KB_DIR = args.kb ? path.resolve(args.kb) : path.join(SKILL_DIR, 'kb')
const PAGE = args.page || 'unclassified'
const PARENT = args.parent
const TYPES = String(args.types || '3,9').split(',').map((n) => Number(n.trim()))
const CREATOR_FILTER = args['creator-filter']
  ? String(args['creator-filter']).split(',').map((s) => s.trim()).filter(Boolean)
  : []

/** 场景规则：见 references/scenarios.md */
const RULES = [
  ['gray_readonly', '置灰 / 只读', /置灰|不可点|不可点击|不可编辑|不能编辑|无法勾选|只读|无法保存/],
  ['multi_language', '多语言展示与拦截', /多语言|多个服务语言|只显示一个|只能选一个|多个语言/],
  ['language_check', '服务语言校验（CN/普通话/目的地）', /普通话|中国大陆|CN|目的地|锁定|服务语言必须/],
  ['mutex_link', '互斥 / 联动 / 默认角色', /互斥|联动|带出|移除|默认选中|包车游|自由行|领队|司兼导/],
  ['clause', '条款联动', /条款/],
  ['data_consistency', '数据一致性（库/草稿/复制/同步）', /数据库|select |prd_|extend|草稿|复制|同步|落库/],
  ['scope_out', '范围外 / 灰度', /签证|邮轮|灰度|6381|白框|5025/],
  ['display_copy', '展示 / 文案 / 交互', /提示|文案|白框|标红|红字|不展示|去掉/],
]
const PRIMARY_ORDER = RULES.map((r) => r[0])

function clean(text = '') {
  return String(text)
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadRecords(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.records)) return raw.records
  throw new Error('无法识别的输入结构，需要 {records:[]} 或数组')
}

function classify(title, content) {
  const text = `${title} ${content}`
  const hit = RULES.filter(([, , re]) => re.test(text)).map(([key]) => key)
  return { scenarios: hit, primary: PRIMARY_ORDER.find((k) => hit.includes(k)) || 'unclassified' }
}

function normalize(rec) {
  const title = rec.title || ''
  const content = clean(rec.contenttxt || rec.content || '')
  const { scenarios, primary } = classify(title, content)
  return {
    key: rec.issueKey,
    title,
    typeId: rec.issueType?.id,
    typeName: rec.issueType?.name,
    status: rec.issueStatusCategory?.name || '',
    statusCategory: rec.issueStatusCategory?.id || 0,
    creator: rec.creatorObj?.realname || '',
    creatorId: rec.creatorObj?.id || '',
    created: rec.createtime || 0,
    page: PAGE,
    parent: PARENT,
    scenarios,
    primary,
    excerpt: content.slice(0, 300),
  }
}

/** 读取已有 page md 里的「程小帮补充」区，重写时保留 */
function readSupplement(pageFile) {
  if (!fs.existsSync(pageFile)) return ''
  const md = fs.readFileSync(pageFile, 'utf8')
  const idx = md.indexOf('## 程小帮补充场景')
  return idx >= 0 ? md.slice(idx).trimEnd() : ''
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}

// ---------- main ----------
const records = loadRecords(args.input)
const filtered = records.filter((r) => {
  const t = r.issueType?.id
  if (!TYPES.includes(Number(t))) return false
  if (CREATOR_FILTER.length && !CREATOR_FILTER.includes(r.creatorObj?.id)) return false
  return true
})

if (!filtered.length) {
  console.log(JSON.stringify({ ok: true, imported: 0, note: '过滤后无 Bug/Sub-bug，检查 --types 或 --creator-filter' }))
  process.exit(0)
}

const bugsFile = path.join(KB_DIR, 'bugs', `${PARENT}.json`)
const existing = fs.existsSync(bugsFile) ? JSON.parse(fs.readFileSync(bugsFile, 'utf8')) : {}
const bugs = { ...existing }
let added = 0
let updated = 0
for (const rec of filtered) {
  const item = normalize(rec)
  if (!item.key) continue
  if (bugs[item.key]) updated++
  else added++
  bugs[item.key] = { ...(bugs[item.key] || {}), ...item }
}

const list = Object.values(bugs)
const pageList = list.filter((b) => b.page === PAGE)

// page md
const pageFile = path.join(KB_DIR, 'pages', `${PAGE}.md`)
const supplement = readSupplement(pageFile)
const byScenario = new Map()
for (const b of pageList) {
  const arr = byScenario.get(b.primary) || []
  arr.push(b)
  byScenario.set(b.primary, arr)
}
const scenarioTitle = Object.fromEntries(RULES.map(([k, name]) => [k, name]))
const groups = [...byScenario.entries()].sort(
  (a, b) => PRIMARY_ORDER.indexOf(a[0]) - PRIMARY_ORDER.indexOf(b[0]) || b[1].length - a[1].length
)
let md = `# ${PAGE} · 历史 bug 知识库\n\n`
md += `> 自动生成（kb_sync）· 数据源父任务：${[...new Set(pageList.map((b) => b.parent))].join(' / ') || PARENT} · 更新时间 ${new Date().toISOString().slice(0, 10)}\n`
md += `> 共 ${pageList.length} 条（Bug + Sub-bug）\n\n## 场景分布（多标签，一条 bug 可命中多个场景）\n\n| 场景 | 命中条数 |\n|---|---|\n`
const tagCounts = new Map()
for (const b of pageList) {
  const tags = b.scenarios?.length ? b.scenarios : ['unclassified']
  for (const s of tags) tagCounts.set(s, (tagCounts.get(s) || 0) + 1)
}
for (const [key] of [...tagCounts.entries()].sort((a, b) => b[1] - a[1])) {
  md += `| ${scenarioTitle[key] || '未分类'} | ${tagCounts.get(key)} |\n`
}
md += '\n> 下方表格按**主场景**分组（主场景优先级见 `references/scenarios.md`）\n'
md += '\n## 历史 bug\n'
for (const [key, arr] of groups) {
  md += `\n### ${scenarioTitle[key] || '未分类'}（${arr.length}）\n\n| bug | 标题 | 状态 | 提交人 | 摘要 |\n|---|---|---|---|---|\n`
  for (const b of arr.sort((x, y) => y.created - x.created)) {
    md += `| ${b.key} | ${b.title.replace(/\|/g, '\\|')} | ${b.status} | ${b.creator} | ${(b.excerpt || '').slice(0, 80).replace(/\|/g, '\\|')} |\n`
  }
}
md += `\n\n${supplement || '## 程小帮补充场景\n\n（暂无）'}\n`

// tester md
const testers = new Map()
for (const b of pageList) {
  if (!b.creatorId) continue
  const t = testers.get(b.creatorId) || { name: b.creator, bugs: [] }
  t.bugs.push(b)
  testers.set(b.creatorId, t)
}
for (const [id, t] of testers) {
  const dist = new Map()
  for (const b of t.bugs) dist.set(b.primary, (dist.get(b.primary) || 0) + 1)
  const sorted = [...dist.entries()].sort((a, b) => b[1] - a[1])
  let tmd = `# ${t.name}（${id}）· 关注点画像 · ${PAGE}\n\n`
  tmd += `> 自动统计（kb_sync）· 共 ${t.bugs.length} 条 bug · 更新 ${new Date().toISOString().slice(0, 10)}\n\n`
  tmd += `## 场景分布\n\n| 场景 | 条数 | 占比 |\n|---|---|---|\n`
  for (const [k, n] of sorted) tmd += `| ${scenarioTitle[k] || '未分类'} | ${n} | ${Math.round((n / t.bugs.length) * 100)}% |\n`
  tmd += `\n## 关注点结论（自动初判）\n\n`
  tmd += `- 最集中：**${scenarioTitle[sorted[0][0]] || '未分类'}**（${sorted[0][1]} 条）→ 生成用例时优先覆盖\n`
  if (sorted[1]) tmd += `- 次集中：${scenarioTitle[sorted[1][0]] || '未分类'}（${sorted[1][1]} 条）\n`
  tmd += `- 涉及库存量：共 ${new Set(t.bugs.map((b) => b.key)).size} 个 bug\n`
  tmd += `\n## 最近 bug（前 10）\n\n| bug | 标题 | 状态 |\n|---|---|---|\n`
  for (const b of t.bugs.sort((x, y) => y.created - x.created).slice(0, 10)) {
    tmd += `| ${b.key} | ${b.title.replace(/\|/g, '\\|')} | ${b.status} |\n`
  }
  if (!args.dry) write(path.join(KB_DIR, 'testers', `${id}-${t.name.replace(/[（）()\s]/g, '')}.md`), tmd)
}

if (!args.dry) {
  write(bugsFile, JSON.stringify(bugs, null, 2))
  write(pageFile, md)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      parent: PARENT,
      page: PAGE,
      imported: filtered.length,
      added,
      updated,
      pageTotal: pageList.length,
      testers: [...testers.keys()],
      files: args.dry
        ? '(dry-run，未写盘)'
        : [bugsFile, pageFile, ...testers.keys()].map((x) => (x.startsWith('/') ? x : `testers/${x}`)),
    },
    null,
    2
  )
)
