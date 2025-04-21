// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const usersCollection = db.collection('users')
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID // 直接从上下文获取 openid，更安全可靠

  // 从 event 中获取前端传递过来的用户信息
  const { nickName, avatarUrl } = event.userInfo || {}

  console.log('Login function called. OpenID:', openid)
  console.log('Received userInfo:', event.userInfo)

  // --- ADD LOGGING HERE ---
  console.log('[Login Function] Received event.userInfo:', event.userInfo);
  console.log('[Login Function] Parsed nickName:', nickName);
  console.log('[Login Function] Parsed avatarUrl:', avatarUrl);
  // --- END LOGGING ---

  if (!openid) {
    return {
      success: false,
      error: '无法获取用户 OpenID'
    }
  }

  try {
    // 尝试根据 openid 查询用户
    const userQueryResult = await usersCollection.where({
      openId: openid // 注意：我们之前约定用 openId 字段存储
    }).limit(1).get()

    let userId = null
    let userData = null

    if (userQueryResult.data && userQueryResult.data.length > 0) {
      // --- 用户已存在 ---
      userData = userQueryResult.data[0]
      userId = userData._id // 获取数据库自动生成的 _id
      console.log('用户已存在，ID:', userId, '信息:', userData)

      // --- ADD LOGGING HERE ---
      console.log('[Login Function] Existing userData from DB:', userData);
      // --- END LOGGING ---

      // 检查用户信息是否有更新
      let updateData = {}
      // Add more detailed comparison logs
      console.log(`[Login Function] Comparing Nickname: DB='${userData.nickName}', Received='${nickName}', Different?`, userData.nickName !== nickName);
      if (nickName && userData.nickName !== nickName) {
        updateData.nickName = nickName
      }
      console.log(`[Login Function] Comparing AvatarURL: DB='${userData.avatarUrl}', Received='${avatarUrl}', Different?`, userData.avatarUrl !== avatarUrl);
      if (avatarUrl && userData.avatarUrl !== avatarUrl) {
        updateData.avatarUrl = avatarUrl
      }

      // --- ADD LOGGING HERE ---
      console.log('[Login Function] Calculated updateData:', updateData);
      // --- END LOGGING ---

      if (Object.keys(updateData).length > 0) {
        // --- ADD LOGGING HERE ---
        console.log('[Login Function] Entering update block.'); 
        // --- END LOGGING ---
        await usersCollection.doc(userId).update({
          data: {
            ...updateData,
            updatedAt: db.serverDate() // 添加或更新 'updatedAt' 字段
          }
        })
        // 更新本地 userData 变量以返回最新信息
        userData = { ...userData, ...updateData }
      } else {
        // --- ADD LOGGING HERE ---
        console.log('[Login Function] No updates needed, skipping update block.');
        // --- END LOGGING ---
      }
      
    } else {
      // --- 用户不存在，创建新用户 ---
      console.log('用户不存在，创建新用户')
      const newUser = {
        openId: openid,
        nickName: nickName || '微信用户', // 提供默认昵称
        avatarUrl: avatarUrl || '', // 提供默认空头像
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
        // 你可以在这里添加其他需要在注册时设置的默认字段，比如 school, reputation 等
      }
      const addUserResult = await usersCollection.add({
        data: newUser
      })
      userId = addUserResult._id // 获取新用户的 _id
      userData = { _id: userId, ...newUser } // 构建返回的用户数据
      console.log('新用户创建成功，ID:', userId)
    }

    // 返回成功信息和处理过的用户信息
    // 确保 userData 中包含的是更新后的 nickName
    const { openId, password, ...safeUserInfo } = userData; // 移除 openId 和可能存在的 password
    safeUserInfo._id = userId; // 确保返回数据库的 _id
    // 确保 safeUserInfo 里包含的是正确的 nickName 字段

    console.log('Login successful, returning data:', safeUserInfo);
    return {
      success: true,
      data: safeUserInfo 
    };

  } catch (error) {
    console.error('登录或注册过程中出错:', error)
    return {
      success: false,
      error: {
        message: '登录或注册失败',
        details: error
      }
    }
  }
}