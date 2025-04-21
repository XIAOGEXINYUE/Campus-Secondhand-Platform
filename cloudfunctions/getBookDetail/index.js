// cloudfunctions/getBookDetail/index.js
const cloud = require('wx-server-sdk');

cloud.init({
  env: 'cloud1-2g21cwvn7097e332'
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('getBookDetail函数被调用，参数:', event);
  
  const { bookId } = event;
  if (!bookId) {
    console.error('未提供书籍ID');
    return {
      success: false,
      error: '缺少书籍ID参数'
    };
  }
  
  console.log('查询书籍ID:', bookId);
  
  try {
    // 从数据库获取书籍详情
    const bookRes = await db.collection('books').doc(bookId).get();
    console.log('数据库查询结果:', bookRes);
    
    if (bookRes.data) {
      let bookData = bookRes.data;

      // --- 开始图片URL转换 ---
      let fileListToConvert = [];
      // 添加 coverUrl (如果存在且是 cloud:// 地址)
      if (bookData.coverUrl && bookData.coverUrl.startsWith('cloud://')) {
        fileListToConvert.push(bookData.coverUrl);
      }
      // 添加 images 数组中的 cloud:// 地址 (去重)
      if (bookData.images && Array.isArray(bookData.images)) {
        bookData.images.forEach(img => {
          if (img && img.startsWith('cloud://') && !fileListToConvert.includes(img)) {
            fileListToConvert.push(img);
          }
        });
      }

      // 如果有需要转换的 File ID
      if (fileListToConvert.length > 0) {
        console.log('[getBookDetail] 需要转换的文件ID:', fileListToConvert);
        try {
          // 调用 API 获取临时链接
          const tempUrlRes = await cloud.getTempFileURL({
            fileList: fileListToConvert,
          });
          console.log('[getBookDetail] 临时URL获取结果:', tempUrlRes);

          // 创建一个映射：File ID -> Temp URL
          const urlMap = {};
          tempUrlRes.fileList.forEach(item => {
            if (item.status === 0) { // status 0 表示成功
              urlMap[item.fileID] = item.tempFileURL;
            } else {
              console.warn(`[getBookDetail] 获取文件 ${item.fileID} 临时链接失败: ${item.errMsg}`);
            }
          });

          // 使用临时链接替换原始 File ID
          // 替换 coverUrl
          if (bookData.coverUrl && urlMap[bookData.coverUrl]) {
            bookData.coverUrl = urlMap[bookData.coverUrl];
          }
          // 替换 images 数组
          if (bookData.images && Array.isArray(bookData.images)) {
            bookData.images = bookData.images.map(img => urlMap[img] || img); // 如果转换失败，保留原 File ID
          }
          console.log('[getBookDetail] 转换后的 bookData:', bookData);

        } catch (urlErr) {
          console.error('[getBookDetail] 获取临时文件URL时出错:', urlErr);
          // 即使转换失败，也继续返回数据，让前端处理
        }
      }
      // --- 结束图片URL转换 ---

      // 返回处理过的数据
      return { success: true, data: bookData };
    } else {
      console.log('未找到书籍数据，尝试返回模拟数据');
      
      // 如果书籍ID包含'hydraulics'，返回水力学模拟数据
      if (bookId.includes('hydraulics') || bookId.includes('water')) {
        return {
          success: true,
          data: getHydraulicsBookDetail(bookId)
        };
      }
      
      return {
        success: false,
        error: '未找到书籍'
      };
    }
  } catch (err) {
    console.error('查询出错:', err);
    
    // 如果是通用错误，尝试用模拟数据
    if (bookId.includes('hydraulics') || bookId.includes('water')) {
      console.log('返回水力学模拟数据');
      return {
        success: true,
        data: getHydraulicsBookDetail(bookId)
      };
    }
    
    return {
      success: false,
      error: err.message || err.toString()
    };
  }
};

// 生成水力学书籍的模拟详情数据
function getHydraulicsBookDetail(bookId) {
  const isTextbook = !bookId.includes('practice');
  
  return {
    _id: bookId,
    title: isTextbook ? '水力学（第五版）' : '水力学习题集（第四版）',
    coverUrl: `cloud://cloud1-2g21cwvn7097e332.636c-cloud1-2g21cwvn7097e332-1348406115/book-covers/${isTextbook ? '水力学封面.jpg' : '水力学习题集封面.jpg'}`,
    images: [
      `cloud://cloud1-2g21cwvn7097e332.636c-cloud1-2g21cwvn7097e332-1348406115/book-covers/${isTextbook ? '水力学封面.jpg' : '水力学习题集封面.jpg'}`
    ],
    price: isTextbook ? 32 : 25,
    originalPrice: isTextbook ? 45 : 38,
    condition: isTextbook ? '少量笔记' : '全新',
    category: '工程技术',
    transactionMethod: isTextbook ? '买家自取' : '卖家包送',
    campus: '江宁',
    college: '水利学院',
    description: isTextbook ? 
      '水力学是土木工程、水利工程等专业的核心课程教材，本书包含流体力学基础、静水压力、液流运动学等内容，书籍整体九成新，只有少量铅笔笔记，可以擦除。' : 
      '与教材配套的习题集，包含大量习题和详细解答，全新未使用过。',
    sellerId: 'seller123',
    createdAt: new Date(),
    status: 'active'
  };
}