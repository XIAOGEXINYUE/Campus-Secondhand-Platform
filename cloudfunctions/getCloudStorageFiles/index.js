// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: 'cloud1-2g21cwvn7097e332' });

// 云函数入口函数
exports.main = async (event, context) => {
  const { folder = '' } = event;
  
  try {
    // 获取云存储文件列表
    const result = await cloud.getTempFileURL({
      fileList: [],
    });
    
    // 列出指定文件夹下的文件
    const fileListResult = await cloud.database().collection('_cloudbase_file_metadata')
      .where({
        key: {
          $regex: `^${folder}.*`
        }
      })
      .get();
    
    // 提取文件ID列表
    const fileList = fileListResult.data.map(file => {
      return {
        fileID: `cloud://${cloud.DYNAMIC_CURRENT_ENV}/${file.key}`,
        key: file.key
      };
    });
    
    return {
      success: true,
      fileList: fileList
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
};
