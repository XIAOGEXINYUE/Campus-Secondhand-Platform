// utils/cloudStorage.js

/**
 * 上传图片到云存储
 * @param {string} filePath - 本地临时文件路径
 * @param {string} cloudPath - 云存储路径，例如 'book-covers/math-book.jpg'
 * @returns {Promise} - 返回上传结果，包含文件ID和下载链接
 */
const uploadImage = async (filePath, cloudPath) => {
  try {
    const result = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
    });
    return result.fileID;
  } catch (error) {
    console.error('上传图片失败：', error);
    throw error;
  }
};

/**
 * 从云存储中获取图片链接
 * @param {string} fileID - 云存储文件ID
 * @returns {Promise} - 返回文件临时链接
 */
const getImageUrl = (fileID) => {
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        resolve(res.fileList[0].tempFileURL);
      },
      fail: err => {
        reject(err);
      }
    });
  });
};

// 批量上传图片
const batchUploadImages = async (imageList) => {
  try {
    const uploadTasks = imageList.map(async (item) => {
      const { filePath, cloudPath } = item;
      return await uploadImage(filePath, cloudPath);
    });
    return await Promise.all(uploadTasks);
  } catch (error) {
    console.error('批量上传图片失败：', error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  getImageUrl,
  batchUploadImages
};
