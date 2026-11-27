# iHub「AI Code 审查能力考试 - L2 前端 Web 卷」题目与答案存档

> 同一张卷可以反复考（5 次机会），**每次题面会换**：第 1 题轮换不同组件的 MR，第 2 题在「Next.js 密钥下发」和「无限滚动闭包」之间换。
> 本文件按考试时间顺序存档，用来复盘评分口径和对比题型，**不要直接照搬答案**——题干里的行号、约定、误报提示每次都不一样。

| 次数 | 考试时间 | 账号 | 得分 | 结果 | 第 1 题（50分） | 第 2 题（100分） |
|---|---|---|---|---|---|---|
| 1 | 2026-11-23 20:31 开考 | 王妍 | **150** | 已通过 | `CitySearch.tsx` 审 MR（11 处） | Next.js 活动页密钥下发（三问） |
| 2 | 2026-11-26 16:55–16:58 | 王妍 | **150** | 已通过 | `Uploader.tsx` 审 MR（8 处） | 与第 1 次相同（复用答案） |
| 3 | 2026-11-27 14:5x 开考 | 郑潍雯（SunBrowser 实例 4） | **145** | 已通过 | `SmsLogin.js` 审 MR（8 处） | 信息流无限滚动（四问） |

考试固定信息：时长 100 分钟、合格分 90 / 总分 150、共 2 题问答题、AI 阅卷、有异议可申请人工阅卷。
提交后不可再进入；答案只存内存，页面刷新即清空。

---

## 第 1 次 · 2026-11-23 · 王妍 · 150 分

### 题 1（50 分）审 `CitySearch.tsx`：城市搜索框

**需求要点**

1. 输入停顿 300ms 后再请求
2. 快速连续输入时只展示最后一次输入对应的结果
3. 清空搜索词时立即清空结果，不发请求
4. 搜索接口超时 3 秒；失败提示「网络异常，请重试」
5. 结果最多展示 10 条
6. 本次只涉及搜索组件，不改动其他配置

**工程约定**

| 项 | 说明 |
|---|---|
| `@/hooks/useDebounce` | `useDebounce(value, ms)`，工程统一防抖方式 |
| `xFetch`（`@ctrip/xtaro`） | `timeout` 单位毫秒；成功 resolve `{ isSuccess, data }`；网络错误 / 超时 / 业务失败都 reject（带 `errMsg`） |
| `xShowToast` | 轻提示 |
| npm 依赖 | 新增依赖需在私服核实并在 MR 说明理由；工程已有能力不得重复引入 |
| lint | `.eslintrc.js` 全仓共用，功能 MR 不得放宽 |

**待审代码**

```tsx
 1  import { useEffect, useState } from 'react';
 2  import { XView, XInput, XText, xFetch } from '@ctrip/xtaro';
 3  import { debounce } from 'lodash-es';
 4
 5  export default function CitySearch({ onPick }) {
 6    const [kw, setKw] = useState('');
 7    const [list, setList] = useState([]);
 8
 9    // 停顿 300ms 再请求
10    const search = debounce(async (k: string) => {
11      const res = await xFetch({ url: '/restapi/soa2/1111/searchCity', data: { kw: k }, timeout: 3 });
12      setList(res.data.cities.filter((_, i) => i <= 10));   // 最多 10 条
13    }, 300);
14
15    useEffect(() => { search(kw); }, [kw]);
16
17    return (
18      <XView>
19        <XInput value={kw} onInput={(e) => setKw(e.detail.value)} placeholder="城市" />
20        {list.map((c) => <XText key={c.id} onClick={() => onPick(c)}>{c.name}</XText>)}
21      </XView>
22    );
23  }
```

文件 2 `__tests__/CitySearch.test.tsx`：把「连续输入只展示最后一次结果」的真实断言换成 `expect(true).toBe(true)`。
文件 3：`.eslintrc.js` 把 `react-hooks/exhaustive-deps` 由 `warn` 改 `off`；`package.json` 新增 `lodash-es`。

> 题目自带提示：第 19 行 `e.detail.value`、第 11 行相对路径 `/restapi/...` 都是正常写法，误报扣分。

**提交的答案（1540 字，满分 50）**

```
1. 第3行 + package.json 新增 lodash-es【依赖违规 · 重复引入】工程已有 @/hooks/useDebounce 是统一防抖方式，按规定不得重复引入新依赖；删除 lodash-es，改用 useDebounce(kw, 300)。
2. 第10行 在组件体内直接创建 debounce【性能 · 资源泄漏】每次 render 都会新建实例，上一次的定时器丢失（防抖实质失效）且无法取消；用 useMemo 或 useRef 只创建一次，或直接改用 useDebounce。
3. 第11行 timeout: 3【缺陷 · 单位错误】xFetch 的 timeout 以毫秒计，3ms 会让所有请求必然超时；改为 timeout: 3000。
4. 第11–12行 未处理 reject【缺陷 · 异常处理缺失】约定超时、网络错误、业务失败都会 reject，此处没有 catch，会产生 unhandled rejection，且需求要求的提示完全缺失；用 try/catch 或 .catch 调 xShowToast({ title: 「网络异常，请重试」 })。
5. 第12行 filter((_, i) => i <= 10)【缺陷 · 边界错误 off-by-one】i <= 10 会取到 11 条，违反「最多展示 10 条」；改为 slice(0, 10)。
6. 第15行 空关键词仍会请求【缺陷 · 需求不符（需求3）】kw 为空时防抖后仍会 search("")，清空搜索词既没有立即清空结果也没有阻止请求；在 effect 开头 if (!kw.trim()) { setList([]); return; } 并取消挂起请求。
7. 第15行 响应覆盖【缺陷 · 竞态条件（需求2）】先发的请求可能后返回并覆盖新结果，无法保证「只展示最后一次输入对应的结果」；给每次请求打序号或记录发起时的 kw，响应回来与当前 kw 不一致就丢弃，并用 AbortController 取消上一次请求。
8. 第15行 依赖数组缺 search【缺陷 · hooks 依赖】exhaustive-deps 会告警，根因是 search 每次重建；按第2条改成稳定引用后依赖写 [kw]。
9. 第14–15行 未做清理【缺陷 · 内存泄漏】组件卸载时没有调用 search.cancel()，卸载后仍可能 setState；补 useEffect cleanup 返回 search.cancel。
10. 文件2 __tests__/CitySearch.test.tsx 把真实断言换成 expect(true).toBe(true)【测试 · 用例失效】用例不再校验「连续输入只展示最后一次结果」，会放过第7行的竞态缺陷；恢复 getAllByText(/上海/) 长度为 1、queryByText(/北京/) 为 null 的断言。
11. 文件3 .eslintrc.js 将 react-hooks/exhaustive-deps 从 warn 改为 off【规范 · lint 违规】约定全仓共用 lint 配置功能 MR 不得放宽；还原为 warn，并在代码里修好依赖数组。

（不报的误报项：第19行 e.detail.value 取输入值、第11行相对路径 /restapi/...、第20行 key={c.id} 均为正常写法。）
```

### 题 2（100 分）Next.js 活动页：密钥下发

**题干**：Pages Router 活动页 `pages/activity/[id].tsx`，要求首屏 SSR、可被搜索引擎抓取、倒计时、移动端/PC 样式不同。
工程已有 `getActivity(id, { apiKey })`、`getActivityDesc(id)`、`@/hooks/useIsMobile`（服务端按请求头判断、hydration 安全）。
**只讨论第 5 行与第 8–10 行。**

```tsx
 1  import { useEffect, useState } from 'react';
 2  import Head from 'next/head';
 3  import { getActivity, getActivityDesc } from '@/api/activity';
 4
 5  const isMobile = /Mobile/.test(window.navigator.userAgent);
 6
 7  export async function getServerSideProps({ query }) {
 8    const apiKey = process.env.ACTIVITY_API_KEY;
 9    const activity = await getActivity(query.id, { apiKey });
10    return { props: { activity, apiKey, now: Date.now() } };
11  }
```

**四问**：① 第 5 行何时/何环境执行、后果、`typeof window` 改法为什么仍不对、正确做法；② 普通访客怎么拿到 apiKey、能做什么、第 8–9 行是否也有问题；③ 线上跑了一周才发现，除改代码还要做什么、什么顺序、怎么验证；④（作答要求）400～600 字、三问都答。

**提交的答案（599 字，满分 100）**

```
①第5行写在模块顶层，加载即执行：服务端渲染该路由（构建期也会求值）时没有 window，直接抛 ReferenceError，路由 500、活动页全挂。改成 typeof window 判断只让服务端恒为 false，两端分歧造成水合不一致、首屏作废，且模块级常量无法按请求区分。正确做法用工程已有的移动端 Hook，或在服务端读请求头 UA 后作 props 下发。
②访客打开页面，密钥就写在源码的 __NEXT_DATA__ 内联脚本里，搜源码可查，也出现在 _next/data 的 json 与数据请求响应中，curl 即得。拿到后可冒充服务端调接口，绕过鉴权与审计，批量采集数据。第8–9行也有问题：query.id 未校验就透传下游，可越权读任意活动；无异常处理，下游失败整页 500；而详情接口不要密钥，说明本可只留服务端。
③顺序是先止血、再查影响、再改代码、最后验证：1.服务端先启用新密钥，旧密钥暂留灰度；2.按旧密钥倒查一周日志来源与频次，判断是否被外部采集，同步安全与数据负责人；3.改代码让 props 不再含密钥，需密钥的调用只在服务端发起；4.新代码上线后再注销旧密钥，先发后删是为避免发布期请求全失败；5.全仓排查同类密钥下发。验证：源码与 _next/data 搜不到密钥，网络请求无密钥，旧密钥调用返回 401/403。
```

---

## 第 2 次 · 2026-11-26 · 王妍 · 150 分

### 题 1（50 分）审 `Uploader.tsx`：图片上传进度与超时提示

**需求要点**

1. 只允许 `jpg/jpeg/png`，扩展名不区分大小写；大小 ≤ 5MB（5 × 1024 × 1024 字节）
2. 上传超过 30 秒未完成，提示「网络较慢」，但**不中断**上传
3. 组件卸载后不得再更新状态、不得残留定时器 / 监听
4. 已有单测必须继续通过；只改上传组件

**工程约定**

| 项 | 说明 |
|---|---|
| `@/api/upload` | `pickImage({ count })` → `{ tempFiles: [{ path, size }] }`（size 单位字节）；`uploadImage(path)` 返回 Promise；进度走全局事件 `upload:progress`（0–100）；**同一页面可能同时有多个上传组件** |
| `@/utils/file` | `isAllowedImage(file)`、`MAX_IMAGE_BYTES`，工程统一格式与大小校验 |
| `xEventCenter` | `off(name, cb)` 只移除这个回调；**`off(name)` 会移除该事件全部监听**（含其他组件注册的） |
| 依赖版本 | 以 lockfile 为准；框架升级需单独立项，功能 MR 不得改动 |

**待审代码**

```tsx
 1  import { useEffect, useRef, useState } from 'react';
 2  import { XView, XButton, XText, XProgress, xEventCenter, xShowToast } from '@ctrip/xtaro';
 3  import { pickImage, uploadImage } from '@/api/upload';
 4
 5  const MAX = 5 * 1000 * 1000;   // 5MB
 6
 7  export default function Uploader({ onDone }) {
 8    const [pct, setPct] = useState(0);
 9    const [slow, setSlow] = useState(false);
10    const mounted = useRef(true);
11
12    useEffect(() => {
13      xEventCenter.on('upload:progress', (p: number) => mounted.current && setPct(p));
14    }, []);
15
16    const pick = async () => {
17      const { tempFiles } = await pickImage({ count: 1 });
18      const f = tempFiles[0];
19      if (!f.path.endsWith('.jpg') && !f.path.endsWith('.png')) return xShowToast({ title: '格式不支持' });
20      if (f.size > MAX) return xShowToast({ title: '文件过大' });
21      setTimeout(() => setSlow(true), 30_000);
22      try {
23        const res = await uploadImage(f.path);
24        onDone(res);
25      } catch (e) {
26        xShowToast({ title: '上传失败，请重试' });
27      }
28    };
```

文件 2 `__tests__/Uploader.test.tsx`：删掉了「大写扩展名 .JPG 可以上传」这条用例。
文件 3：`package.json` 把 `@ctrip/xtaro` 从 `2.9.3` 改成 `^2.10.0`，diff 里没有 lockfile 变更。

> 题目自带提示：第 25–26 行 catch 有用户可见提示、第 17–18 行按 `tempFiles[0]` 的 path/size 取文件信息都是正常写法。

**提交的答案（1400 字，满分 50）**

```
1. 第5行 `MAX = 5 * 1000 * 1000`【缺陷 · 数值错误 + 未用工程能力】1000 进制只有 5,000,000 字节，比真 5MB（5×1024×1024 = 5,242,880）小，5.0–5.24MB 的文件会被误判为「文件过大」；删掉自算常量，改用 `@/utils/file` 的 `MAX_IMAGE_BYTES`。
2. 第19行 扩展名判断【缺陷 · 需求不符】`endsWith('.jpg')` / `('.png')` 区分大小写且漏了 `.jpeg`，`IMG_0001.JPG`、`.JPEG` 会被拒，违反「扩展名不区分大小写」；改用工程统一的 `isAllowedImage(f)`。
3. 第12–14行 事件监听没有 cleanup【缺陷 · 监听泄漏（需求3）】组件卸载后 `upload:progress` 仍会回调并可能 setPct；在 effect 里保存同一个回调引用，cleanup 时 `xEventCenter.off('upload:progress', cb)`——不能写成 `off('upload:progress')`，那会把同页其他上传组件的监听一起删掉。
4. 第10行 `mounted` 只初始化 true、从不置 false【缺陷 · 假保护】`mounted.current &&` 形同虚设，卸载后第13行 `setPct` 与第24行 `onDone(res)` 都会照常执行；在 useEffect 的 cleanup 里把 `mounted.current = false`。
5. 第21行 `setTimeout` 没有保存句柄、也没有清理【缺陷 · 定时器残留 + 逻辑错误（需求2/3）】上传成功或失败后 30 秒仍会 `setSlow(true)`，把「网络较慢」错挂到已完成的上传上；卸载后还会 setState。保存 timer 引用，在 `finally` 里 clearTimeout，并在卸载 cleanup 中一并清掉。
6. 第13行 没有区分是哪个上传任务【缺陷 · 状态串扰】`upload:progress` 是全局广播，而同一页面可能有多个上传组件，别的组件的进度会写进本组件的进度条；按事件里的任务标识（如 path）过滤后再 setPct。
7. 文件2 `__tests__/Uploader.test.tsx` 删掉「大写扩展名 .JPG 可以上传」用例【测试 · 覆盖被削弱】这条用例正好覆盖第19行的缺陷，删掉等于掩盖它，也违反「已有单测必须继续通过」；恢复该用例，修好第19行后它应当通过。
8. 文件3 `package.json` 把 `@ctrip/xtaro` 从 2.9.3 改成 `^2.10.0` 且 diff 里没有 lockfile 变更【规范 · 依赖违约】约定框架升级需单独立项、功能 MR 不得改动，版本以 lockfile 为准，现在锁文件与 package.json 还对不上；还原版本，升级另立 MR 并同步 lockfile。

（不报的误报项：第25–26行 catch 里有用户可见提示、第17–18行按 `tempFiles[0]` 的 path/size 取文件信息，均为正常写法。）
```

### 题 2（100 分）与第 1 次相同

题干、代码、作答要求完全一致，直接复用第 1 次的答案（599 字）。

---

## 第 3 次 · 2026-11-27 · 郑潍雯（SunBrowser 实例 4）· 145 分

> 这次在 SunBrowser 实例 4 里做，答题人是郑潍雯的账号（0/5 → 1/5）。得分 145，比前两次各低 5 分，说明有一处被判误报或漏项。

### 题 1（50 分）审 `SmsLogin.js`：CRN 手机号验证码登录页

**需求要点**

1. 手机号为中国大陆 11 位纯数字、以 1 开头；不合法前端提示、不发请求
2. 登录成功后调 `User.finishedLogin(userInfo)` 交给宿主 App，**前端不得自行落盘 token**
3. 登录失败必须展示服务端返回的原因（如「验证码错误」）
4. 登录请求携带设备指纹（工程已有 `getDeviceFingerprint()`）
5. 本次只涉及登录页，不改动其他页面

**工程约定**

| 项 | 说明 |
|---|---|
| `@/utils/validate` | `isCnMobile(str)` 大陆手机号校验 |
| `@/utils/device` | `getDeviceFingerprint()` 返回 Promise |
| `@/api/account` | `loginBySms({ mobile, code, fp })`：成功 `{ ok: true, userInfo }`；业务失败 `{ ok: false, message }`（**不抛异常**）；网络错误才抛 |
| `@ctrip/crn` | `User.finishedLogin(userInfo)`；`Storage.save({ key, value, domain })`；`Toast.show(text)`；`getPageId()` 每页固定 |
| 密钥规范 | 任何服务端密钥不得出现在客户端代码里（App 可解包） |
| 日志规范 | 禁止在日志中输出手机号、验证码、密钥 |

**待审代码**

```jsx
 1  import React from 'react';
 2  import { View, TextInput, Text, TouchableOpacity } from 'react-native';
 3  import { Page, Storage, Toast } from '@ctrip/crn';
 4  import { loginBySms } from '@/api/account';
 5
 6  const RISK_APP_KEY = 'rk_live_7f3a9c21d8e4b6f0';   // 风控平台分配
 7
 8  export default class SmsLogin extends Page {
 9    state = { mobile: '', code: '' };
10    getPageId() { return '10650012345'; }
11
12    // 大陆手机号：11 位
13    valid = (m) => m.length >= 11 && m.startsWith('1');
14
15    submit = async () => {
16      const { mobile, code } = this.state;
17      if (!this.valid(mobile)) return Toast.show('手机号格式不正确');
18      console.log('login', mobile, code, RISK_APP_KEY);
19      try {
20        const res = await loginBySms({ mobile, code, fp: RISK_APP_KEY });
21        Storage.save({ key: 'token', value: res.userInfo.token, domain: 'account' });
22        this.push('Home');
23      } catch (e) {
24        Toast.show('登录失败，请重试');
25      }
26    };
```

文件 2 `__tests__/SmsLogin.test.js`：把「12 位号码提示格式错误且不发请求」的入参从 `138001380001` 改成 `1380013`。
文件 3：`src/pages/OrderList.js` 的 `getPageId` 从 `10650010001` 改成 `10650010002`（注释「顺手统一编号」）。

> 题目自带提示：第 2 行从 `react-native` 导入基础组件、第 22 行 `this.push('Home')` 都是正常写法。

**提交的答案（1354 字，50 分可能扣了 5 分）**

```
1. 第6行 `RISK_APP_KEY = 'rk_live_…'`【安全 · 客户端硬编码密钥】风控密钥会随包被打出去、可解包提取，违反密钥规范；密钥只留在服务端，客户端不得持有。
2. 第20行 `fp: RISK_APP_KEY`【需求不符 · 参数错用】把风控 key 当成设备指纹传给登录接口，需求4 实际没有实现，工程已有 `getDeviceFingerprint()`；改为 `fp: await getDeviceFingerprint()`。
3. 第18行 `console.log('login', mobile, code, RISK_APP_KEY)`【安全 · 敏感信息落日志】一行同时打印手机号、验证码、密钥，违反日志规范；整行删除。
4. 第13行 `m.length >= 11 && m.startsWith('1')`【缺陷 · 校验不严】`>= 11` 会放过 12 位、`startsWith` 也不保证纯数字，与「11 位纯数字」不符，且工程已有 `isCnMobile`；改用 `isCnMobile(m)`。
5. 第19–25行 没有判断 `res.ok`【缺陷 · 错误处理缺失（需求3）】`loginBySms` 业务失败返回 `{ok:false, message}` 且不抛异常，代码直接取 `res.userInfo.token` 会抛 TypeError 落进 catch，用户只能看到「登录失败，请重试」，看不到服务端给的原因；先 `if (!res.ok) return Toast.show(res.message)`。
6. 第21–22行 `Storage.save({ key: 'token', … })` 且全程没调 `User.finishedLogin`【需求不符 · 登录态自管理】前端自行落盘 token 违反需求2 且有泄露风险；删掉 Storage.save，改为 `User.finishedLogin(res.userInfo)` 之后再 `this.push('Home')`。
7. 文件3 `src/pages/OrderList.js` 把 `getPageId` 从 `10650010001` 改成 `10650010002`【越界改动 · 埋点口径被污染】`getPageId` 是每页固定的埋点/PV 编号，改了会切断 OrderList 的历史统计，也违反「本次只涉及登录页」；撤销这处改动。
8. 文件2 `__tests__/SmsLogin.test.js` 把入参从 `138001380001`（12 位）改成 `1380013`【测试 · 覆盖被削弱】这条用例要验的是「超长号码」，改成 7 位后刚好绕过第13行 `>= 11` 的缺陷；恢复 12 位入参，并补一条含非数字字符的用例。

（不报的误报项：第2行从 `react-native` 导入基础组件、第22行 `this.push('Home')` 跳转，均为正常写法。）
```

### 题 2（100 分）信息流页面改无限滚动

**需求**：① 哨兵元素可见时自动加载下一页；② 没有更多数据时停止加载并显示「没有更多了」；③ 快速滚动时不得重复请求同一页；④ 组件卸载后不残留监听。
工程已有 `@/api/feed`：`fetchFeed(page)` → `Promise<{ items, hasMore }>`。

```tsx
 1  import { useEffect, useRef, useState } from 'react';
 2  import { fetchFeed } from '@/api/feed';
 3  import { FeedCard } from '@/components/FeedCard';
 4
 5  export function Feed() {
 6    const [items, setItems] = useState([]);
 7    const [page, setPage] = useState(1);
 8    const [hasMore, setHasMore] = useState(true);
 9    const sentinel = useRef<HTMLDivElement>(null);
10
11    const load = async () => {
12      const res = await fetchFeed(page);
13      setItems([...items, ...res.items]);
14      setHasMore(res.hasMore);
15      setPage(page + 1);
16    };
17
18    useEffect(() => {
19      const io = new IntersectionObserver(([entry]) => {
20        if (entry.isIntersecting) load();
21      });
22      io.observe(sentinel.current!);
23      // eslint-disable-next-line react-hooks/exhaustive-deps
24    }, []);
```

**四问**：① 首屏自动加载第 1 页后，连续三次触底各请求第几页、列表变成什么样、说明机制；② 第 23 行压掉的是什么提示、与 ① 什么关系、评审该怎么做；③ 给出修法覆盖 ① + 需求 3 + 需求 4，并说明需求 3 的重复请求在什么操作下出现；④ 至少两种验证手段。**450～650 字，四问都答，① 要写清三次触底各自的页码与列表内容。**

**提交的答案（647 字，95 分档）**

```
①首屏即加载：请求**第 1 页**，列表为第 1 页 N 条。之后三次触底：IO 只建一次，回调持有首次渲染的 `load`，闭包里 `page` 恒为 1、`items` 恒为 `[]`，**三次都请求第 1 页**，每次都重置成同样 N 条，页码 state 升到 2–5 却无人读，界面无新增。
②压掉的是 `exhaustive-deps`「依赖漏了 `load` 及它捕获的 `page`、`items`」的告警。它与 ① 互为因果：排除 `load` 才让 effect 只跑一次、闭包永久陈旧。评审要让作者说明为何能忽略；此处是掩盖缺陷，应拒绝并改 ref。
③用三个 ref 分别存页码、加载中标示、是否还有更多，`load` 写成 `useCallback(…, [])` 只读 ref，累加用 `setItems(prev => [...prev, ...res.items])`，cleanup 里断掉 IO。重复请求出现在：哨兵持续可见、IO 连续回调而上一页未返回（没有 in-flight 标记）就并发打同一页；无更多数据后仍被观察也继续打，故开头要 `if (loading || !hasMore) return;`。
④单测 mock 接口与 IO：连触三次只调第 1 页、并发被去重、items 累加、卸载时断监听；再用 E2E 快速滚动，看 Network 页码递增无重复、到底显示「没有更多了」。
```

---

## 复盘：这套卷子的出题套路

**第 1 题（50 分，找缺陷）几乎都是同一张清单在换壳**，按这个顺序过一遍基本不漏：

| 判据 | 第 1 次（CitySearch） | 第 2 次（Uploader） | 第 3 次（SmsLogin） |
|---|---|---|---|
| 单位 / 边界 | `timeout: 3` 应为毫秒 | `5*1000*1000` 应为 `5*1024*1024`；`i<=10` 取 11 条 | `>= 11` 放过 12 位、不校验纯数字 |
| 工程已有能力没用 | 该用 `useDebounce`，却引 `lodash-es` | 该用 `isAllowedImage` / `MAX_IMAGE_BYTES` | 该用 `isCnMobile` / `getDeviceFingerprint` |
| 卸载 / 清理 | debounce 未 cancel、监听没清 | 监听没清且 `off(name)` 会误删他人；`mounted` 从不置 false；`setTimeout` 不清理 | （本题无） |
| 竞态 / 串扰 | 旧请求覆盖新结果 | 全局进度事件未按任务过滤 | （本题无） |
| 错误处理 | xFetch reject 没 catch、缺提示 | — | 业务失败码 `ok:false` 没判，用户看不到服务端原因 |
| 安全 | — | — | 密钥硬编码、密钥当 fp、日志打手机号/验证码/密钥、前端落盘 token |
| 越界改动 | `.eslintrc.js` 放宽、新增依赖 | `package.json` 升框架版本且无 lockfile | 改了他页面的 `getPageId` |
| 测试被改弱 | 断言换成 `expect(true).toBe(true)` | 删掉 `.JPG` 用例 | 12 位入参改成 7 位 |

**答题格式**：每题都要求 `位置 + 缺陷类别 + 一句话修复建议`，一行一条；末尾主动声明「不报的误报项」（题目点名过的正常写法），能拦住误报扣分。

**第 2 题（100 分，分析题）**：按问分点，每点都要落到「何时何地执行 / 后果 / 为什么这种改法仍不对 / 正确做法」；处置流程题必须写顺序并给理由（先止血再查影响再改代码；先发新 key 再注销旧 key）；「怎么验证」要给两种以上手段（单测断言 + E2E/Network 观察）。

**字数**：以答题框右下角计数器为准（按字符计，中文/英文/数字/标点都算 1，换行不计）。三次分别卡 1540/3000、599/600、647/650。压字数的顺序：删修饰 → 删举例 → 保留题目点名的必答点。
