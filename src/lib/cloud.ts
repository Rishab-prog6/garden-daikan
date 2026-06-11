// 花园钥匙 · 云同步（端到端加密）
// 钥匙只存在用户本机；由钥匙派生两样东西：
//   - 存储 id   = SHA-256('daikan-id:' + 钥匙)   —— 服务器用它放密文，反推不回钥匙
//   - 加密密钥  = PBKDF2(钥匙, 'daikan-enc') → AES-GCM 256 —— 服务器永远见不到
// 所以服务端拿到的只是一坨乱码；钥匙丢了，谁也解不开（包括我们）。
import type { GardenState } from '../types'
import { parseBackup } from './storage'

/** 后端地址：本地联调用 wrangler dev；部署后把 PROD_API 换成真实 workers.dev 地址 */
const PROD_API = 'REPLACE_AFTER_DEPLOY'
export const API: string =
  (import.meta.env.VITE_SYNC_API as string | undefined)
  ?? (import.meta.env.DEV ? 'http://localhost:8787' : PROD_API)

export const cloudReady = () => API !== 'REPLACE_AFTER_DEPLOY'

const enc = new TextEncoder()
const dec = new TextDecoder()

/** Crockford base32（去掉易混淆字符），160 bit 熵 */
const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'

export function genKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  let bits = 0
  let acc = 0
  let out = ''
  for (const b of bytes) {
    acc = (acc << 8) | b
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(acc >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  // garden-xxxx-xxxx-… 分组好抄写
  return 'garden-' + (out.match(/.{1,4}/g) ?? []).join('-')
}

/** 宽容解析用户输入的钥匙：大小写/空格/横线都不计较 */
export function normalizeKey(input: string): string | null {
  const core = input.toLowerCase().replace(/^garden/, '').replace(/[^0-9a-z]/g, '')
  if (core.length !== 32) return null
  for (const c of core) if (!ALPHABET.includes(c)) return null
  return 'garden-' + (core.match(/.{1,4}/g) ?? []).join('-')
}

async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const storageIdOf = (key: string) => sha256hex('daikan-id:' + key)

async function aesKeyOf(key: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(key), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('daikan-enc-v1'), iterations: 310_000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
function unb64(s: string): Uint8Array {
  const bin = atob(s)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
  return u
}

export interface CloudPayload {
  state: GardenState
  savedAt: number
}

async function encrypt(key: string, payload: CloudPayload): Promise<string> {
  const aes = await aesKeyOf(key)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, enc.encode(JSON.stringify(payload)))
  return `v1:${b64(iv)}:${b64(new Uint8Array(ct))}`
}

async function decrypt(key: string, blob: string): Promise<CloudPayload | null> {
  try {
    const [v, ivb, ctb] = blob.split(':')
    if (v !== 'v1') return null
    const aes = await aesKeyOf(key)
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(ivb) as BufferSource }, aes, unb64(ctb) as BufferSource)
    const parsed = JSON.parse(dec.decode(pt)) as { state?: unknown; savedAt?: unknown }
    const state = parseBackup(JSON.stringify(parsed.state))
    if (!state) return null
    return { state, savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0 }
  } catch {
    return null // 钥匙不对 / 数据损坏，都当无事发生
  }
}

/** 推：加密整座花园 → PUT。成功返回 savedAt */
export async function pushGarden(key: string, state: GardenState): Promise<number> {
  const savedAt = Date.now()
  const blob = await encrypt(key, { state, savedAt })
  const id = await storageIdOf(key)
  const r = await fetch(`${API}/g/${id}`, { method: 'PUT', body: blob })
  if (!r.ok) throw new Error(`push ${r.status}`)
  return savedAt
}

/** 拉：GET → 解密。404 返回 null（这把钥匙还没存过东西） */
export async function pullGarden(key: string): Promise<CloudPayload | null> {
  const id = await storageIdOf(key)
  const r = await fetch(`${API}/g/${id}`)
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`pull ${r.status}`)
  return decrypt(key, await r.text())
}

// —— 本机钥匙/同步元信息（与花园数据分开存,绝不进同步包） ——
const KEY_SLOT = 'daikan-garden:cloudkey'
const META_SLOT = 'daikan-garden:cloudmeta'

export const loadCloudKey = (): string | null => {
  try { return localStorage.getItem(KEY_SLOT) } catch { return null }
}
export const saveCloudKey = (k: string | null) => {
  try { k === null ? localStorage.removeItem(KEY_SLOT) : localStorage.setItem(KEY_SLOT, k) } catch { /* 隐私模式 */ }
}
export const loadLastSavedAt = (): number => {
  try { return Number(localStorage.getItem(META_SLOT)) || 0 } catch { return 0 }
}
export const saveLastSavedAt = (t: number) => {
  try { localStorage.setItem(META_SLOT, String(t)) } catch { /* 同上 */ }
}
