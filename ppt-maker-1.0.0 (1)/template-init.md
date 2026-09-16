# 模板提取(template-init)

> 把一份 .pptx 模板文件转化为本 skill 标准的模板目录,产出 `template.yaml`(符合 [template.schema.json](templates/template.schema.json)) + 实现 `layouts.js`。

## 目标产出

```
ppt/templates/<brand>/
├── template.yaml          # 标准化模板规范(必需)
├── source.pptx            # 原始 pptx 副本
├── layouts.js             # 实现层(每个 layout/component 一个函数)
└── assets/
    ├── logo.png
    └── layout-*.png       # 每种 layout 的预览
```

## 流程

> **连续执行**: Step 1→8 一路推进,不要在步骤之间停下来问用户"要不要继续"。
> 唯一的暂停点是 **Step 3.3**(把识别出的风格分类呈现给用户确认),用户确认后立即继续 Step 4→8。

### Step 1: 工具校验

```bash
bash scripts/check-deps.sh analyze
```

### Step 2: 自动提取(脚本)

```bash
./scripts/workflow/analyze_template.py <source.pptx> --output-dir ppt/templates/<brand>
```

脚本按 OOXML 三层模型扫描:

1. 读 theme → 提取 `theme.colors`(top 8 频次) / `theme.fonts` / `theme.effects`
2. 读 slide_master → 提取 masters(页面尺寸、占位符位置)
3. 枚举每个 master 下的 slide_layout → 每个 layout 截图(`assets/layout-<id>.png`) + 推断 placeholders + 推断 title_area / content_area 几何
4. 写出 `template.yaml` 草稿

草稿默认会把 `use_case` 字段填成 `"TODO: 由 Claude/用户基于截图填写"`,因为 use_case 是品牌策略,机器猜不准。

### Step 3: Claude 修正命名 + use_case + style_variant(基于截图)

**Claude 主导,用户只做轻动作**(命名/分类/确认/增删,不挨个手填):

1. **强制**:用 Read 工具打开 `assets/` 目录下**每一张** `layout-*.png`。只看 `template.yaml` 的几何字段(`title_area` 坐标 / `placeholders` 类型)是写不出像样的 `use_case` 的——视觉气质(背景色、标题对比、整体风格)只在截图里。
2. **Claude 自己起名 + 写 use_case + 拟函数名 + 标 style_variant**(基于刚才读到的视觉特征:背景色、标题位置、占位符布局)
3. 草拟好之后给用户看:

   > 我从这份模板里识别出 N 种风格:
   > - **风格 A · 蓝色标题栏**(适合:正式汇报、CTO 演讲) — 函数 `blueTitleSlide`
   > - **风格 B · 白底大字**(适合:演讲型大字报) — 函数 `contentSlide`
   > - **风格 C · 双栏对照**(适合:对比/前后对照) — 函数 `compareSlide`
   >
   > 这三种命名和分类对吗?要不要删掉某个、改名、或者补充?

4. 用户做"确认 / 改名 / 删 / 补充"四种轻动作
5. 修正后再次写入 `template.yaml`

### Step 4: 校验

```bash
./scripts/workflow/validate-template.py ppt/templates/<brand>/template.yaml
```

必须 ✓ 通过。校验内容:
- JSON Schema 结构
- `theme.semantic_colors` 引用的 key 必须存在于 `theme.colors`
- `layouts[].components_allowed[]` 引用的 id 必须存在于 `components[]`
- `theme.font_scale` 所有值 >= `rules.font_minimum`

### Step 5: 写 `layouts.js`

基于 `templates/layouts.template.js` 复制一份,替换 THEME 常量为 template.yaml 的实际值,为每个 layout 写一个对应函数(函数名由 Step 3 拟定)。

`layouts.js` 顶部加注释引用 template.yaml,所有颜色/字号引用 `theme.semantic_colors` / `theme.font_scale`,**不要硬编码**。

### Step 6: 清理中间产物

删除 `analyze_template.py` 产生的中间文件:

```bash
rm -f ppt/templates/<brand>/summary.json ppt/templates/<brand>/slides.json
```

这些文件仅供提取过程中调试参考,不属于模板最终产出。

### Step 7: 复制 source.pptx + assets

```bash
cp <source.pptx> ppt/templates/<brand>/source.pptx
# logo.png 等素材也复制进去
```

### Step 8: 在测试项目里跑通

在 `/tmp/template-test-<brand>/` 下新建临时项目,选用这个新模板,用 layouts.js 的几个核心函数生成一个 3 页样例 pptx,验证视觉效果。

测试完成后清理临时目录:

```bash
rm -rf /tmp/template-test-<brand>/
```
