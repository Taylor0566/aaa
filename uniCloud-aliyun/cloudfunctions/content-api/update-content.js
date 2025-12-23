'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const collection = db.collection('contents');
  
  const { content_id, update_data } = event;
  
  // 验证参数
  if (!content_id) {
    return {
      code: 400,
      message: '内容ID不能为空',
      data: null
    };
  }
  
  if (!update_data || typeof update_data !== 'object') {
    return {
      code: 400,
      message: '更新数据不能为空',
      data: null
    };
  }
  
  try {
    // 获取原始内容
    const contentRes = await collection.doc(content_id).get();
    if (!contentRes.data || contentRes.data.length === 0) {
      return {
        code: 404,
        message: '内容不存在',
        data: null
      };
    }
    
    const content = contentRes.data[0];
    
    // 权限检查：只能修改自己的内容
    if (content.user_id !== context.UID) {
      return {
        code: 403,
        message: '只能修改自己的内容',
        data: null
      };
    }
    
    // 构建更新数据（只更新允许的字段）
    const allowedFields = ['title', 'text_content', 'tags', 'visibility', 'media_files'];
    const updateData = {
      updated_at: new Date()
    };
    
    // 只更新允许的字段
    Object.keys(update_data).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = update_data[key];
      }
    });
    
    // 如果更新了标签，限制数量
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = updateData.tags.slice(0, 10);
    }
    
    // 执行更新
    await collection.doc(content_id).update(updateData);
    
    return {
      code: 200,
      message: '内容更新成功',
      data: null
    };
  } catch (error) {
    console.error('更新内容失败:', error);
    return {
      code: 500,
      message: '更新内容失败',
      data: null
    };
  }
};