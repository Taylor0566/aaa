'use strict';

exports.main = async (event, context) => {
  const { action, data = {} } = event;
  
  try {
    console.log(`[Content API] Action: ${action}, User: ${context.UID || 'anonymous'}`);
    
    // 根据action动态加载对应模块
    switch (action) {
      // 内容创建
      case 'create':
        const createContent = require('./create-content.js');
        return await createContent.main(data, context);
      
      // 内容获取/查询
      case 'get':
        const getContent = require('./get-content.js');
        return await getContent.main(data, context);
      
      // 内容更新
      case 'update':
        const updateContent = require('./update-content.js');
        return await updateContent.main(data, context);
      
      // 内容删除
      case 'delete':
        const deleteContent = require('./delete-content.js');
        return await deleteContent.main(data, context);
      
      default:
        return {
          code: 400,
          message: '无效的操作类型',
          data: null
        };
    }
  } catch (error) {
    console.error(`[Content API Error] ${error.message}`, error);
    return {
      code: 500,
      message: `服务器内部错误: ${error.message}`,
      data: null
    };
  }
};