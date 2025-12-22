'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const collection = db.collection('contents');
  const dbCmd = db.command;
  
  const {
    content_id = '',      // 单个内容ID
    user_id = '',         // 用户ID（查看某个用户的内容）
    tags = [],           // 标签搜索
    start_date = '',     // 开始日期
    end_date = '',       // 结束日期
    keyword = '',        // 关键词搜索
    content_type = '',   // 内容类型
    page = 1,            // 页码
    page_size = 20       // 每页数量
  } = event;
  
  try {
    // 1. 获取单个内容详情
    if (content_id) {
      return await getSingleContent(content_id, context, collection, dbCmd);
    }
    
    // 2. 获取内容列表（支持搜索）
    return await getContentList({
      user_id,
      tags,
      start_date,
      end_date,
      keyword,
      content_type,
      page,
      page_size
    }, context, collection, dbCmd);
    
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
async function getSingleContent(contentId, context, collection, dbCmd) {
  const result = await collection.doc(contentId).get();
  
  if (!result.data || result.data.length === 0) {
    return {
      code: 404,
      message: '内容不存在',
      data: null
    };
  }
  
  const content = result.data[0];
  
  // 权限检查：只能查看自己的或公开的内容
  const canView = checkContentVisibility(content, context.UID);
  if (!canView) {
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

// 获取内容列表（支持搜索）
async function getContentList(params, context, collection, dbCmd) {
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
  let query = collection.where({
    deleted_at: null // 只查未删除的
  });
  
  // 用户过滤
  if (user_id) {
    query = query.where({ user_id });
  }
  
  // 标签搜索
  if (tags && tags.length > 0) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    query = query.where({
      tags: dbCmd.in(tagArray)
    });
  }
  
  // 日期范围搜索
  if (start_date) {
    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);
    query = query.where({
      created_at: dbCmd.gte(startDate)
    });
  }
  
  if (end_date) {
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999);
    query = query.where({
      created_at: dbCmd.lte(endDate)
    });
  }
  
  // 关键词搜索（标题和内容）
  if (keyword.trim()) {
    const keywordRegex = new RegExp(keyword.trim(), 'i');
    query = query.where(
      dbCmd.or([
        { title: keywordRegex },
        { text_content: keywordRegex },
        { tags: keywordRegex }
      ])
    );
  }
  
  // 内容类型过滤
  if (content_type) {
    query = query.where({ content_type });
  }
  
  // 权限过滤：只能查看自己的或公开的内容
  if (context.UID) {
    query = query.where(
      dbCmd.or([
        { user_id: context.UID },
        { visibility: 'public' }
      ])
    );
  } else {
    query = query.where({ visibility: 'public' });
  }
  
  // 按创建时间倒序排序
  query = query.orderBy('created_at', 'desc');
  
  // 执行查询
  const [listResult, totalResult] = await Promise.all([
    query.skip(offset).limit(page_size).get(),
    query.count()
  ]);
  
  return {
    code: 200,
    message: '获取成功',
    data: {
      list: listResult.data,
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
  
  // 如果是作者本人，可以查看所有内容
  if (content.user_id === userId) {
    return true;
  }
  
  // 其他人只能查看公开的内容
  return content.visibility === 'public';
}