'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { commentId, token } = event;
  
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
  if (!commentId) {
    return { code: 400, message: '需要评论ID' };
  }
  
  try {
    // 3. 获取评论信息
    const comment = await db.collection('comments').doc(commentId).get();
    if (!comment.data || comment.data.length === 0) {
      return { code: 404, message: '评论不存在' };
    }
    
    const commentData = comment.data[0];
    
    // 4. 检查权限（用户只能删除自己的评论）
    if (commentData.user_id !== userId) {
      return { code: 403, message: '只能删除自己的评论' };
    }
    
    // 5. 删除评论
    await db.collection('comments').doc(commentId).remove();
    
    // 6. 更新内容的评论数和评分统计
    const contentId = commentData.content_id;
    
    try {
      // 获取当前内容数据
      const contentResult = await db.collection('contents').doc(contentId).get();
      
      if (contentResult.data && contentResult.data.length > 0) {
        const currentContent = contentResult.data[0];
        const currentStats = currentContent.stats || {};
        
        // 计算新的统计数据
        let updateData = {
          updated_at: Date.now()
        };
        
        // 更新评论数
        const newCommentCount = Math.max(0, (currentStats.comment_count || 0) - 1);
        updateData['stats.comment_count'] = newCommentCount;
        
        // 如果有评分，更新评分统计
        if (commentData.rating) {
          const currentRatingCount = currentStats.rating_count || 0;
          const currentAvg = currentStats.average_rating || 0;
          
          if (currentRatingCount > 1) {
            const newRatingCount = currentRatingCount - 1;
            const newAvg = ((currentAvg * currentRatingCount) - commentData.rating) / newRatingCount;
            updateData['stats.average_rating'] = parseFloat(newAvg.toFixed(1));
            updateData['stats.rating_count'] = newRatingCount;
          } else {
            // 如果只有这一个评分，删除后重置为0
            updateData['stats.average_rating'] = 0;
            updateData['stats.rating_count'] = 0;
          }
        }
        
        // 确保stats对象存在
        if (!currentContent.stats) {
          updateData.stats = {
            comment_count: newCommentCount,
            rating_count: 0,
            average_rating: 0,
            like_count: currentStats.like_count || 0
          };
        }
        
        await db.collection('contents').doc(contentId).update(updateData);
      }
    } catch (contentError) {
      // 如果内容不存在或更新失败，记录错误但不影响评论删除
      console.warn('更新内容统计失败:', contentError);
    }
    
    
    // 7. 返回成功响应
    return {
      code: 200,
      message: '删除成功',
      data: {
        commentId,
        contentId,
        deletedAt: Date.now()
      }
    };
    
  } catch (error) {
    console.error('删除评论失败:', error);
    return {
      code: 500,
      message: '删除失败',
      data: error.message || '服务器内部错误'
    };
  }
};