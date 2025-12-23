const db = uniCloud.database()
const dbCmd = db.command

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

exports.getSystemStats = async (event, context) => {
  // 获取当前日期
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // 用户总数
  const totalUsers = await db.collection('users').count()
  
  // 今日活跃用户数（登录过的用户）
  const todayActiveUsers = await db.collection('users')
    .where({ last_login_time: dbCmd.gte(today.setHours(0, 0, 0, 0)) })
    .count()
  
  // 内容总数
  const totalContents = await db.collection('contents').count()
  
  // 今日新增内容
  const todayContents = await db.collection('contents')
    .where({ created_at: dbCmd.gte(today.setHours(0, 0, 0, 0)) })
    .count()
  
  // 评论总数
  const totalComments = await db.collection('comments').count()
  
  // 评分统计
  const ratingStats = await db.collection('contents')
    .field({ 'stats.average_rating': true, 'stats.rating_count': true })
    .get()
  
  let totalRatings = 0
  let avgOverallRating = 0
  
  if (ratingStats.data.length > 0) {
    totalRatings = ratingStats.data.reduce((sum, item) => sum + (item.stats?.rating_count || 0), 0)
    const totalScore = ratingStats.data.reduce((sum, item) => sum + (item.stats?.average_rating || 0) * (item.stats?.rating_count || 0), 0)
    avgOverallRating = totalRatings > 0 ? (totalScore / totalRatings).toFixed(1) : 0
  }
  
  return {
    code: 200,
    data: {
      userStats: {
        total: totalUsers.total,
        dailyActive: todayActiveUsers.total
      },
      contentStats: {
        total: totalContents.total,
        dailyNew: todayContents.total
      },
      commentStats: {
        total: totalComments.total
      },
      ratingStats: {
        total: totalRatings,
        average: parseFloat(avgOverallRating)
      }
    }
  }
}

exports.getTrendData = async (event, context) => {
  const { days = 30 } = event
  
  // 生成过去N天的日期数组
  const dates = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(formatDate(date))
  }
  
  // 获取每日新增用户数据
  const userTrend = await Promise.all(dates.map(date => {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    
    return db.collection('users')
      .where({
        create_time: dbCmd.and(
          dbCmd.gte(start),
          dbCmd.lt(end)
        )
      })
      .count()
      .then(res => res.total)
  }))
  
  // 获取每日新增内容数据
  const contentTrend = await Promise.all(dates.map(date => {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    
    return db.collection('contents')
      .where({
        created_at: dbCmd.and(
          dbCmd.gte(start),
          dbCmd.lt(end)
        )
      })
      .count()
      .then(res => res.total)
  }))
  
  // 获取每日新增评论数据
  const commentTrend = await Promise.all(dates.map(date => {
    const start = new Date(date)
    const end = new Date(date)
    end.setDate(end.getDate() + 1)
    
    return db.collection('comments')
      .where({
        created_at: dbCmd.and(
          dbCmd.gte(start),
          dbCmd.lt(end)
        )
      })
      .count()
      .then(res => res.total)
  }))
  
  return {
    code: 200,
    data: {
      dates,
      trends: {
        users: userTrend,
        contents: contentTrend,
        comments: commentTrend
      }
    }
  }
}