/*
 * @Author: Libra
 * @Date: 2024-11-05 16:22:13
 * @LastEditors: Libra
 * @Description: 
 */
const { sourceDir, flatDir, categoryDir, resizeDir, renameDir, rootDir } = require('./path');
const { flattenDirectory } = require('./flat');
const { organizePhotos, renameIdCardFiles } = require('./category');
const { runExport } = require('./export');
const { exec } = require('child_process');

async function main() {
    // 每次执行前，先删除 rootDir 目录下的所有文件
    try {
      await new Promise((resolve, reject) => {
        exec(`rm -rf ${rootDir}/*`, (error) => {
          if (error) {
            reject(error);
          } else {
            console.log('清理目录完成');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('清理目录时发生错误:', error);
      return;
    }
  
  // 1. 平铺文件夹
  try {
    await flattenDirectory(sourceDir);
    console.log('文件夹平铺完成');
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    return;
  }
  // 2. 对文件名进行分类
  try {
    await organizePhotos(flatDir);
    console.log('文件名分类完成');
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    return;
  }
  // 3. 重命名符合格式的文件
  try {
    await renameIdCardFiles(categoryDir);
    console.log('文件重命名完成');
  } catch (error) {
    console.error('处理过程中发生错误:', error);
    return;
  }
  // 4. 压缩重命名后的图片
  // 直行 compress.sh
  const { spawn } = require('child_process');
  const compressSh = './compress.sh'
  const path = require('path');
  const fullPath = path.resolve(compressSh);
  const fullRenameDir = path.resolve(renameDir);
  const fullResizeDir = path.resolve(resizeDir);
  
  console.log('开始压缩图片...');
  
  const compress = spawn('bash', [fullPath, `${fullRenameDir}/`, `${fullResizeDir}/`]);

  // 实时输出进度
  compress.stdout.on('data', (data) => {
    // 使用 process.stdout.write 来避免额外的换行
    process.stdout.write(data.toString());
  });

  // 处理错误输出
  compress.stderr.on('data', (data) => {
    console.error('压缩脚本错误:', data.toString());
  });

  // 处理结束
  compress.on('close', async (code) => {
    if (code === 0) {
      console.log('\n压缩完成！');
      // 5. 根据excel进行分类
      try {
        await runExport();
        console.log('根据excel进行分类完成');
      } catch (error) {
        console.error('处理过程中发生错误:', error);
        return;
      }
    } else {
      console.error(`\n压缩脚本异常退出，退出码: ${code}`);
    }
  });

  
}

main();