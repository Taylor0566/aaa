const db = uniCloud.database()

exports.main = async (event, context) => {
    const { title, content, user_id, tags } = event

    const contentData = {
        title,
        content,
        user_id,
        tags,
        status: 'pending',  // 默认内容状态为待审核
        created_at: new Date(),
        updated_at: new Date()
    }

    const res = await db.collection('contents').add(contentData)

    if (res._id) {
        return { code: 200, message: '内容创建成功', data: res }
    }
    return { code: 500, message: '内容创建失败' }
}
