# CLAUDE.md — 待看花园 项目上下文

> 这份文件是给 Claude Code 的项目记忆。每次会话先读它再动手。

## 一句话

把 B 站待看清单变成一片会开花、会枯萎的花园：种下想看的视频是 🌱，看完就开花 🌸，
拖着不看会逐渐枯萎 🥀。**build in bilibili · AI 创造公开赛** 的参赛作品。

## 比赛背景（会影响产品决策，别只当普通项目做）

- 这是 B 站「AI 创造公开赛」(2026/6/5 启动，**8/20 投稿+投币统计截止**，9/5 颁奖)。
- 评奖看**观众投币数**，投币数前 10 入围，冠军独享 100 万。
- 核心理念「公开做产品，观众即用户」：开发过程要在 B 站连载，**弹幕评论区就是需求池**。
- 因此功能优先级排序时，优先考虑：① 能让观众"想自己用一下"从而投币的功能；
  ② 演示/录屏时好看、有梗的功能。纯工程洁癖排后面。
- 产品里已内置「弹幕共建 · 功能许愿池」，下期做什么由弹幕投票决定——所以路线图是活的，
  可能随观众反馈调整。

## 技术栈 & 怎么跑

- **Vite + React 18 + TypeScript**，纯前端，无后端。
- 持久化用浏览器 `localStorage`（key: `daikan-garden:state`）。
- 命令：`npm install` → `npm run dev`（localhost:5173）；`npm run build` 出静态站到 `dist/`。
- 目标是能 build 成静态站部署，方便冲 B 站「Toy」网页内测，**不要引入需要服务端的依赖**。

## 目录结构与职责

```
src/
  main.tsx            入口
  App.tsx             页面主组装 + toast 状态
  index.css           全部样式；颜色/圆角等 token 都在 :root 的 CSS 变量里
  types.ts            数据类型：Plant / GardenState / Status
  lib/
    garden.ts         纯逻辑：枯萎阶段 statusOf、等级 level、经验 xpInLevel、SPRITE 映射
    storage.ts        loadState / saveState（localStorage，含容错）
  hooks/
    useGarden.ts      状态 + addPlant/finish/remove/fastForward/reset；首次打开会 seed 几株草
  components/
    Header Stats AddPlant PlantCard Garden Wishlist Footer Toast
```

## 数据模型 & 关键逻辑（改动前先看 `src/types.ts` 和 `src/lib/garden.ts`）

- `Plant = { id, title, link, addedAt, watchedAt }`。`watchedAt` 为 null 表示还没看。
- 枯萎阈值：等待 `>=3` 天 → 枯萎中(wilt)，`>=7` 天 → 快枯了(crit)。常量在 `garden.ts`。
- 看完 +10 XP；把已 crit 的救回来给 +25 XP（"起死回生"）。
- 演示模式 `demoOffset`：录屏时按"⏩ 快进 3 天"加偏移，让草当场枯给观众看。
  **正式公开版上线前要能一键隐藏这个调试入口**（不要删逻辑，做成可关）。

## 代码约定 / 红线

- TypeScript `strict` 已开，保持零类型错误（CI 心态：改完跑一次 `npm run build`）。
- 样式走 `index.css` 里的 CSS 变量，别硬编码色值，别引入 UI 组件库或 Tailwind（保持轻）。
- 改 `localStorage` 数据结构时**保持向后兼容**：老用户的花园不能因为升级被清空（`storage.ts`
  里已有字段容错，加字段请走可选 + 默认值）。
- 组件保持小而单一职责，逻辑尽量放 `lib/` 或 hook，别堆进 JSX。
- **隐私红线：绝不读取/存储/传输用户的 B 站登录凭证（cookie、SESSDATA、密码、token）。**
  导入功能一律走"用户主动粘贴公开信息"或"浏览器扩展读页面"这类不碰登录态的方案（见 TASK-01）。
- 不做需要服务端代理的方案，除非先和我（用户）确认——会破坏静态部署。

## 连载路线图（大局，别一次做完，按期推进）

- #0 立项：收藏夹故事 + 展示原型 + 弹幕投票起名（已有原型）
- **#1 导入：从 B 站把视频批量种进花园 ← 当前任务，见 docs/TASK-01-import.md**
- #2 枯萎前提醒（浏览器通知 / 私信思路）
- #3 花园美术升级（像素/水彩/赛博，风格弹幕选）+ 截图分享
- #4 好友花园 PK / 社交
- #5–#7 成就系统、数据回顾、按许愿池票数补功能
- #8–#9 上线人人可用的公开版（冲 Toy 内测）+ 冲刺投币

## 工作方式

- 动手前先把实现计划列出来给用户确认，再写代码。
- 每完成一个功能：跑 `npm run build` 确认通过；用一两句写清"改了哪些文件、加了什么、怎么验"，
  方便用户拿去和 Chat 版 Claude 复盘策略。
- 用 git 小步提交，提交信息写清楚；不要 `git push --force`，不要碰 `.env` 或任何密钥。
- 不确定的产品取舍（尤其影响观众体验的）先问用户，别自作主张。
