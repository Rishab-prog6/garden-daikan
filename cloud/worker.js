// 花园钥匙 · 云同步后端 —— 一个极简 KV 存储,只见密文,不识钥匙。
// 安全模型:
//   - 客户端用钥匙派生 AES-GCM 密钥加密整包花园数据,这里只存 base64 密文
//   - 存储 id 是 SHA-256(钥匙) 的十六进制 —— 由钥匙可算出 id,反推不回钥匙
//   - 没有账号、没有任何个人信息;能算出 id 的人(=持钥人)才能读写那条记录
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
    }
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

    const m = new URL(req.url).pathname.match(/^\/g\/([a-f0-9]{64})$/)
    if (!m) return new Response('not found', { status: 404, headers: cors })
    const key = 'g:' + m[1]

    if (req.method === 'GET') {
      const v = await env.GARDEN.get(key)
      if (v === null) return new Response('', { status: 404, headers: cors })
      return new Response(v, { headers: { ...cors, 'content-type': 'text/plain' } })
    }

    if (req.method === 'PUT') {
      const body = await req.text()
      // 一座花园的密文撑死几百 KB;再大就不是花园是攻击了
      if (body.length > 400_000) return new Response('too big', { status: 413, headers: cors })
      if (!/^v1:/.test(body)) return new Response('bad payload', { status: 400, headers: cors })
      await env.GARDEN.put(key, body)
      return new Response('ok', { headers: cors })
    }

    return new Response('method not allowed', { status: 405, headers: cors })
  },
}
