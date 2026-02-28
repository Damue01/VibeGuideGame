// ============================================================
// VibeGuide - 确定性伪随机工具
// 基于种子值的可复现随机数生成器，保证每次渲染结果一致
// ============================================================

/** 基于种子值的确定性伪随机数 (0~1)，使用 mulberry32 算法保证分布均匀 */
export function seededRandom(seed: number): number {
  let t = (seed | 0) + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** 字符串 → 整数哈希（DJB2 变体） */
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
