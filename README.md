# 待看花园 · 待看花园 (daikan-garden)

> 把 B 站待看清单变成一片会开花、会枯萎的花园。
> 看完一个视频它就开花 🌸，拖着不看它会慢慢枯萎 🥀。
> **build in bilibili · AI 创造公开赛** 参赛作品 — 公开做产品，观众即用户。

技术栈：**Vite + React + TypeScript**。纯前端，build 出来是静态站，方便部署，也方便冲 B 站「Toy」网页内测。

---

## 放到 D 盘并运行（Windows）

1. 把这个 `daikan-garden` 文件夹解压 / 复制到 `D:\` 下，例如 `D:\daikan-garden\`。
2. 先装好 [Node.js](https://nodejs.org/)（建议 18 以上）。
3. 打开终端（PowerShell / CMD / 或 VS Code 里的终端），切到项目目录：
   ```bash
   cd /d D:\daikan-garden
   npm install
   npm run dev
   ```
4. 浏览器打开终端里给出的地址（一般是 `http://localhost:5173`），就能玩了。

数据存在浏览器 `localStorage` 里，关掉再开花园还在。

---

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，改代码自动热更新 |
| `npm run build` | 打包到 `dist/`，得到可部署的静态站 |
| `npm run preview` | 本地预览打包后的结果 |

---

## 目录结构

```
src/
  main.tsx            入口
  App.tsx             页面主组装
  index.css           全部样式（CSS 变量在 :root）
  types.ts            数据类型：Plant / GardenState
  lib/
    garden.ts         核心逻辑：枯萎阶段、等级、经验曲线
    storage.ts        localStorage 读写
  hooks/
    useGarden.ts      状态 + 增删 / 看完 / 快进 / 重置
  components/
    Header / Stats / AddPlant / PlantCard / Garden / Wishlist / Footer / Toast
```

---

## 玩法 & 机制

- **种下**：把想看的视频加进花园，初始是 🌱。
- **看完了**：点一下 → 开花 🌸 + 涨经验升级。
- **枯萎**：超过 3 天没看开始枯萎，超过 7 天「快枯了」并标红催你。把快枯的救回来有「起死回生」额外经验。
- **演示模式 · ⏩ 快进 3 天**：录屏时用，按一下就能让草当场枯给观众看。正式上线前可以隐藏掉。
- **弹幕共建 · 功能许愿池**：下期做什么由弹幕投票决定 —— 这是参赛的核心互动机制。

---

## 连载路线图（到 8/20 截止，约 10 期）

- #0 立项：收藏夹故事 + 展示原型 + 弹幕投票起名
- #1 接 B 站收藏夹自动导入
- #2 枯萎前提醒（私信 / 推送）
- #3 花园美术升级（风格弹幕选）+ 截图分享
- #4 好友花园 PK
- #5–#7 成就系统、数据回顾、按许愿池补功能
- #8–#9 上线公开版（冲 Toy 内测）+ 冲刺投币

发稿记得带话题 `#B站AI创造公开赛`，标题后缀 `【B站AI创造公开赛】`，并把同一产品的视频建成合集。
