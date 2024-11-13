/*
 * @Author: Libra
 * @Date: 2024-11-05 18:17:46
 * @LastEditors: Libra
 * @Description: Excel文件图片筛选工具
 */
const xlsx = require('xlsx');
const fs = require('fs-extra');
const path = require('path');

/**
 * 读取Excel文件
 * @param {string} excelPath Excel文件路径
 * @returns {Array<{name: string, idCard: string, examName: string}>}
 */
function readExcel(excelPath) {
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    return data.map(row => ({
        name: row['姓名'],
        idCard: row['证件号码'],
        examName: row['试卷']
    }));
}

/**
 * 复制符合条件的图片
 * @param {string} sourceDir 源目录
 * @param {string} targetDir 目标目录
 * @param {Array} excelData Excel数据
 */
async function copyMatchedImages(sourceDir, targetDir, excelData) {
    // 创建输出目录
    await fs.ensureDir(targetDir);
    
    // 遍历Excel数据
    for (const record of excelData) {
        const { idCard, examName } = record;
        const sourcePath = path.join(sourceDir, examName, `${idCard}.jpg`);
        const targetPath = path.join(targetDir, examName, `${idCard}.jpg`);

        try {
            // 检查源文件是否存在
            if (await fs.pathExists(sourcePath)) {
                // 确保目标目录存在
                await fs.ensureDir(path.dirname(targetPath));
                // 复制文件
                await fs.copy(sourcePath, targetPath);
                console.log(`成功复制: ${targetPath}`);
            } else {
                console.warn(`文件不存在: ${sourcePath}`);
            }
        } catch (error) {
            console.error(`处理文件时出错: ${sourcePath}`, error);
        }
    }
}

/**
 * 主函数
 */
async function main() {
    const sourceDir = process.argv[2]; // 源目录路径
    const targetDir = process.argv[3]; // 目标目录路径
    const excelPath = process.argv[4]; // Excel文件路径

    if (!sourceDir || !targetDir || !excelPath) {
        console.error('请提供源目录、目标目录和Excel文件路径');
        process.exit(1);
    }

    try {
        const excelData = readExcel(excelPath);
        await copyMatchedImages(sourceDir, targetDir, excelData);
        console.log('处理完成！');
    } catch (error) {
        console.error('程序执行出错:', error);
        process.exit(1);
    }
}

main();


