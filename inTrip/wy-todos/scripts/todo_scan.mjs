#!/usr/bin/env node
// iDev 待办分类器：吃 iDev2-issue-query 落地的结果文件，输出结构化分组。
// 用法: node todo_scan.mjs --today=2026-11-09 --tasks=<file> [--bugs=<file>] [--bug-status=待处理]
//                         [--requirements=<filter4504结果>] [--children=<子项结果[,更多页]>] --json
// 辅助: node todo_scan.mjs --requirements=<filter4504结果> --print-id-args   # 输出查子项用的 issueId 数组

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOLIDAYS = (() => {
  const raw = JSON.parse(fs.readFileSync(path.join(HERE, '../references/holidays.json'), 'utf8'));
  return new Set(Object.values(raw.holidays).flat());
})();

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

// 需求状态在流程里的先后位置，用来把越靠近交付的缺口排在越前面
const STATUS_FLOW = ['待需求规划', '待需求评审', '待敏捷排期', '待开发', '开发中', '待测试', '测试中', '设计验收中', '待发布', '待验收', '验收中'];
const stageOf = (s) => STATUS_FLOW.indexOf(s);
const PRIO_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3 };

const iso = (ms) => new Date(ms + 8 * 3600000).toISOString().slice(0, 10);
const weekday = (d) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(`${d}T12:00:00+08:00`).getDay()];
const isWorkday = (d) => {
  const w = new Date(`${d}T12:00:00+08:00`).getDay();
  return w !== 0 && w !== 6 && !HOLIDAYS.has(d);
};
const shift = (d, n) => {
  const t = new Date(`${d}T12:00:00+08:00`);
  t.setDate(t.getDate() + n);
  return t.toISOString().slice(0, 10);
};

function load(file) {
  if (!file) return [];
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (raw.records || []).map((r) => ({
    id: String(r.issueId),
    key: r.issueKey,
    title: (r.title || '').trim(),
    type: r.issueType?.name || null,
    status: r.issueStatus?.name || null,
    // 子项查询只取 issueStatus 时没有 issueStatusCategory 这一层，状态对象里自带 statuscategory
    category: r.issueStatusCategory?.id ?? r.issueStatus?.statuscategory ?? null,
    priority: r.issuePriority?.priorityname || null,
    estimate: r.estimatedPoint ?? null,
    begin: r.begintime ? iso(r.begintime) : null,
    end: r.endtime ? iso(r.endtime) : null,
    parent: r.parentLinkObj?.issueKey || null,
    parentId: r.parentLinkObj?.issueId ? String(r.parentLinkObj.issueId) : null,
    product: r.productObj?.name || null,
    updated: r.lastUpdatedTime || null,
  }));
}

const loadAll = (files) => files.flatMap(load);
const fileArg = (name) => (arg(name) || '').split(',').map((s) => s.trim()).filter(Boolean);

// 查子项时 parentIssueId 要的是数字 id 数组：把需求结果文件转成可直接粘贴的 JSON
if (process.argv.includes('--print-id-args')) {
  const ids = loadAll(fileArg('requirements')).map((r) => r.id);
  process.stdout.write(`${JSON.stringify(ids)}\n`);
  process.exit(0);
}

const today = arg('today');
if (!today) {
  console.error('缺少 --today=YYYY-MM-DD');
  process.exit(1);
}

const tasks = loadAll(fileArg('tasks'));
const allBugs = loadAll(fileArg('bugs'));
const requirements = loadAll(fileArg('requirements'));
const children = loadAll(fileArg('children'));
// --bug-status=待处理：只展示这些状态的 bug；未排期去重仍按 bug 全集扣，避免同一张单子出现两遍
const bugStatusFilter = (arg('bug-status') || '').split(',').map((s) => s.trim()).filter(Boolean);
const bugs = bugStatusFilter.length ? allBugs.filter((b) => bugStatusFilter.includes(b.status)) : allBugs;

// 本周工作日：今天起到本周日（跳过周末与节假日），不要跨到下周一
const todayDow = new Date(`${today}T12:00:00+08:00`).getDay();
const spanToSunday = (7 - todayDow) % 7;
const workdays = [];
for (let i = 0; i <= spanToSunday; i += 1) {
  const d = shift(today, i);
  if (isWorkday(d)) workdays.push(d);
}
const weekEnd = workdays[workdays.length - 1] || today;

// 范围：上月 1 号 ～ 本月末（日期串零填充，可直接按字符串比较，'-31' 当日上界足够）
const month = today.slice(0, 7);
const prevMonth = new Date(`${month}-01T12:00:00+08:00`);
prevMonth.setMonth(prevMonth.getMonth() - 1);
const scopeLo = prevMonth.toISOString().slice(0, 10);
const scopeHi = `${month}-31`;

const inScope = (r) => {
  const d = r.end || r.begin;
  return d && d >= scopeLo && d <= scopeHi;
};
const bugKeys = new Set(allBugs.map((b) => b.key));

const scoped = tasks.filter(inScope);
const overdue = scoped.filter((r) => (r.end || r.begin) < today);
const todayList = scoped.filter((r) => {
  const e = r.end || r.begin;
  return r.begin && r.begin <= today && today <= e;
});
const rest = scoped.filter((r) => !overdue.includes(r) && !todayList.includes(r));
const thisWeek = rest.filter((r) => {
  const b = r.begin || r.end;
  const e = r.end || r.begin;
  return b <= weekEnd && e >= today;
});
const later = rest.filter((r) => !thisWeek.includes(r));

const undated = tasks.filter((r) => !r.begin && !r.end && !bugKeys.has(r.key));
const undatedSummary = {};
for (const r of undated) undatedSummary[r.status || '未知'] = (undatedSummary[r.status || '未知'] || 0) + 1;

const bugSummary = {};
for (const b of bugs) bugSummary[b.status || '未知'] = (bugSummary[b.status || '未知'] || 0) + 1;

// 需求下的子项统计：Sub-bug 不算「子任务」，只有它也算缺
const DONE = 3;
const childStats = new Map();
for (const c of children) {
  if (!c.parentId) continue;
  const st = childStats.get(c.parentId) || { total: 0, subTask: 0, subTaskDone: 0, subBug: 0, openBugs: 0 };
  st.total += 1;
  if (c.type === 'Sub-task') {
    st.subTask += 1;
    if (c.category === DONE) st.subTaskDone += 1;
  }
  if (c.type === 'Sub-bug') {
    st.subBug += 1;
    if (c.category !== DONE) st.openBugs += 1;
  }
  childStats.set(c.parentId, st);
}

const stageDesc = (a, b) => {
  const sa = stageOf(a.status);
  const sb = stageOf(b.status);
  return (sb - sa) || ((PRIO_ORDER[a.priority] ?? 9) - (PRIO_ORDER[b.priority] ?? 9)) || a.key.localeCompare(b.key);
};

const withStats = requirements.map((r) => {
  const st = childStats.get(r.id) || { total: 0, subTask: 0, subTaskDone: 0, subBug: 0, openBugs: 0 };
  return { ...r, childCount: st.total, subTaskCount: st.subTask, subTaskDone: st.subTaskDone, subBugCount: st.subBug, openBugs: st.openBugs, onlyBugs: st.total > 0 };
});

const noSubtask = withStats
  .filter((r) => r.subTaskCount === 0)
  // 越靠近交付的排越前（待验收/测试中/开发中 先看），同状态 P0→P3
  .sort(stageDesc);

const noSubtaskSummary = {};
for (const r of noSubtask) noSubtaskSummary[r.status || '未知'] = (noSubtaskSummary[r.status || '未知'] || 0) + 1;

// 子任务全 DONE、但需求本身还停在 4504 的非完成态 → 可标完成
const doneSubtask = withStats
  .filter((r) => r.subTaskCount > 0 && r.subTaskDone === r.subTaskCount)
  .sort(stageDesc);

const doneSubtaskSummary = {};
for (const r of doneSubtask) doneSubtaskSummary[r.status || '未知'] = (doneSubtaskSummary[r.status || '未知'] || 0) + 1;

const byEnd = (a, b) => (a.end || a.begin || '').localeCompare(b.end || b.begin || '');
const byBegin = (a, b) => (a.begin || '').localeCompare(b.begin || '');

const out = {
  todayDate: today,
  weekday: weekday(today),
  workdays,
  weekEnd,
  scope: { from: scopeLo, to: scopeHi },
  counts: {
    fetched: tasks.length,
    inScope: scoped.length,
    overdue: overdue.length,
    today: todayList.length,
    thisWeek: thisWeek.length,
    later: later.length,
    bugs: bugs.length,
    bugsAll: allBugs.length,
    undated: undated.length,
    requirements: requirements.length,
    noSubtask: noSubtask.length,
    doneSubtask: doneSubtask.length,
    childrenFetched: children.length,
  },
  overdue: overdue.sort(byEnd),
  today: todayList.sort(byBegin),
  thisWeek: thisWeek.sort(byBegin),
  later: later.sort(byBegin),
  bugs: bugs.sort((a, b) => (a.status || '').localeCompare(b.status || '')),
  bugSummary,
  noSubtask,
  noSubtaskSummary,
  doneSubtask,
  doneSubtaskSummary,
  undatedSummary,
};

process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
