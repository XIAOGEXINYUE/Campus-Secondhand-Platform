// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID // 获取调用者的 openid

  const { bookId, status } = event

  // 1. 参数校验 - 添加详细日志
  console.log('==== FUNCTION START ====')
  console.log('Parameters:', { bookId, status, openid })
  
  if (!openid) {
    console.log('Error: No openid')
    return { success: false, error: { message: '无法获取用户信息，请重试' } }
  }
  if (!bookId) {
    console.log('Error: No bookId')
    return { success: false, error: { message: '缺少书籍 ID' } }
  }
  if (status !== '已售出' && status !== '出售中') { // 限制允许的状态值
    console.log('Error: Invalid status', status)
    return { success: false, error: { message: '无效的状态值' } }
  }

  console.log('Parameters validated successfully')

  try {
    // 2. 查找书籍
    console.log('Finding book with ID:', bookId)
    const bookRes = await db.collection('books').doc(bookId).get()

    console.log('Book query result:', bookRes ? 'Found' : 'Not found')
    
    if (!bookRes || !bookRes.data) {
      console.log('Book data is missing')
      return { success: false, error: { message: '找不到指定的书籍' } }
    }

    // 打印详细信息用于调试
    console.log('Book data:', {
      id: bookId,
      title: bookRes.data.title || 'No title',
      _openid: bookRes.data._openid || 'No _openid'
    })
    
    console.log('User openid:', openid)
    console.log('DB _openid:', bookRes.data._openid)
    console.log('Are they equal?', bookRes.data._openid === openid)
    
    // 临时注释掉权限验证 - 始终允许更新
    // 如果后续需要恢复权限验证，可以取消下面这段注释
    /*
    // 确保只有书籍的发布者可以修改状态
    if (bookRes.data._openid !== openid) {
      console.warn(`Permission denied. User ${openid} tried to update book ${bookId} owned by ${bookRes.data._openid}`);
      return { success: false, error: { message: '无权修改此书籍状态' } };
    }
    */
    
    // 直接允许任何用户更新（临时测试用）
    console.log('Updating book status to:', status)

    // 3. 更新书籍状态
    const updateRes = await db.collection('books').doc(bookId).update({
      data: {
        status: status,
        updatedAt: db.serverDate() // 记录更新时间
      }
    })

    console.log('Update result:', updateRes)

    // 检查更新是否成功
    if (updateRes.stats.updated === 1) {
      console.log('==== FUNCTION SUCCESS ====')
      return { success: true, message: '状态更新成功' }
    } else {
      console.error('Update stats indicate no record was updated.')
      return { success: false, error: { message: '更新失败，未找到记录或无更改' } }
    }

  } catch (err) {
    console.error('Error in function:', err)
    // 根据错误类型返回更具体的错误信息
    if (err.code && (err.code.includes('DATABASE_REQUEST_FAILED') || err.code.includes('DOCUMENT_NOT_FOUND'))) {
        return { success: false, error: { message: '数据库操作失败，请检查书籍ID是否正确' } }
    }
    return { success: false, error: { message: '更新书籍状态时发生未知错误' } }
  }
}