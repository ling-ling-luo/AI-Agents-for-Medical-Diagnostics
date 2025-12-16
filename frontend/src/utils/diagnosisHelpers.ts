/**
 * 诊断相关的共享工具函数
 */

/**
 * 格式化日期时间（完整版）
 * @param dateString ISO 格式的日期字符串
 * @returns 格式化后的日期时间字符串（年-月-日 时:分:秒）
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 格式化日期时间（不含秒）
 * @param dateString ISO 格式的日期字符串
 * @returns 格式化后的日期时间字符串（年-月-日 时:分）
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 格式化执行时间
 * @param ms 毫秒数
 * @returns 格式化后的执行时间字符串（ms 或 s）
 */
export const formatExecutionTime = (ms: number | null | undefined): string => {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

/**
 * 截取诊断报告预览文本
 * @param markdown 完整的 Markdown 文本
 * @param maxLength 最大长度（默认 200 字符）
 * @returns 截取后的预览文本
 */
export const generateDiagnosisPreview = (markdown: string, maxLength: number = 200): string => {
  // 移除 Markdown 标记
  const plainText = markdown
    .replace(/^#+\s+/gm, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
    .replace(/`(.+?)`/g, '$1') // 移除代码标记
    .replace(/\n+/g, ' ') // 将换行替换为空格
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength) + '...';
};

/**
 * 格式化性别显示
 * @param gender 性别值（'male' | 'female' | 其他）
 * @returns 中文性别显示
 */
export const formatGender = (gender: string | null | undefined): string => {
  if (!gender) return '未知';
  if (gender === 'male') return '男';
  if (gender === 'female') return '女';
  return '其他';
};
