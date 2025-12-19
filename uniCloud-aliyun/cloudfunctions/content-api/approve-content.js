const db = uniCloud.database()

exports.main = async (event, context) => {
    const { content_id, status } = event

    const allowedStatuses = ['pending', 'approved', 'rejected']
    if (!allowedStatuses.includes(status)) {
        return { code: 400, message: '无效的审核状态' }
    }

    const res = await db.collection('contents').doc(content_id).update({
        status,
        updated_at: new Date()
    })

    if (res.updated === 1) {
        return { code: 200, message: '内容审核成功' }
    }
    return { code: 500, message: '内容审核失败' }
}
