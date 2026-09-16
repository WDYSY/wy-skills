# Workflow: 修改 skill-native PPT (S2)

> **场景**:`detect-scenario.sh` 输出 `S2`——项目目录里**同时**有 `design.md` 和 `generate.js`,这是本 skill 之前创建的 PPT。

## ⚠️ HARD-RULE(读完再动手)

> **`design.md` 是唯一的设计真相来源(Single Source of Truth)。**
>
> **任何修改必须先改 `design.md`,再改 `generate.js`。**
>
> **绝不允许只改 `generate.js` 不同步 `design.md`,反之亦然。**

历史:SKL-10 之前的会话里,#4 / #C / #I 这条同一个坑已经复发**至少三次**。每次都是 Claude 习惯性直接动 generate.js,结果 design.md 和 code 漂移,后续会话进来一看以为 design.md 是真相,实际 code 早走偏了。

本 skill 现在用 `check-sync.py` 文件级守卫这条规则。**跑通 check-sync 才算改完**。

## HARD CHECKLIST(进入工作流必读)

为下面每一项创建一个 task,按序完成:

```
[ ] 0. detect-scenario.sh 确认是 S2(避免误把 S3 当 S2)
[ ] 1. 用户描述要改什么
[ ] 2. 先在 design.md 落地修改(描述 + ASCII/文字结构)
[ ] 3. 改 generate.js 对应代码(同样的页号、同样的标题)
[ ] 4. ./scripts/workflow/check-sync.py <project-dir> 必须通过(no exit 1)
[ ] 5. bash scripts/check-deps.sh generate
[ ] 6. bash scripts/regen.sh <project-dir> (全量,不传页号!)
[ ] 7. 自检 output/slide-*.jpg
[ ] 8. 用户在 PowerPoint 验证
```

---

## 流程详解

### Step 0: 二次确认场景

```bash
bash scripts/detect-scenario.sh <project-dir>
```

输出必须是 `S2`。如果是 `S3` 或 `UNKNOWN`,**改走 [workflow-edit-foreign.md](workflow-edit-foreign.md)** 或问用户。

### Step 1: 接收用户的修改诉求

听完用户描述,**先复述一遍**,确认理解一致再动手。

### Step 2: 先改 design.md

定位要改的页面对应的章节(`## Page N: <title>`),修改:
- 布局描述
- 内容文案
- 演讲稿

**在 design.md 修改完之前,不要打开 generate.js**。

### Step 3: 改 generate.js 对应代码

页号、标题、组件调用都要和 design.md 对齐。所有颜色/字号引用 `theme.semantic_colors` / `theme.font_scale` token,**不要硬编码**。

### Step 4: check-sync.py 必须通过

```bash
./scripts/workflow/check-sync.py <project-dir>
```

如果 exit 1:**不允许进入下一步**。回去看哪边漏改了。这是文件级守卫,不依赖 Claude 自律。

可扩展:项目目录下放 `.pptcheck/check_*.py` 自定义检查项。

### Step 5-6: regen 全量生成

```bash
bash scripts/regen.sh <project-dir>
```

**绝对禁止**:`node generate.js <N>`——这会把整本 pptx 覆盖为单页(SKL-10 历史坑 A)。

如果非要单页预览,跑:

```bash
bash scripts/regen.sh <project-dir> --page <N>
```

它会输出到 `output/preview-N.pptx`,不污染主输出。

### Step 7: 截图自检

逐页检查 `output/*-slide-*.jpg`,重点找问题(假设一定有问题)。

emoji / 中文字体在 LibreOffice 不准——**只看排版和元素位置**,字体细节以 PowerPoint 为准。

### Step 8: 用户验证

用户在 PowerPoint 打开 `output/*.pptx` 验证。有问题截图发回 → 回 Step 2。

---

## 常见反模式

| 反模式 | 后果 | 正确做法 |
|---|---|---|
| 直接动 generate.js,过会儿再回 design.md | 漂移、check-sync 失败、未来会话看 design.md 误判 | 永远 design.md 先 |
| `node generate.js 7` 想看第 7 页 | 整本被覆盖为单页 | `regen.sh --page 7` |
| 跑 generate.js 直接交付,跳过预览 | LibreOffice 自检漏掉的问题用户在 PowerPoint 才发现 | regen.sh 一条命令搞定四步 |
| design.md 改了 5 页,只 regen 1 页 | 其他 4 页 code 还是旧的 | regen.sh 全量,无 --page |
| check-sync 报错就改 design.md 让它过 | 假装同步,真问题被掩盖 | 看清是哪边漏了,回去补真改动 |
