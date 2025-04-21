// 云函数 addBook/index.js
const cloud = require('wx-server-sdk');
cloud.init({
  env: "cloud1-2g21cwvn7097e332"
});
const db = cloud.database();

exports.main = async (event, context) => {
  const { bookData } = event;
  const wxContext = cloud.getWXContext();
  
  // 添加用户OpenID作为卖家标识
  bookData.sellerId = wxContext.OPENID;
  
  // 添加状态字段，默认为active（在售）
  bookData.status = 'active';
  
  try {
    // 插入数据到books集合
    const result = await db.collection('books').add({
      data: bookData
    });
    
    return {
      success: true,
      _id: result._id
    };
  } catch (err) {
    console.error('添加书籍失败:', err);
    return {
      success: false,
      error: err
    };
  }
};
