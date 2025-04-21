// cloudfunctions/getUserInfo/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-2g21cwvn7097e332' });
const db = cloud.database();

exports.main = async (event, context) => {
  const { userId } = event;
  
  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    };
  }
  
  try {
    // 查询用户信息
    const userResult = await db.collection('users').where({
      openId: userId // 使用 openId 字段进行查询
    }).limit(1).get(); // limit(1) 确保只获取一个结果
    
       // where 查询返回的是 data 数组
        if (!userResult.data || userResult.data.length === 0) { 
          console.log('未找到 openId 为', userId, '的用户');
          return {
            success: false,
            error: '用户不存在'
          };
        }
        
        // 获取找到的第一个用户数据
        const userData = userResult.data[0]; 
        console.log('找到用户信息:', userData);
        
        // 不返回敏感信息 (假设 password 字段可能存在)
        const { password, ...safeUserInfo } = userData; 
        
        return {
          success: true,
          data: safeUserInfo 
        };
  } catch (error) {
    return {
      success: false,
      error
    };
  }
};