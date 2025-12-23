'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
  const { contentId, token } = event;
  
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
      
      // 如果token无效，但不强制要求登录，只是无法获取用户个人评分
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
        return { code: 401, message: '请登录后查看私密内容的评分' };
      }
      
      if (contentData.user_id !== userId) {
        return { code: 403, message: '无法查看私密内容的评分' };
      }
    }
    
    // 4. 获取所有评分评论
    const ratingStats = await db.collection('comments')
      .where({ 
        content_id: contentId, 
        status: 'published',
        rating: db.command.neq(null)  // 只获取有评分的评论
      })
      .field({ 
        rating: true, 
        user_id: true,
        created_at: true,
        comment_content: true
      })
      .orderBy('created_at', 'desc')
      .get();
    
    // 5. 计算评分分布和统计
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let userRating = null;
    let recentRatings = [];
    let totalRating = 0;
    
    ratingStats.data.forEach((item, index) => {
      const rating = item.rating;
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
        totalRating += rating;
      }
      
      // 收集最近5条评分记录（可选）
      if (index < 5) {
        recentRatings.push({
          rating: rating,
          created_at: item.created_at
        });
      }
      
      // 如果是当前用户，记录评分
      if (userId && item.user_id === userId && rating !== null) {
        userRating = {
          rating: rating,
          created_at: item.created_at,
          comment_content: item.comment_content || ''
        };
      }
    });
    
    // 6. 计算评分百分比
    const totalRatings = ratingStats.data.length;
    const percentageDistribution = {};
    if (totalRatings > 0) {
      for (let i = 1; i <= 5; i++) {
        percentageDistribution[i] = {
          count: distribution[i],
          percentage: Math.round((distribution[i] / totalRatings) * 100)
        };
      }
    } else {
      for (let i = 1; i <= 5; i++) {
        percentageDistribution[i] = {
          count: 0,
          percentage: 0
        };
      }
    }
    
    // 7. 获取内容基本信息
    const stats = contentData.stats || {};
    
    // 8. 可选：获取用户信息（如果需要显示评分用户的详细信息）
    let userRatingDetails = null;
    if (userRating) {
      try {
        const userRes = await db.collection('users')
          .doc(userId)
          .field({
            _id: true,
            username: true,
            avatar: true
          })
          .get();
        
        if (userRes.data && userRes.data.length > 0) {
          userRating = {
            ...userRating,
            user_info: {
              _id: userRes.data[0]._id,
              username: userRes.data[0].username,
              avatar: userRes.data[0].avatar || null
            }
          };
        }
      } catch (userError) {
        console.warn('获取用户信息失败:', userError);
      }
    }
    console.log( totalRatings > 0 ? parseFloat((totalRating / totalRatings).toFixed(1)) : 0)
    // 9. 返回响应
    return {
      code: 200,
      data: {
        content_id: contentId,
        average_rating:  totalRatings > 0 ? parseFloat((totalRating / totalRatings).toFixed(1)) : 0,
        rating_count: stats.rating_count || 0,
        comment_count: stats.comment_count || 0,
        rating_distribution: distribution,
        rating_percentages: percentageDistribution,
        user_rating: userRating,
        recent_ratings: recentRatings,
        rating_details: {
          total_ratings: totalRatings,
          total_score: totalRating,
          average_calculated: totalRatings > 0 ? parseFloat((totalRating / totalRatings).toFixed(1)) : 0
        },
        // 如果已登录，返回更多信息
        current_user: userId ? {
          id: userId,
          can_rate: true, // 已登录用户可以评分
          has_rated: userRating !== null // 是否已评分
        } : {
          id: null,
          can_rate: false, // 未登录用户不能评分
          has_rated: false
        },
        // 内容基本信息
        content_info: {
          title: contentData.title || '未命名',
          user_id: contentData.user_id,
          visibility: contentData.visibility,
          category: contentData.category || '未分类'
        }
      },
      message: '获取成功'
    };
    
  } catch (error) {
    console.error('获取评分失败:', error);
    return { 
      code: 500, 
      message: '获取失败',
      data: error.message || '服务器内部错误'
    };
  }
};