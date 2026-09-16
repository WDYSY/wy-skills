# Workflow: 修改外部 PPT (S3)

> **场景**:`detect-scenario.sh` 输出 `S3`——项目目录里只有 `.pptx`,**没有** `design.md` 或 `generate.js`。这是别人(或别的工具)做的 PPT,我们要在它基础上改。

## 给用户的二选一(用用户能听懂的话)

**不要**用术语轰炸用户(design.md、generate.js、逆向、reverse engineer 这些词都不要出现)。开场对用户说:

> 这个 PPT 不是我之前帮你做的,没有"设计稿"配套。我有两种改法:
>
> **A. 快速改** — 直接动 .pptx 文件。
> - 优点:立刻能改,几秒出结果。
> - 缺点:复杂样式(对齐、间距、字体回退)可能改完和原版有细微出入,**不适合大改**。
>
> **B. 完整重做** — 我先把这份 PPT 反推成一份"设计稿 + 生成脚本"接管它,之后任何修改都精准可控,也方便后续迭代。
> - 优点:精准、可迭代。
> - 缺点:反推过程要花一些时间,复杂排版可能反推不完美。
>
> 你这次的改动是「小修小补」还是「大改」?

根据用户答复,走 Path A 或 Path B。**不要擅自决定**。

---

## Path A: 快速改(python-pptx 直接动)

### A1. 工具校验

```bash
bash scripts/check-deps.sh edit-foreign
```

### A2. 复制骨架到项目目录

```bash
cp ppt-maker/scripts/workflow/edit-foreign-template.py <project-dir>/edit-<change>.py
```

把文件名改成有意义的(`edit-fix-typo.py`、`edit-update-numbers.py` 等)。

### A3. 探索 → 修改 → 保存

骨架的 `explore()` 会打印每页每个 shape 的位置和文字,先跑一次看清结构。

然后注释掉 explore,填入具体的 `replace_text` / `restyle_run` / `reposition` / `recolor_fill` / `delete_slide` 调用。

### A4. 跑 + 验证

```bash
cd <project-dir> && python edit-<change>.py
```

输出新 .pptx,让用户在 PowerPoint 打开验证。

### A5. 警告用户

> 我改完了,但样式细节(对齐、间距、字体回退)可能和原版有细微出入。在 PowerPoint 里逐页检查一下,有问题告诉我。

---

## Path B: 完整重做(反推接管)

### B1. 工具校验

```bash
bash scripts/check-deps.sh read
bash scripts/check-deps.sh analyze
```

### B2. 抽文字

```bash
markitdown <project-dir>/source.pptx > <project-dir>/extracted.md
```

得到逐页文字 + 表格 + 图片 alt。

### B3. 抽结构

```bash
./ppt-maker/scripts/workflow/analyze_template.py <project-dir>/source.pptx --output-dir <project-dir>/_analysis
```

得到 `slides.json` (每页 shape 几何) + `summary.json` (颜色/字体/字号统计)。

### B4. 草拟 design.md

基于 extracted.md 的文字 + slides.json 的几何,**写 design.md 草稿**:
- 每页一个 `## Page N: <title>` 节
- 复述每页内容、ASCII 布局、配色
- 标注未确定的部分

### B5. 草拟 generate.js

基于 design.md + 用户选定的模板(如有),写 `generate.js`。

### B6. 转 S2 流程

到此为止,项目目录里**已经有** design.md + generate.js,场景从 S3 变成 S2。后续改动按 [workflow-edit-native.md](workflow-edit-native.md) 走。

跑 `regen.sh` 生成新 pptx,和原 pptx 截图对比,让用户确认接管的设计稿是否准确。

---

## 注意

- **不要**在 S3 走 Path A 的同时擅自创建 design.md / generate.js——那会把场景搞混。
- **不要**默认走 Path B(它工作量大且可能不完美)——除非用户明确说"大改"或"反复改"。
- **不要**装第三方 pptx 库,只用 python-pptx(skill 入口硬规则)。
