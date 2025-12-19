const db = uniCloud.database()

exports.main = async (event, context) => {
    const { content_id } = event

    const res = await db.collection('contents').doc(content_id).remove()

    if (res.deleted === 1) {
        return { code: 200, message: '内容删除成功' }
    }
    return { code: 500, message: '内容删除失败' }
}
