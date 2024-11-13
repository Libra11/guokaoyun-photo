/*
 * @Author: Libra
 * @Date: 2024-11-05 16:13:03
 * @LastEditors: Libra
 * @Description: 
 */
// 根目录（需要手动指定）
const rootDir = '../第五批结果';
// 最初的文件夹（需要手动指定）
const sourceDir = '../第五批';
// excel路径(需要手动指定)
const excelPath = '../考生预约 3.xlsx';
// 原始文件命名规则,目前只支持身份证号_姓名和姓名_身份证号
const originalFileNameRule = '身份证号_姓名';

module.exports = {
  originalFileNameRule,
  rootDir,
  // 最初的文件夹（需要手动指定）
  sourceDir,
  // excel路径(需要手动指定)
  excelPath,
  // 平铺后的文件夹
  flatDir: rootDir + '/1原始文件平铺',
  // 分类后的文件夹
  categoryDir: rootDir + '/2平铺文件分类',
  // 分类后会剔除不符合格式的文件，符合格式的文件在 ./平铺文件分类/符合格式的文件
  validDir: rootDir + '/2平铺文件分类/符合格式的文件',
  // 将符合格式的文件重命名为身份证号
  renameDir: rootDir + '/3重命名文件夹',
  // 图片文件压缩
  resizeDir: rootDir + '/4压缩后',
  // 根据试卷进行分类
  categoryByExamDir: rootDir + '/5根据试卷进行分类',
  // 成功的excel
  successExcel: rootDir + '/6成功.xlsx',
  // 失败的excel
  failExcel: rootDir + '/7失败.xlsx'
}
