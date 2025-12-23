'use strict'

const uniID = require('uni-id-common')

exports.main = async (event, context) => {
  const { action } = event || {}
  try {
    switch (action) {
      case 'admin-register': {
        const { username, password, email } = event
        if (!username || !password) {
          return { code: 400, message: '用户名和密码不能为空' }
        }
        const regRes = await uniID.register({ username, password, email })
        if (regRes.code !== 0) {
          return { code: regRes.code || 500, message: regRes.msg || '注册失败', data: regRes }
        }
        const db = uniCloud.database()
        const dbCmd = db.command
        await db.collection('uni-id-users').doc(regRes.uid).update({
          role: dbCmd.addToSet('ADMIN'),
          status: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
        return {
          code: 200,
          message: '管理员注册成功',
          data: { uid: regRes.uid }
        }
      }
      case 'admin-login': {
        const { username, password } = event
        if (!username || !password) {
          return { code: 400, message: '用户名和密码不能为空' }
        }
        const loginRes = await uniID.login({ username, password })
        if (loginRes.code !== 0) {
          return { code: loginRes.code || 401, message: loginRes.msg || '登录失败', data: loginRes }
        }
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: loginRes.token,
            tokenExpired: loginRes.tokenExpired,
            uid: loginRes.uid
          }
        }
      }
      default:
        return { code: 400, message: '无效的操作类型' }
    }
  } catch (err) {
    console.error('[auth-api error]', err)
    return { code: 500, message: '服务器内部错误' }
  }
}
