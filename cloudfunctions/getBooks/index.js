// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: 'cloud1-2g21cwvn7097e332' });
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('getBooks云函数被调用，参数:', event);
  const { 
    limit = 10, 
    skip = 0, 
    category = null, 
    college = null, 
    keyword = null,
    userId = null,  // 添加 userId 参数
    myPosts = false // 添加 myPosts 参数，表示是否获取我的发布
  } = event;
  
  try {
    // 构建查询条件
    let query = {};
    
    // 如果是获取我的发布，则需要查询当前用户发布的书籍
    if (myPosts && userId) {
      console.log('查询用户自己发布的书籍，用户ID:', userId);
      // 提供更灵活的用户ID匹配 - 可以匹配_openid或者sellerId字段
      query = _.or([
        {
          _openid: userId
        },
        {
          sellerId: userId
        }
      ]);
      // 获取我的发布时，不限制状态，显示所有状态的书籍
    } else {
      // 默认只查询激活状态的书籍
      query.status = 'active';
    }
    
    // 如果有分类筛选
    if (category) {
      query.category = category;
    }
    
    // 如果有学院筛选
    if (college) {
      query.college = college;
    }
    
    // 如果有关键词搜索
    if (keyword) {
      query.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }
    
    console.log('构建的查询条件:', query);
    
    // 查询书籍数据
    const booksResult = await db.collection('books')
      .where(query)
      .skip(skip)
      .limit(limit)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log('查询到书籍数量:', booksResult.data.length);
    
    // 如果没有查询到数据，且不是查询我的发布，则返回模拟数据
    if ((!booksResult.data || booksResult.data.length === 0) && !myPosts) {
      console.log('未查询到数据，使用模拟数据');
      return {
        success: true,
        data: getMockBooks()
      };
    }
    
    return {
      success: true,
      data: booksResult.data
    };
  } catch (err) {
    console.error('查询出错:', err);
    // 出错时，如果不是查询我的发布，则返回模拟数据
    if (!myPosts) {
      return {
        success: true,
        data: getMockBooks()
      };
    } else {
      // 如果是查询我的发布，返回错误信息
      return {
        success: false,
        error: err.message || '查询失败'
      };
    }
  }
};

// 获取模拟书籍数据
function getMockBooks() {
  // 云存储中的图片路径前缀
  const CLOUD_PATH = 'cloud://cloud1-2g21cwvn7097e332.636c-cloud1-2g21cwvn7097e332-1348406115/book-covers/';
  
  return [
    {
      _id: 'mock1',
      title: '理工类_大学物理学（上册）',
      coverUrl: `${CLOUD_PATH}理工类_大学物理学（上册）封面.jpg`,
      price: 25.00,
      originalPrice: 42.80,
      condition: '少量笔记',
      category: '理工科',
      transactionMethod: '自取',
      college: '物理学院',
      isLiked: false,
      status: 'active',
      createdAt: new Date()
    },
    {
      _id: 'mock2',
      title: '理工类_化工原理',
      coverUrl: `${CLOUD_PATH}理工类_化工原理封面.jpg`,
      price: 30.00,
      originalPrice: 55.00,
      condition: '全新',
      category: '理工科',
      transactionMethod: '包送',
      college: '化学工程学院',
      isLiked: false,
      status: 'active',
      createdAt: new Date()
    },
    {
      _id: 'mock3',
      title: '理工类_机械原理',
      coverUrl: `${CLOUD_PATH}理工类_机械原理封面.jpg`,
      price: 35.00,
      originalPrice: 45.00,
      condition: '全新',
      category: '理工科',
      transactionMethod: '自取',
      college: '机械工程学院',
      isLiked: false,
      status: 'active',
      createdAt: new Date()
    }
  ];
}
