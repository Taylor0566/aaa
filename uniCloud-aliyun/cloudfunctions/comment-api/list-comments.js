'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { contentId, page = 1, pageSize = 10, token } = event;
  
  if (!contentId) {
    return { code: 400, message: '需要内容ID' };
  }
  
  let userId = null;
  
  // 1. 如果有token，验证token并获取用户ID
  if (token) {
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
      
      // 如果token无效，但不强制要求登录，只是无法获取个性化信息
      if (!userRes.data || userRes.data.length === 0 || userRes.data[0]._id !== userId) {
        console.log('token无效，将作为未登录用户处理');
        userId = null; // 重置userId，视为未登录
      }
    } catch (error) {
      console.error('token验证失败，作为未登录用户处理:', error);
      userId = null; // token验证失败，视为未登录
    }
  }
  
  try {
    // 2. 检查内容是否存在
    const content = await db.collection('contents').doc(contentId).get();
    if (!content.data || content.data.length === 0) {
      return { code: 404, message: '内容不存在' };
    }
    
    const contentData = content.data[0];
    
    // 3. 检查内容可见性
    if (contentData.visibility === 'private') {
      // 私密内容需要验证用户权限
      if (!userId) {
        return { code: 401, message: '请登录后查看私密内容' };
      }
      
      if (contentData.user_id !== userId) {
        return { code: 403, message: '无法查看私密内容的评论' };
      }
    }
    
    // 4. 计算分页
    const skip = (page - 1) * pageSize;
    
    // 5. 查询评论（按时间倒序）
    const commentsResult = await db.collection('comments')
      .where({ 
        content_id: contentId, 
        status: 'published' 
      })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();
    
    // 6. 获取评论总数
    const countResult = await db.collection('comments')
      .where({ 
        content_id: contentId, 
        status: 'published' 
      })
      .count();
    
    // 7. 获取用户信息以丰富评论数据
    let enrichedComments = commentsResult.data;
    
    // 如果有评论数据，获取评论者的用户信息
    if (enrichedComments.length > 0) {
      // 收集所有评论者的用户ID
      const userIds = enrichedComments.map(comment => comment.user_id);
      
      try {
        // 批量获取用户信息
        const usersResult = await db.collection('users')
          .where({
            _id: db.command.in(userIds)
          })
          .get();
        
        // 创建用户ID到用户信息的映射
        const userMap = {};
        if (usersResult.data && usersResult.data.length > 0) {
          usersResult.data.forEach(user => {
            // 移除敏感信息
            const { password, login_token, token_expire, ...safeUserInfo } = user;
            userMap[user._id] = safeUserInfo;
          });
        }
        
        // 丰富评论数据
        enrichedComments = enrichedComments.map(comment => {
          const enrichedComment = {
            ...comment,
            user_info: userMap[comment.user_id] || {
              _id: comment.user_id,
              username: '未知用户'
            },
            // 添加当前用户是否已点赞的标记（如果已登录）
            is_liked: false
          };
          
          // 如果是登录用户，可以添加更多个性化信息
          if (userId) {
            // 这里可以添加当前用户是否点赞了该评论的逻辑
            // 示例：
            // if (comment.liked_users && comment.liked_users.includes(userId)) {
            //   enrichedComment.is_liked = true;
            // }
            
            // 如果是自己的评论，添加标记
            if (comment.user_id === userId) {
              enrichedComment.is_owner = true;
            }
          }
          
          return enrichedComment;
        });
      } catch (userError) {
        console.warn('获取用户信息失败，继续返回基本评论数据:', userError);
        // 如果获取用户信息失败，至少确保有基本结构
        enrichedComments = enrichedComments.map(comment => ({
          ...comment,
          user_info: {
            _id: comment.user_id,
            username: '用户'
          }
        }));
      }
    }
    
    // 8. 返回响应
    return {
      code: 200,
      data: {
        comments: enrichedComments,
        average_rating: contentData.stats?.average_rating || 0,
        rating_count: contentData.stats?.rating_count || 0,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasMore: (page * pageSize) < countResult.total,
        // 如果已登录，返回用户相关信息
        current_user: userId ? {
          id: userId,
          can_comment: true // 已登录用户有评论权限
        } : {
          id: null,
          can_comment: false // 未登录用户无评论权限
        }
      },
      message: '获取成功'
    };
    
  } catch (error) {
    console.error('获取评论失败:', error);
    return { 
      code: 500, 
      message: '获取失败',
      data: error.message || '服务器内部错误'
    };
  }
};