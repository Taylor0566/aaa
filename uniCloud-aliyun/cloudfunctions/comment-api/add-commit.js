'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { contentId, commentContent, rating, token } = event;
  
  // 1. 验证token并获取用户ID
  if (!token) {
    return { code: 401, message: '请先登录' };
  }
  
  let userId = null;
  
  try {
    // 从token中解析用户ID（token格式为 "用户ID:时间戳:随机字符串"）
    const tokenParts = token.split(':');
    if (tokenParts.length >= 1) {
      userId = tokenParts[0];
    }
    
    // 验证token是否有效
    const userRes = await db.collection('users')
      .where({
        login_token: token,
        token_expire: db.command.gt(Date.now())  // token未过期
      })
      .get();
    
    if (!userRes.data || userRes.data.length === 0) {
      return { code: 401, message: '登录已过期，请重新登录' };
    }
    
    // 确保userId与token中的一致
    if (userRes.data[0]._id !== userId) {
      return { code: 401, message: '登录信息无效' };
    }
    
  } catch (error) {
    console.error('token验证失败:', error);
    return { code: 401, message: '登录验证失败' };
  }
  
  // 2. 参数验证
  if (!contentId || !commentContent) {
    return { code: 400, message: '参数不全' };
  }
  
  if (rating && (rating < 1 || rating > 5)) {
    return { code: 400, message: '评分必须在1-5分之间' };
  }
  
  try {
    // 3. 检查内容是否存在
    const content = await db.collection('contents').doc(contentId).get();
    if (!content.data || content.data.length === 0) {
      return { code: 404, message: '内容不存在' };
    }
    
    const contentData = content.data[0];
    
    // 4. 检查内容可见性
    if (contentData.visibility === 'private' && contentData.user_id !== userId) {
      return { code: 403, message: '无法评论私密内容' };
    }
    
    // 5. 创建评论数据
    const commentData = {
      content_id: contentId,
      content_user_id: contentData.user_id,
      user_id: userId,
      comment_content: commentContent,
      rating: rating || null,
      like_count: 0,
      reply_count: 0,
      status: 'published',
      created_at: Date.now(),
      updated_at: Date.now(),
      comment_ip: context.CLIENTIP || '未知'
    };
    
    // 6. 添加评论
    const result = await db.collection('comments').add(commentData);
    
    // 7. 更新内容的统计信息
    const updateData = {
      updated_at: Date.now()
    };
    
    // 获取当前内容数据
    const contentResult = await db.collection('contents').doc(contentId).get();
    const currentContent = contentResult.data[0] || {};
    const currentStats = currentContent.stats || {};
    
    // 更新评论数
    const newCommentCount = (currentStats.comment_count || 0) + 1;
    updateData['stats.comment_count'] = newCommentCount;
    
    // 如果有评分，更新评分统计
    if (rating) {
      const currentRatingCount = currentStats.rating_count || 0;
      const currentAvg = currentStats.average_rating || 0;
      
      const newRatingCount = currentRatingCount + 1;
      const newAvg = ((currentAvg * currentRatingCount) + rating) / newRatingCount;
      
      updateData['stats.average_rating'] = parseFloat(newAvg.toFixed(1));
      updateData['stats.rating_count'] = newRatingCount;
    }
    
    // 确保stats对象存在
    if (!currentContent.stats) {
      updateData.stats = {
        comment_count: newCommentCount,
        rating_count: rating ? 1 : 0,
        average_rating: rating ? rating : 0,
        like_count: currentStats.like_count || 0
      };
    }
    
    await db.collection('contents').doc(contentId).update(updateData);
    
    // 8. 返回成功响应
    return {
      code: 200,
      message: '评论成功',
      data: { 
        commentId: result.id,
        commentData: {
          ...commentData,
          _id: result.id,
          user_info: {  // 可以返回用户基本信息（可选）
            _id: userId
            // 可以根据需要添加其他字段
          }
        }
      }
    };
    
  } catch (error) {
    console.error('添加评论失败:', error);
    return { 
      code: 500, 
      message: '评论失败',
      data: error.message || '服务器内部错误'
    };
  }
};