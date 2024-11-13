/*
 * @Author: Libra
 * @Date: 2024-11-01 09:48:56
 * @LastEditors: Libra
 * @Description:
 */

const xlsx = require("xlsx");
const fs = require("fs-extra");
const path = require("path");
const { excelPath, resizeDir, categoryByExamDir, successExcel, failExcel } = require("./path");

/**
 * 从Excel文件中读取身份证号列表
 * @param {string} excelPath Excel文件路径
 * @returns {Array<{idCard: string, exam: string}>} 身份证号和考试类型数组
 */
function readIdCardsFromExcel(excelPath) {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  const [headers, ...rows] = data;
  const idCardIndex = headers.findIndex((header) => header.includes("证件号码"));
  const examIndex = headers.findIndex((header) => header.includes("试卷"));

  if (idCardIndex === -1 || examIndex === -1) {
    throw new Error("Excel文件必须包含身份证号和试卷列");
  }
  return rows.map((row) => ({
    idCard: row[idCardIndex].toString(),
    exam: row[examIndex],
  }));
}

/**
 * 复制对应的身份证图片到新文件夹
 * @param {Array<{idCard: string, exam: string}>} records 身份证号记录
 * @param {string} sourceDir 源图片文件夹路径
 * @param {string} targetDir 目标文件夹路径
 */
async function copyIdCardImages(records, sourceDir, targetDir) {
  const recordsByExam = records.reduce((acc, record) => {
    if (!acc[record.exam]) {
      acc[record.exam] = [];
    }
    acc[record.exam].push(record);
    return acc;
  }, {});

  console.log(recordsByExam);

  const files = await fs.readdir(sourceDir);
  let found = 0;
  let notFound = 0;
  const successRecords = [];
  const failRecords = [];

  for (const [examType, examRecords] of Object.entries(recordsByExam)) {
    const examTargetDir = path.join(targetDir, examType);
    await fs.ensureDir(examTargetDir);

    for (const record of examRecords) {
      // 查找匹配的文件（格式：身份证号.后缀）
      const matchedFile = files.find(file => {
        const fileIdCard = path.parse(file).name; // 获取不带后缀的文件名
        return fileIdCard === record.idCard;
      });

      if (matchedFile) {
        const sourcePath = path.join(sourceDir, matchedFile);
        const targetPath = path.join(examTargetDir, matchedFile);

        try {
          await fs.copy(sourcePath, targetPath);
          found++;
          console.log(`已复制到 ${examType} 文件夹: ${matchedFile}`);
          successRecords.push(record);
        } catch (error) {
          console.error(`复制失败 ${matchedFile}:`, error);
          failRecords.push(record);
        }
      } else {
        console.log(`未找到图片: ${record.idCard}`);
        notFound++;
        failRecords.push(record);
      }
    }
  }

  console.log("\n处理完成:");
  console.log(`成功复制: ${found} 个文件`);
  console.log(`未找到: ${notFound} 个文件`);

  return { successRecords, failRecords };
}

/**
 * 写入处理结果到Excel
 * @param {Array} records 记录数组
 * @param {string} outputPath 输出路径
 */
function writeResultToExcel(records, outputPath) {
  const workbook = xlsx.utils.book_new();
  const headers = ["证件号码", "试卷类型"];
  const data = [
    headers,
    ...records.map((record) => [record.idCard, record.exam]),
  ];
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  xlsx.writeFile(workbook, outputPath);
  console.log(`记录已写入: ${outputPath}`);
}

/**
 * run
 */
async function runExport() {
  const config = {
    excelPath,
    sourceImageDir: resizeDir,
    targetImageDir: categoryByExamDir,
    outputExcel: successExcel,
    failExcel: failExcel
  };

  try {
    const records = readIdCardsFromExcel(config.excelPath);
    console.log(`从Excel中读取到 ${records.length} 条记录`);

    const { successRecords, failRecords } = await copyIdCardImages(
      records,
      config.sourceImageDir,
      config.targetImageDir
    );

    if (successRecords.length > 0) {
      writeResultToExcel(successRecords, config.outputExcel);
    }

    if (failRecords.length > 0) {
      writeResultToExcel(failRecords, config.failExcel);
    }
  } catch (error) {
    console.error("程序执行出错:", error);
  }
}

module.exports = {
  runExport
}