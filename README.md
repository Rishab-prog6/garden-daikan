# 待看花园

把 B 站待看清单变成一座会开花、会枯萎的花园。

种下想看的视频是草，看完就开花；拖太久会枯萎。项目用于 `build in bilibili · AI 创造公开赛`，核心目标是把“公开做产品，观众即用户”做成一个真的可用工具。

## 当前功能

- 单条种草：手动添加想看的视频标题或链接。
- 批量导入：把 B 站链接/标题文本批量种进花园。
- 同步进度：用户主动粘贴观看记录文本后，匹配已有视频并更新进度。
- 今日推荐：优先提醒快枯萎、拖得最久的视频。
- 日历排期：把待看的视频拖到具体日期。
- 开花与 XP：看完视频后开花、加经验、维护 streak。
- 成就系统：第一朵花、濒危抢救员、排期园丁、三日浇水等。
- 分享卡：生成花园周报图，方便发动态或录屏传播。
- 备份导入/导出：本地 JSON 备份。
- 花园钥匙云同步：Cloudflare Worker + KV 存密文，前端 WebCrypto 端到端加密。
- 弹幕共建许愿池：把观众投票变成下一期路线图。

## 隐私设计

- 不读取、不存储、不上传 B 站账号凭据。
- 不需要 cookie、SESSDATA、密码或 token。
- B 站历史记录不会自动上传；“同步进度”只处理用户主动粘贴进来的文本。
- 云同步只上传加密后的整包 `GardenState`。
- 同一把花园钥匙可以在不同设备恢复同一座花园；钥匙丢失后服务端也无法解密。

## 本地运行

```powershell
npm install
npm run dev
```

前端默认地址：

```text
http://127.0.0.1:5173/
```

录屏演示模式：

```text
http://127.0.0.1:5173/?demo=1
```

## 本地云同步后端

```powershell
cd cloud
..\node_modules\.bin\wrangler.cmd dev --port 8787
```

前端 dev 模式会默认连接：

```text
http://localhost:8787
```

注意：`8787` 是 Worker API，不是页面。页面仍然打开 `5173`。

## 构建

```powershell
npm run build
```

构建产物在 `dist/`。

## 部署云同步

```powershell
cd cloud
npx wrangler login
npx wrangler kv namespace create GARDEN
npx wrangler deploy
```

然后把 KV namespace id 填入 `cloud/wrangler.toml`，把 Worker 地址配置到前端：

- 开发/部署环境变量：`VITE_SYNC_API=https://你的-worker.workers.dev`
- 或临时改 `src/lib/cloud.ts` 里的 `PROD_API`

## 参赛叙事

这不是一个“收藏夹管理器”，而是一个公开生长的产品实验：

- 观众评论区提出需求。
- 项目把高频需求放进许愿池。
- 下一期功能由弹幕和投币反馈决定。
- 每次迭代都能录屏展示一个可见变化。
