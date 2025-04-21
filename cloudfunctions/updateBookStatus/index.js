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

  // 1. 参数校验
  if (!openid) {
    return { success: false, error: { message: '无法获取用户信息，请重试' } }
  }
  if (!bookId) {
    return { success: false, error: { message: '缺少书籍 ID' } }
  }
  if (status !== '已售出' && status !== '出售中') { // 限制允许的状态值
    return { success: false, error: { message: '无效的状态值' } }
  }

  console.log(`[updateBookStatus] User: ${openid}, BookID: ${bookId}, New Status: ${status}`)

  try {
    // 2. 查找书籍并验证所有权
    const bookRes = await db.collection('books').doc(bookId).get()

    if (!bookRes.data) {
      return { success: false, error: { message: '找不到指定的书籍' } }
    }

    // 确保只有书籍的发布者可以修改状态
    if (bookRes.data._openid !== openid) {
      console.warn(`[updateBookStatus] Permission denied. User ${openid} tried to update book ${bookId} owned by ${bookRes.data._openid}`)
      return { success: false, error: { message: '无权修改此书籍状态' } }
    }

    // 3. 更新书籍状态
    const updateRes = await db.collection('books').doc(bookId).update({
      data: {
        status: status,
        updatedAt: db.serverDate() // 可选：记录更新时间
      }
    })

    console.log('[updateBookStatus] Update result:', updateRes)

    // 检查更新是否成功
    if (updateRes.stats.updated === 1) {
      return { success: true, message: '状态更新成功' }
    } else {
      // 如果 updated 不为 1，可能 bookId 错误或并发问题
      console.error('[updateBookStatus] Update stats indicate no record was updated.')
      return { success: false, error: { message: '更新失败，未找到记录或无更改' } }
    }

  } catch (err) {
    console.error('[updateBookStatus] Error:', err)
    // 根据错误类型返回更具体的错误信息
    if (err.code && (err.code.includes('DATABASE_REQUEST_FAILED') || err.code.includes('DOCUMENT_NOT_FOUND'))) {
      return { success: false, error: { message: '数据库操作失败，请检查书籍ID是否正确' } }
    }
    return { success: false, error: { message: '更新书籍状态时发生未知错误' } }
  }
}