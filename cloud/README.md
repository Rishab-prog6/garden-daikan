# 花园钥匙 · 云同步后端

一个 Cloudflare Worker + KV。服务器只存密文（端到端加密在浏览器完成），
没有账号、没有任何个人信息。

## 部署（一次性，约 5 分钟）

```bash
cd cloud
npx wrangler login                       # 浏览器里授权（免费 Cloudflare 账号即可）
npx wrangler kv namespace create GARDEN  # 输出一个 id
# 把输出的 id 填进 wrangler.toml 的 REPLACE_WITH_KV_ID
npx wrangler deploy                      # 输出 https://daikan-garden-sync.<你的子域>.workers.dev
```

拿到 workers.dev 地址后，把它填进 `src/lib/cloud.ts` 的 `PROD_API`，重新构建部署前端即可。

## 本地联调

```bash
npx wrangler dev cloud/worker.js --port 8787
```

前端 dev 模式默认连 `http://localhost:8787`。

## 已知事项

- `*.workers.dev` 在中国大陆部分网络下访问不稳定；绑自定义域名可改善（Cloudflare 控制台一键）。
- 数据按"钥匙的哈希"存放；服务端无法枚举或解密任何花园。
- 用户「关闭云同步」只删本机钥匙；云端密文保留（没钥匙等于乱码）。
