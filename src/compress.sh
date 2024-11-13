#!/bin/bash
###
 # @Author: Libra
 # @Date: 2024-11-04 17:15:40
 # @LastEditors: Libra
 # @Description: 
### 

# 检查命令行参数
if [ $# -ne 2 ]; then
    echo "使用方法: $0 <输入目录> <输出目录>"
    echo "例如: $0 /path/to/input /path/to/output"
    exit 1
fi

# 从命令行参数获取输入和输出目录
INPUT_DIR="$1"
OUTPUT_DIR="$2"

# 确保输入目录存在
if [ ! -d "$INPUT_DIR" ]; then
    echo "错误：输入目录 '$INPUT_DIR' 不存在"
    exit 1
fi

# 启用 nullglob 选项，以防没有匹配的文件时不返回通配符本身
shopt -s nullglob

# 检查输出目录是否存在，如果不存在则创建
if [ ! -d "$OUTPUT_DIR" ]; then
    mkdir -p "$OUTPUT_DIR"
    echo "创建输出目录: $OUTPUT_DIR"
fi

# 获取总文件数
total_files=$(ls -1 "${INPUT_DIR}"*.{JPEG,JPG,PNG,jpeg,jpg,png} 2>/dev/null | wc -l)
current=0

# 遍历输入目录中的所有 .jpeg, .jpg, .png 文件
for file in "${INPUT_DIR}"*.JPEG "${INPUT_DIR}"*.JPG "${INPUT_DIR}"*.PNG "${INPUT_DIR}"*.jpeg "${INPUT_DIR}"*.jpg "${INPUT_DIR}"*.png
do
    # 增加计数器
    ((current++))
    
    # 计算进度百分比
    percentage=$((current * 100 / total_files))
    
    # 提取文件名
    filename=$(basename "$file")
    filename_no_ext="${filename%.*}"
    output_file="${OUTPUT_DIR}${filename_no_ext}.jpg"
    
    # 使用 sips 调整图像大小并保存到输出目录
    sips -Z 274 -s format jpeg "$file" --out "$output_file" >/dev/null 2>&1
    
    # 显示进度条
    echo -ne "\r处理进度: [${percentage}%] (${current}/${total_files}) 当前文件: ${filename}"
done

# 完成后换行
echo -e "\n所有图像已成功调整大小并保存到 $OUTPUT_DIR"