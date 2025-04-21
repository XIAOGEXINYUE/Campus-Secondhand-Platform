// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID // 获取调用者的 openid

  const { bookId, price } = event

  // 1. 参数校验
  if (!openid) {
    return { success: false, error: { message: '无法获取用户信息，请重试' } }
  }
  if (!bookId) {
    return { success: false, error: { message: '缺少书籍 ID' } }
  }
  // 校验价格是否为有效正数
  const numericPrice = Number(price)
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return { success: false, error: { message: '价格必须是有效的正数' } }
  }

  console.log(`[updateBookPrice] User: ${openid}, BookID: ${bookId}, New Price: ${numericPrice}`)

  try {
    // 2. 查找书籍并验证所有权
    const bookRes = await db.collection('books').doc(bookId).get()

    if (!bookRes.data) {
      return { success: false, error: { message: '找不到指定的书籍' } }
    }

    // 确保只有书籍的发布者可以修改价格
    if (bookRes.data._openid !== openid) {
      console.warn(`[updateBookPrice] Permission denied. User ${openid} tried to update price for book ${bookId} owned by ${bookRes.data._openid}`)
      return { success: false, error: { message: '无权修改此书籍价格' } }
    }

    // （可选）检查书籍是否处于"出售中"状态才能修改价格
    // if (bookRes.data.status === '已售出') {
    //   return { success: false, error: { message: '已售出的书籍不能修改价格' } }
    // }

    // 3. 更新书籍价格
    const updateRes = await db.collection('books').doc(bookId).update({
      data: {
        price: numericPrice, // 使用校验过的数字价格
        updatedAt: db.serverDate() // 可选：记录更新时间
      }
    })

    console.log('[updateBookPrice] Update result:', updateRes)

    // 检查更新是否成功
    if (updateRes.stats.updated === 1) {
      return { success: true, message: '价格更新成功' }
    } else {
      console.error('[updateBookPrice] Update stats indicate no record was updated.')
      return { success: false, error: { message: '更新失败，未找到记录或无更改' } }
    }

  } catch (err) {
    console.error('[updateBookPrice] Error:', err)
    // 根据错误类型返回更具体的错误信息
    if (err.code && (err.code.includes('DATABASE_REQUEST_FAILED') || err.code.includes('DOCUMENT_NOT_FOUND'))) {
      return { success: false, error: { message: '数据库操作失败，请检查书籍ID是否正确' } }
    }
    return { success: false, error: { message: '更新书籍价格时发生未知错误' } }
  }
}