const crypto = require('crypto')
// const uniIdCommon = require('uni-id-common') // ❌ 移除依赖

function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const iterations = 100000
  const digest = 'sha256'
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, digest)
  return { saltHex: salt.toString('hex'), hashHex: hash.toString('hex'), iterations, digest }
}

function verifyPassword({ password, saltHex, hashHex, iterations, digest }) {
  try {
    if (!saltHex || !hashHex) return false
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, digest)
    return crypto.timingSafeEqual(actual, expected)
  } catch (e) {
    return false
  }
}

function base64urlEncode(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlEncodeJson(obj) {
  return base64urlEncode(JSON.stringify(obj))
}

function base64urlDecodeJson(input) {
  let str = String(input || '').replace(/-/g, '+').replace(/_/g, '/')
  const pad = 4 - (str.length % 4)
  if (pad !== 4) str += '='.repeat(pad)
  return JSON.parse(Buffer.from(str, 'base64').toString('utf-8'))
}

function signHs256(data, secret) {
  return base64urlEncode(crypto.createHmac('sha256', secret).update(data).digest('base64'))
}

function createJwtHs256(payload, secret, expiresInSeconds) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, iat: nowSeconds, exp: nowSeconds + Number(expiresInSeconds || 0) }
  const encoded = `${base64urlEncodeJson(header)}.${base64urlEncodeJson(body)}`
  return `${encoded}.${signHs256(encoded, secret)}`
}

function verifyJwtHs256(token, secret) {
  if (typeof token !== 'string') throw new Error('Token无效，请重新登录')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Token无效，请重新登录')
  const [h, p, s] = parts
  const signed = `${h}.${p}`
  const expected = signHs256(signed, secret)
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(s)
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error('Token无效，请重新登录')
  }
  const header = base64urlDecodeJson(h)
  if (header?.alg !== 'HS256' || header?.typ !== 'JWT') throw new Error('Token无效，请重新登录')
  const payload = base64urlDecodeJson(p)
  if (payload?.exp && payload.exp * 1000 < Date.now()) throw new Error('未登录或Token失效')
  return payload
}

function getAdminTokenConfig(clientInfo) {
  // Normalize appId from context (APPID) or clientInfo (appId)
  const appId = clientInfo?.appId || clientInfo?.APPID
  
  // ✅ 直接读取 uni-config-center 配置，不使用 uni-id-common
  let config = {}
  try {
    const createConfig = require('uni-config-center')
    const uniIdConfig = createConfig({ pluginId: 'uni-id' })
    config = uniIdConfig.config()
  } catch(e) {
    console.warn('Failed to load uni-id config from uni-config-center', e)
  }

  let appConfig = config
  if (Array.isArray(config)) {
    appConfig =
      config.find((c) => c && c.dcloudAppid && c.dcloudAppid === appId) ||
      config.find((c) => c && c.isDefaultConfig) ||
      config[0]
  }
  appConfig = appConfig || {}

  // 兜底策略：如果未配置 tokenSecret，则生成一个临时的
  const fallbackSecret = 'temp_admin_secret_' + new Date().getFullYear()
  const secret = appConfig.tokenSecret || fallbackSecret

  return {
    tokenSecret: secret,
    tokenExpiresIn: Number(appConfig.tokenExpiresIn || 7200),
  }
}

function createAdminToken({ uid, role }, clientInfo) {
  const { tokenSecret, tokenExpiresIn } = getAdminTokenConfig(clientInfo)
  if (!tokenSecret) throw new Error('未配置 tokenSecret')
  const token = createJwtHs256({ uid, role }, tokenSecret, tokenExpiresIn)
  return { token, tokenExpired: Date.now() + tokenExpiresIn * 1000 }
}

function verifyAdminToken(token, clientInfo) {
  const { tokenSecret } = getAdminTokenConfig(clientInfo)
  if (!tokenSecret) throw new Error('未配置 tokenSecret')
  return verifyJwtHs256(token, tokenSecret)
}

module.exports = {
  hashPassword,
  verifyPassword,
  createAdminToken,
  verifyAdminToken
}
