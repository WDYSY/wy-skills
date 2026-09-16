# Workflow: 从零创作 PPT (S1)

> **场景**:`detect-scenario.sh` 输出 `S1`——项目目录不存在或为空,从零开始做一份 PPT。

## HARD CHECKLIST(进入工作流必读)

进入本工作流时,你**必须**为下面每一项创建一个 task(用 TaskCreate),按序完成,完成一项 mark 一项,**不允许跳步**。

跳步是 SKL-10 之前所有流程问题(#1/#2/#4/#9/D/E/F/G/H/I/J)反复复发的根因。

```
[ ] Step 1.1+1.2 AskUserQuestion 一次性收集受众/场合/时长/风格 + 文本问主题和素材
[ ] Step 2.1 列模板,展示给用户选择
[ ] Step 2.2 读 template.yaml,展示 layouts 风格清单,用户选默认风格
[ ] Step 2.3 总页数和每页定位
[ ] Step 3.1 素材搜集(每条带 [来源:链接])
[ ] Step 3.2 素材表 4 列校验(数值/时间/定义/性质)
[ ] Step 3.3 用户确认 materials.md
[ ] Step 4.1 每页概念澄清三问(是什么/解决什么/当前阶段)
[ ] Step 4.2 名词关系画法(2+ 关键名词必须画并列/包含/正交/因果)
[ ] Step 4.3 受众文本风格映射(CTO 模式启用?)
[ ] Step 4.4 凑数检测(每个新元素答"删掉会少理解什么")
[ ] Step 4.5 对照锚点对齐(写 vs 论点前问用户"对照对象是谁")
[ ] Step 5.1 选 layout,标理由
[ ] Step 5.2 配色避撞 + 并列元素一致性自检
[ ] Step 5.3 每页 ASCII 布局图(严格按 design.template.md 格式)
[ ] Step 6 generate.js 编写,引用 template.yaml token
[ ] Step 7.1 check-deps.sh generate
[ ] Step 7.2 全量 node generate.js(不传页号参数!)
[ ] Step 7.3 check-deps.sh preview + screenshot
[ ] Step 7.4 regen.sh 自动生成预览 + 自检
[ ] Step 7.5 用户在 PowerPoint 验证
```

---

## Step 1: 构思讨论

**输入**:用户的初步想法
**主导**:用户主导,AI 引导提问

### 1.1 + 1.2 基本信息 + 风格(一次性收集,不要逐个提问)

用 `AskUserQuestion` 一次性收集结构化选项,同时在消息文本中询问开放性问题:

**文本部分问**(在调用 AskUserQuestion 前的消息里):
- 主题是什么?核心观点是什么?
- 有没有现成素材?(文档/数据/图片)

**AskUserQuestion 收集**(4 个问题一次提交):

```json
{
  "questions": [
    {
      "header": "受众",
      "question": "受众是谁?",
      "multiSelect": false,
      "options": [
        { "label": "技术团队", "description": "工程师/架构师,可展开技术细节" },
        { "label": "管理层", "description": "CTO/VP/总监,重结论和数据" },
        { "label": "外部客户", "description": "客户/合作方,重价值和案例" },
        { "label": "混合受众", "description": "技术+非技术混合,需兼顾" }
      ]
    },
    {
      "header": "场合",
      "question": "什么场合使用?",
      "multiSelect": false,
      "options": [
        { "label": "技术分享", "description": "团队内部或社区技术演讲" },
        { "label": "管理层汇报", "description": "向上汇报进展/方案/决策" },
        { "label": "客户拜访", "description": "对外展示产品/方案/合作" },
        { "label": "培训教学", "description": "新人培训或知识传授" }
      ]
    },
    {
      "header": "时长",
      "question": "演讲时长大概多久?(含 Q&A)",
      "multiSelect": false,
      "options": [
        { "label": "15 分钟", "description": "Lightning talk,8-12 页" },
        { "label": "30 分钟", "description": "标准分享,12-18 页" },
        { "label": "45 分钟", "description": "深度分享,18-25 页" },
        { "label": "60 分钟+", "description": "完整演讲或培训,25+ 页" }
      ]
    },
    {
      "header": "风格",
      "question": "偏好哪种 PPT 风格?",
      "multiSelect": false,
      "options": [
        { "label": "演讲型", "description": "每页一个大观点,极少文字,靠演讲者撑内容" },
        { "label": "汇报型(推荐)", "description": "结构化,数据+图表为主,能独立阅读" },
        { "label": "说服型", "description": "故事驱动,先痛点后方案,强调对比和收益" }
      ]
    }
  ]
}
```

**产出**:写入 `design.md` 的"基本信息"部分。

---

## Step 2: 架构 + 模板

### 2.1 列模板

```bash
ls ppt/templates/*/template.yaml
```

向用户列出可用模板,让用户选(或不用模板)。

### 2.2 读 template.yaml,展示 layouts 风格清单

读所选模板的 `template.yaml`,把 `layouts[]` 中所有 `style_variant` 不为空的版式拉出来,展示给用户:

```
模板 tripcom 内含以下风格:
- 风格 A · 蓝色标题栏 (use_case: 正式汇报、CTO 演讲)
- 风格 B · 白底大字   (use_case: 演讲型大字报)

整本 PPT 主要用哪种风格作默认?
```

**用户选定的默认风格**写入 `design.md`,后续 contentSlide 调用都用这个风格。某些页可单独覆盖。

### 2.3 总页数和每页定位

为每页规划:页码 / 标题 / 内容方向 / 页面类型(封面/章节/内容/结尾)+ 选择 layout。

**产出**:写入 `design.md` 的"整体结构"部分。

---

## Step 3: 素材搜集

### 3.1 来源约定

**强制要求**:每条数据点后必须 `[来源:链接/文档名]`,无来源不收。

### 3.2 提炼到 materials.md(必须 4 列)

基于 `templates/materials.template.md`,**每条数字必须答 4 个问题**:

| 指标 | 数值 | 时间口径 | 测量定义 | 性质(现状/目标) | 来源 |
|---|---|---|---|---|---|

口径不全的数字**宁缺勿滥**。这是 SKL-10 D 项痛点的硬规则。

### 3.3 用户确认

用户 review materials.md,剔除/补充/确认。

**产出**:`materials.md`(独立文件)。

---

## Step 4: 内容编排

> **本步是质量分水岭**。前几次 PPT 任务里,所有"做完一页才发现内容混乱"的问题都来自跳过本步的硬规则。

### 4.1 概念澄清三问(每页强制)

对每页**必须能回答**:

1. **它是什么?** — 一句话定义
2. **它解决什么问题?** — 一句话因果
3. **我们目前在哪个阶段?** — 现状/未来

任何一个答不出来或模糊 → **停下来问用户**,不要硬画。

### 4.2 名词关系画法

如果一页含有 **2+ 关键名词**(例:"研发知识库 / Tree-sitter / Nebula"),必须先画出名词之间的关系:

- **并列**:A、B、C 是同层级的若干元素
- **包含**:A 是 B 的子集
- **正交**:A 和 B 是两个独立维度
- **因果**:A 导致 B

画不出来 = 概念没理清 = **停下问用户**,不要硬上。

### 4.3 受众文本风格映射

| 受众 | slide 文本风格 | 演讲稿风格 |
|---|---|---|
| CTO / 管理层 | 名词短语标题 + 副标题,**不超过 200 字/页** | 短判断句 + 引外部对标 + 讲取舍 |
| 技术分享 | 可详细架构图 + 选型 | 可详细 |
| 产品介绍 | 功能 + 使用场景 + 用户故事 | 故事驱动 |

**CTO 模式黑名单**(详见 [visual-design.md](visual-design.md)):
- ❌ 代词开头("我们 / 你 / 大家")
- ❌ 疑问句("...是什么?""怎么做?")
- ❌ 口语句式("做得怎么样")
- ✅ 推荐范式:**名词短语 + 副标题**(例:"规则体系 · 70+ 条 9 大类")

### 4.4 凑数检测

每个新加的元素必须能回答:**"如果删掉这条信息,听众会少理解什么?"**

答不上来就**别加**。视觉不平衡的解法不一定是加内容,也可以:
- 调整左右栏宽度比例
- 把右栏的某块挪到左栏
- 接受不平衡(密度差本身是叙事节奏)

### 4.5 对照锚点对齐

写"vs 别人 / 比某个东西好"类的论点前,**先问用户**:"这页的对照对象是 [A] 还是 [B] 还是 [C]?"

不要默认对照"行业最先进方案",要根据**叙事目的**选对照(讲提效就对照人工,讲技术领先才对照同类工具)。

**产出**:每页内容 + 演讲稿(写入 `design.md` 的逐页设计中)。

---

## Step 5: 视觉设计

### 5.1 选 layout

为每页选一个 layout(从 template.yaml 的 layouts 列表中),**标注选择理由**。

追求视觉多样性:相邻页面避免相同 layout,整本至少 3 种不同。

### 5.2 自检清单

- [ ] **配色避撞**:同一页大色块不超过 2 种;参考 template.yaml 的 `rules.color_collision`
- [ ] **并列元素一致性**:同组卡片的标题字段类型必须一致(都是定位/都是数据/都是动作,不混)
- [ ] **font_minimum**:所有字号 >= template.yaml 的 `rules.font_minimum`

### 5.3 ASCII 布局图(每页必须)

`design.md` 中每页都必须包含 ASCII 布局图,标注元素位置、尺寸、颜色、字号。这是 `templates/design.template.md` 的硬性要求,不可省略。

ASCII 图的价值在于:在写 generate.js 之前就把布局想清楚,避免代码阶段反复调整坐标。

**产出**:`design.md`——必须严格遵循 `templates/design.template.md` 的格式,每页用 `### Slide N — 标题` heading,每页含 ASCII 布局图。

---

## Step 6: 代码生成

引用模板的 `layouts.js`,所有颜色/字号/间距都引用 `theme.semantic_colors` / `theme.font_scale` / `theme.spacing` token,**不要硬编码**。

**每页必须用注释标记**:`// ===== Slide N — 标题 =====`。`check-sync.py` 依赖这个标记来校验 design.md 和 generate.js 的页数/标题一致性。

```javascript
const { createPresentation, contentSlide, addCard, addVStack, ... } = require("../../templates/<brand>/layouts");
const yaml = require("js-yaml");
const fs = require("fs");
const tpl = yaml.load(fs.readFileSync("../../templates/<brand>/template.yaml"));

const { pres, theme, assets, pageNum } = createPresentation({ ... });

// ===== Slide 1 — 封面 =====
coverSlide(pres, theme, assets, pageNum, {
  title: "页面标题",
  subtitle: "副标题",
});

// ===== Slide 2 — 内容页 =====
contentSlide(pres, theme, assets, pageNum, {
  title: "页面标题",
  titleStyle: "A",
  render: (slide, area) => {
    addCard(pres, slide, area.x, area.y, 5, 3);
  },
});

pres.writeFile({ fileName: "output/deck.pptx" });
```

**产出**:`generate.js`。

---

## Step 7: 生成与检查

### 7.1-7.4 用 regen.sh,不要手动跑

```bash
bash ../../../ppt-maker/scripts/regen.sh .
```

`regen.sh` 内部已经按顺序跑:
- `check-deps.sh generate / preview / screenshot`
- `node generate.js`(全量,**不传页号**)
- `soffice --convert-to pdf`
- `pdftoppm -jpeg slide`

**禁止直接 `node generate.js <N>`**——历史坑 A:页号参数会**整本覆盖**为单页。如果要单页预览,跑 `regen.sh . --page N`,它会输出到 `output/preview-N.pptx`,不污染主文件。

### 7.5 自检截图

逐页检查 `output/slide-*.jpg`,重点关注:
- 文字溢出/截断
- 元素重叠
- 对齐和间距异常
- 配色和字体是否符合 template.yaml

发现问题 → **改 design.md → 改 generate.js → 重新 regen.sh**,不要跳过 design.md(SKL-10 #4 复发的根因)。

### 7.6 用户验证

自检通过后,提示用户在 PowerPoint 打开 `output/*.pptx` 查看,有问题截图发回来。

**产出**:最终 `.pptx`。

---

## 项目目录约定

```
ppt/projects/<project-name>/
├── design.md          # Step 1-5 产出
├── materials.md       # Step 3 产出
├── generate.js        # Step 6 产出
├── output/            # regen.sh 产出(pptx + pdf + jpg)
├── qa_screenshots/    # 用户截图
└── .pptcheck/         # 可选:自定义 check-sync 检查
```
