/**
 * CSV 解析和校验功能
 */
import { CsvRow, CsvParseResult } from './types';

/**
 * 解析 CSV 文件内容
 */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = parseCsvContent(content);
        resolve(result);
      } catch (error) {
        reject(new Error(`CSV 解析失败: ${error instanceof Error ? error.message : '未知错误'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 解析 CSV 内容字符串
 */
export function parseCsvContent(content: string): CsvParseResult {
  // 正确地按记录切分（考虑引号与多行字段）
  const lines = splitCsvRows(content);
  
  if (lines.length === 0) {
    return { validRows: [], invalidRows: 0, totalRows: 0, errors: ['CSV 文件为空'] };
  }

  const validRows: CsvRow[] = [];
  const errors: string[] = [];
  let invalidRows = 0;

  // 表头检测（保留你的逻辑即可）
  const firstLineColumns = parseCsvLine(lines[0]);
  const hasHeader = firstLineColumns.length >= 2 && (
    isNaN(Number(firstLineColumns[0])) || 
    firstLineColumns[0].toLowerCase().includes('序号') ||
    firstLineColumns[1].toLowerCase().includes('提示词') ||
    firstLineColumns[0].toLowerCase().includes('id') ||
    firstLineColumns[1].toLowerCase().includes('prompt')
  );
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const columns = parseCsvLine(lines[i]).map(s => s.trim());

    if (columns.length < 2) {
      invalidRows++;
      errors.push(`第 ${i + 1} 行: 列数不足，需要至少 2 列，实际 ${columns.length} 列`);
      continue;
    }

    const id = Number(columns[0]);
    const prompt = columns[1];

    if (isNaN(id) || id <= 0) {
      invalidRows++;
      errors.push(`第 ${i + 1} 行: 序号必须是正整数，当前值: "${columns[0]}"`);
      continue;
    }

    if (!prompt) {
      invalidRows++;
      errors.push(`第 ${i + 1} 行: 提示词不能为空`);
      continue;
    }

    validRows.push({ id, prompt });
  }

  return {
    validRows,
    invalidRows,
    totalRows: lines.length - startIndex,
    errors
  };
}

/**
 * 按“引号之外”的换行切分成记录（支持 \r\n / \n / \r）
 * 同时保留行内的引号，供后续 parseCsvLine 判断字段里的逗号
 */
function splitCsvRows(raw: string): string[] {
  // 去掉 UTF-8 BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  const rows: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (ch === '"') {
      // 处理转义双引号 "" -> "
      if (inQuotes && raw[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch; // 保留引号，后续 parseCsvLine 需要它来识别逗号
      }
      continue;
    }

    if (ch === '\r' || ch === '\n') {
      const isCRLF = ch === '\r' && raw[i + 1] === '\n';
      if (inQuotes) {
        // 引号内的换行属于同一字段
        current += ch;
        if (isCRLF) { current += '\n'; i++; }
      } else {
        // 引号外的换行才是真正的记录分隔
        rows.push(current);
        current = '';
        if (isCRLF) i++;
      }
      continue;
    }

    current += ch;
  }

  // 收尾
  if (current.length > 0 || !rows.length) rows.push(current);

  // 去除空白记录
  return rows.map(r => r.trim()).filter(r => r.length > 0);
}

/**
 * 解析 CSV 行（处理引号和逗号）
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号
        current += '"';
        i++; // 跳过下一个引号
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 分隔符
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // 添加最后一个字段
  result.push(current);
  
  return result;
}

/**
 * 校验 CSV 文件类型
 */
export function validateCsvFile(file: File): boolean {
  const validTypes = ['text/csv', 'application/csv', 'text/plain'];
  const validExtensions = ['.csv'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidType || hasValidExtension;
}

/**
 * 生成示例 CSV 内容
 */
export function generateSampleCsv(): string {
  return `序号,提示词
1,一只蓝色的小猫，像素风格
2,夕阳下的城市天际线，油画风格
3,未来主义的机器人，科幻风格
4,森林中的小木屋，童话风格
5,抽象的艺术作品，现代风格`;
}


