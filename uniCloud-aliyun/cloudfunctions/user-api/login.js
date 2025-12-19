const uniID = require('uni-id-common')

exports.main = async (event, context) => {
    const { username, password } = event

    const res = await uniID.login({
        username,
        password
    })

    if (res.code === 0) {
        return { code: 200, message: '登录成功', data: res }
    }
    return { code: 400, message: '用户名或密码错误' }
}
