// 云函数 getOpenId/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cloud1-2g21cwvn7097e332'
});

// 云函数入口函数
exports.main = async (event, context) => {
  // 获取微信上下文
  const wxContext = cloud.getWXContext();
  
  console.log('getOpenId函数被调用');
  console.log('获取到的OPENID:', wxContext.OPENID);
  
  // 返回openid
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
}; 