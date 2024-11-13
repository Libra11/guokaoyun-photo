/*
 * @Author: Libra
 * @Date: 2024-11-04 14:49:13
 * @LastEditors: Libra
 * @Description: 平铺文件夹
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { flatDir } = require('./path');


// 递归遍历文件夹
async function flattenDirectory(dir) {
  const targetDir = flatDir;
  // 确保目标文件夹存在
  if (!fsSync.existsSync(targetDir)) {
    await fs.mkdir(targetDir, { recursive: true });
  }
  
  const items = await fs.readdir(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      // 如果是文件夹，递归处理
      await flattenDirectory(fullPath);
    } else {
      // 如果是文件，移动到目标文件夹
      const fileName = path.basename(fullPath);
      // 确保文件名不重复
      let newFileName = fileName;
      let counter = 1;
      
      while (fsSync.existsSync(path.join(targetDir, newFileName))) {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        newFileName = `${nameWithoutExt}_${counter}${ext}`;
        counter++;
      }
      
      await fs.copyFile(fullPath, path.join(targetDir, newFileName));
    }
  }
}

module.exports = { flattenDirectory };