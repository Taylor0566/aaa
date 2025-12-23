'use strict';

exports.main = async (event, context) => {
  // 正确获取数据库实例
  const db = uniCloud.database();
  const collection = db.collection('contents');
  const usersCollection = db.collection('users');  // 🟢 添加
  const dbCmd = db.command;
  
  const {
    content_id = '',
    user_id = '',
    tags = [],
    start_date = '',
    end_date = '',
    keyword = '',
    content_type = '',
    page = 1,
    page_size = 20
  } = event;
  
  try {
    // 获取单个内容详情
    if (content_id) {
      return await getSingleContent(content_id, context, collection, usersCollection, dbCmd);  // 🟢 修改
    }
    
    // 获取内容列表
    return await getContentList({
      user_id,
      tags,
      start_date,
      end_date,
      keyword,
      content_type,
      page,
      page_size
    }, context, collection, usersCollection, dbCmd);  // 🟢 修改
    
  } catch (error) {
    console.error('获取内容失败:', error);
    return {
      code: 500,
      message: '获取内容失败',
      data: null
    };
  }
};

// 获取单个内容详情
async function getSingleContent(contentId, context, collection, usersCollection, dbCmd) {  // 🟢 修改
  const result = await collection.doc(contentId).get();
  
  if (!result.data || result.data.length === 0) {
    return {
      code: 404,
      message: '内容不存在',
      data: null
    };
  }
  
  const content = result.data[0];
  
  // 🟢 新增：获取用户信息
  try {
    const userResult = await usersCollection.doc(content.user_id).get();
    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0];
      content.user_info = {
        _id: user._id,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        gender: user.gender || 0
      };
    }
  } catch (userError) {
    console.warn('获取用户信息失败:', userError);
    content.user_info = {
      nickname: '未知用户',
      avatar: ''
    };
  }
  
  // 权限检查
  if (!checkContentVisibility(content, context.UID)) {
    return {
      code: 403,
      message: '无权查看此内容',
      data: null
    };
  }
  
  // 增加浏览量
  await collection.doc(contentId).update({
    'stats.view_count': dbCmd.inc(1),
    updated_at: new Date()
  });
  
  return {
    code: 200,
    message: '获取成功',
    data: content
  };
}

// 获取内容列表（修复版）
async function getContentList(params, context, collection, usersCollection, dbCmd) {  // 🟢 修改
  const {
    user_id,
    tags,
    start_date,
    end_date,
    keyword,
    content_type,
    page,
    page_size
  } = params;
  
  const offset = (page - 1) * page_size;
  
  // 构建查询条件
  const whereConditions = {
    deleted_at: null
  };
  
  if (user_id) {
    whereConditions.user_id = user_id;
  }
  
  if (tags && tags.length > 0) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    whereConditions.tags = dbCmd.in(tagArray);
  }
  
  if (start_date) {
    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);
    whereConditions.created_at = dbCmd.gte(startDate);
  }
  
  if (end_date) {
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);
    whereConditions.created_at = dbCmd.lte(endDate);
  }
  
  if (content_type) {
    whereConditions.content_type = content_type;
  }
  
  if (context.UID) {
    whereConditions.$or = [
      { user_id: context.UID },
      { visibility: 'public' }
    ];
  } else {
    whereConditions.visibility = 'public';
  }
  
  let query = collection.where(whereConditions);
  
  if (keyword && keyword.trim()) {
    const keywordRegex = new RegExp(keyword.trim(), 'i');
    query = query.where(
      dbCmd.or([
        { title: keywordRegex },
        { text_content: keywordRegex },
        { tags: keywordRegex }
      ])
    );
  }
  
  console.log('查询条件:', JSON.stringify(whereConditions, null, 2));
  
  query = query.orderBy('created_at', 'desc');
  
  // 执行查询
  const [listResult, totalResult] = await Promise.all([
    query.skip(offset).limit(page_size).get(),
    query.count()
  ]);
  
  console.log('查询结果数量:', listResult.data.length);
  
  // 🟢 新增：批量获取用户信息
  const contents = listResult.data;
  
  if (contents.length > 0) {
    const userIds = contents.map(item => item.user_id).filter(id => id);
    
    if (userIds.length > 0) {
      const usersResult = await usersCollection
        .where({
          _id: dbCmd.in(userIds)
        })
        .field({
          nickname: true,
          avatar: true,
          gender: true,
          username: true
        })
        .get();
      
      const usersMap = {};
      usersResult.data.forEach(user => {
        usersMap[user._id] = {
          _id: user._id,
          nickname: user.nickname || user.username,
          avatar: user.avatar || '',
          gender: user.gender || 0
        };
      });
      
      contents.forEach(content => {
        content.user_info = usersMap[content.user_id] || {
          nickname: '未知用户',
          avatar: ''
        };
      });
    }
  }
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      list: contents,
      pagination: {
        page: parseInt(page),
        page_size: parseInt(page_size),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / page_size)
      }
    }
  };
}

// 检查内容可见性
function checkContentVisibility(content, userId) {
  if (!content || content.deleted_at) {
    return false;
  }
  
  if (content.user_id === userId) {
    return true;
  }
  
  return content.visibility === 'public';
}