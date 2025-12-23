'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const collection = db.collection('contents');
  
  const { content_id } = event;
  
  if (!content_id) {
    return {
      code: 400,
      message: '内容ID不能为空',
      data: null
    };
  }
  
  try {
    // 获取内容
    const contentRes = await collection.doc(content_id).get();
    if (!contentRes.data || contentRes.data.length === 0) {
      return {
        code: 404,
        message: '内容不存在',
        data: null
      };
    }
    
    const content = contentRes.data[0];
    
    // 权限检查：只能删除自己的内容
    if (content.user_id !== context.UID) {
      return {
        code: 403,
        message: '只能删除自己的内容',
        data: null
      };
    }
    
    // 软删除：标记删除时间
    await collection.doc(content_id).update({
      deleted_at: new Date(),
      updated_at: new Date()
    });
    
    return {
      code: 200,
      message: '内容删除成功',
      data: null
    };
  } catch (error) {
    console.error('删除内容失败:', error);
    return {
      code: 500,
      message: '删除内容失败',
      data: null
    };
  }
};