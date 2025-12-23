'use strict';


exports.main = async (event, context) => {
  const db = uniCloud.database();
  const collection = db.collection('contents');
  
  const {
    title = '',
    text_content = '',
    content_type = 'text', // text, image, video
    media_files = [],     // 图片或视频文件
    tags = [],           // 标签
    visibility = 'public' // 可见性
  } = event;
  
  // 验证用户是否登录
  if (!context.UID) {
    return {
      code: 401,
      message: '请先登录',
      data: null
    };
  }
  
  // 验证必要参数：必须有标题或文本内容或媒体文件
  if (!title.trim() && !text_content.trim() && media_files.length === 0) {
    return {
      code: 400,
      message: '标题、文本内容或媒体文件至少需要一项',
      data: null
    };
  }
  
  try {
    // 构建内容数据
    const contentData = {
      user_id: context.UID, // 发布者ID
      title: title.trim(),
      text_content: text_content.trim(),
      content_type,
      media_files: media_files.map(file => ({
        url: file.url || '',
        file_type: file.file_type || '',
        thumbnail: file.thumbnail || '',
        duration: file.duration || 0,
        size: file.size || 0
      })),
      tags: tags.slice(0, 10), // 最多10个标签
      visibility,
      
      // 统计信息
      stats: {
        view_count: 0,
        like_count: 0,
        comment_count: 0
      },
      
      // 时间戳
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null
    };
    
    // 保存到数据库
    const result = await collection.add(contentData);
    
    return {
      code: 200,
      message: '内容创建成功',
      data: {
        content_id: result.id,
        ...contentData
      }
    };
  } catch (error) {
    console.error('创建内容失败:', error);
    return {
      code: 500,
      message: '创建内容失败',
      data: null
    };
  }
};