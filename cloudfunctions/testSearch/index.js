// 云函数 testSearch/index.js
const cloud = require('wx-server-sdk');

// 初始化云函数
cloud.init({
  env: 'cloud1-2g21cwvn7097e332'
});

const db = cloud.database();

// 导出云函数
exports.main = async (event, context) => {
  console.log('testSearch 云函数被调用，参数:', JSON.stringify(event));
  
  try {
    // 执行最简单的查询 - 不使用正则表达式
    const bookTitle = '水力学';
    console.log('执行精确匹配查询:', bookTitle);
    
    // 尝试精确匹配
    const exactMatch = await db.collection('books')
      .where({
        title: bookTitle
      })
      .get();
      
    console.log('精确匹配结果数量:', exactMatch.data.length);
    if (exactMatch.data.length > 0) {
      console.log('找到匹配书籍:', exactMatch.data[0].title);
    }
    
    // 尝试查询所有书籍
    const allBooks = await db.collection('books')
      .limit(10)
      .get();
    
    console.log('数据库中书籍总数:', allBooks.data.length);
    if (allBooks.data.length > 0) {
      console.log('第一本书标题:', allBooks.data[0].title);
    }
    
    return {
      success: true,
      exactMatch: exactMatch.data,
      allBooks: allBooks.data
    };
  } catch (err) {
    console.error('查询出错:', err);
    return {
      success: false,
      error: err.message || err.toString()
    };
  }
}; 