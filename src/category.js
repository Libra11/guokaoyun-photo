/*
 * @Author: Libra
 * @Date: 2024-11-04 17:53:46
 * @LastEditors: Libra
 * @Description: 
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { originalFileNameRule, flatDir, categoryDir, validDir, renameDir } = require('./path');

// 图片扩展名， 包括大小写
const imgExts = ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'];

/**
 * 对文件名进行分类
 * @param {string} filename 文件名
 * @returns {string} 文件类型
 */
function categorizeFileName(filename) {
    // 检查文件名是否包含扩展名
    const parts = filename.split('.');
    const ext = parts[1] || '';
    // 如果没有扩展名或只有一个点，nameWithoutExt 就是整个文件名
    const nameWithoutExt = parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
    const hasExt = parts.length > 1;
    
    // 如果文件名中没有下划线
    if (!nameWithoutExt.includes('_') || !hasExt) {
        return '普通文件名';
    }

    const nameParts = nameWithoutExt.split('_');
    if (nameParts.length !== 2) {
        return '其他格式';
    }

    const [part1, part2] = nameParts;

    // 检查是否为身份证号（简单验证：18位数字或17位数字+X）
    const isIdCard = (str) => /^\d{17}[\dX]$/.test(str);

    if (originalFileNameRule === '身份证号_姓名') {
        if (isIdCard(part1)) {
            if (imgExts.includes(ext)) {
                return '符合格式的文件';
            } else {
                return '其他格式';
            }
        } else {
            return '非身份证号_姓名';
        }
    } else if (originalFileNameRule === '姓名_身份证号') {
        if (isIdCard(part2)) {
            if (imgExts.includes(ext)) {
                return '符合格式的文件';
            } else {
                return '其他格式';
            }
        } else {
            return '其他格式';
        }
    } else {
        return '其他格式';
    }
}

/**
 * 创建目录（如果不存在）
 * @param {string} dirPath 目录路径
 */
async function ensureDir(dirPath) {
    if (!fsSync.existsSync(dirPath)) {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

/**
 * 对照片目录下的文件进行分类整理
 * @param {string} sourceDir 源目录（照片目录）
 * @param {string} targetDir 目标目录（分类后的根目录）
 * @returns {Promise<Object>} 分类结果统计
 */
async function organizePhotos(sourceDir = flatDir, targetDir = categoryDir) {
    // 确保源目录存在
    if (!fsSync.existsSync(sourceDir)) {
        throw new Error(`源目录 "${sourceDir}" 不存在`);
    }

    // 创建目标根目录
    await ensureDir(targetDir);

    // 创建分类目录
    const categories = [
        '符合格式的文件',
        '非身份证号_姓名',
        '普通文件名',
        '其他格式'
    ];
    
    // 并行创建所有分类目录
    await Promise.all(categories.map(category => 
        ensureDir(path.join(targetDir, category))
    ));

    // 读取源目录下的所有文件
    const files = await fs.readdir(sourceDir);
    const result = {
        total: files.length,
        categorized: {}
    };

    // 并行处理所有文件
    await Promise.all(files.map(async file => {
        const category = categorizeFileName(file);
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, category, file);

        // 复制文件到对应分类目录
        await fs.copyFile(sourcePath, targetPath);

        // 统计结果
        result.categorized[category] = (result.categorized[category] || 0) + 1;
    }));

    return result;
}

/**
 * 重命名符合格式的文件文件夹中的文件
 * @param {string} sourceDir 源目录（符合格式的文件文件夹）
 * @param {string} targetDir 目标目录
 * @returns {Promise<Object>} 处理结果统计
 */
async function renameIdCardFiles() {
    // 确保源目录存在
    if (!fsSync.existsSync(validDir)) {
        throw new Error(`源目录 "${validDir}" 不存在`);
    }

    // 创建目标目录
    await ensureDir(renameDir);

    // 读取源目录下的所有文件
    const files = await fs.readdir(validDir);
    const result = {
        total: files.length,
        success: 0,
        failed: 0,
        errors: []
    };

    // 并行处理所有文件
    await Promise.all(files.map(async file => {
        try {
            // 分离文件名和扩展名
            const parts = file.split('.');
            const ext = parts.length > 1 ? `.${parts.pop()}` : '';
            const nameWithoutExt = parts.join('.');

            // 提取身份证号
            let idCard;
            if (originalFileNameRule === '身份证号_姓名') {
                idCard = nameWithoutExt.split('_')[0];
            } else if (originalFileNameRule === '姓名_身份证号') {
                idCard = nameWithoutExt.split('_')[1];
            }

            // 新文件名：身份证号.原扩展名
            const newFileName = `${idCard}${ext}`;
            // console.log(newFileName);
            
            // 源文件和目标文件的完整路径
            const sourcePath = path.join(validDir, file);
            const targetPath = path.join(renameDir, newFileName);

            // 复制并重命名文件
            await fs.copyFile(sourcePath, targetPath);
            result.success++;
        } catch (error) {
            result.failed++;
            result.errors.push({
                file,
                error: error.message
            });
        }
    }));

    return result;
}

/**
 * 统计指定目录下的文件数量
 * @param {string} dirPath 要统计的目录路径
 * @returns {Promise<number>} 文件数量
 */
async function countFiles(dirPath) {
    // 确保目录存在
    if (!fsSync.existsSync(dirPath)) {
        throw new Error(`目录 "${dirPath}" 不存在`);
    }

    // 读取目录下的所有文件
    const files = await fs.readdir(dirPath);
    
    // 过滤掉目录，只计算文件数量
    const stats = await Promise.all(
        files.map(file => fs.stat(path.join(dirPath, file)))
    );
    
    const fileCount = stats.filter(stat => stat.isFile()).length;

    return fileCount;
}

module.exports = {
    organizePhotos,
    renameIdCardFiles,
    countFiles
};