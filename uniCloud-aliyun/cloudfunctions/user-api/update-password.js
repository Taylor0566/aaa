const uniID = require('uni-id-common')

exports.main = async (event, context) => {
    const { user_id, old_password, new_password } = event

    // 校验当前密码
    const res = await uniID.checkPassword({
        user_id,
        password: old_password
    })

    if (res.code !== 0) {
        return { code: 400, message: '原密码错误' }
    }

    // 更新密码
    const updateRes = await uniID.updatePassword({
        user_id,
        password: new_password
    })

    if (updateRes.code === 0) {
        return { code: 200, message: '密码更新成功' }
    }
    return { code: 500, message: '密码更新失败' }
}
