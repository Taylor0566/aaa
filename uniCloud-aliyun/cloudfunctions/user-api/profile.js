const db = uniCloud.database()

exports.main = async (event, context) => {
    const { user_id } = event

    const res = await db.collection('uni-id-users').doc(user_id).get()

    if (res.data.length === 0) {
        return { code: 400, message: '用户未找到' }
    }

    return { code: 200, message: '获取成功', data: res.data[0] }
}
