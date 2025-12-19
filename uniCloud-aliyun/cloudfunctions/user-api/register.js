const uniID = require('uni-id-common')
const db = uniCloud.database()

exports.main = async (event, context) => {
    const { username, password, email } = event

    // 检查是否已有同名用户
    const user = await db.collection('uni-id-users').where({ username }).get()
    if (user.data.length > 0) {
        return { code: 400, message: '用户名已存在' }
    }

    // 注册用户
    const res = await uniID.register({
        username,
        password,
        email
    })
    if (res.code === 0) {
        return { code: 200, message: '注册成功', data: res }
    }
    return { code: 500, message: '注册失败' }
}
