/**
 * 「去 AI 感」真实感提示词片段库。
 *
 * 设计原则：
 * - 正向锚点（POSITIVE_ANCHORS）：补真实光、真实纹理、自然构图、生活细节，让出片接近实拍。
 * - 反向约束（NEGATIVE_CONSTRAINTS）：描述要规避的 AI 感问题；当前后端渠道多为纯文生图，
 *   不依赖独立 negative prompt 字段，反向约束以「避免：……」句式并入提示词尾句。
 * - 拼接时对基础描述已包含的锚点做去重，避免同一句反复堆叠。
 *
 * 配套规范文档：docs/prompt-realism-guide.md
 */

/** 通用真实感正向锚点（电商 / 穿搭 / 商品场景适用） */
export const POSITIVE_ANCHORS = [
  '单侧自然光源，明暗过渡柔和',
  '保留真实皮肤与面料纹理，可见自然毛孔与织物纹路',
  '非居中的自然构图，带少量生活场景细节',
  '轻微胶片颗粒，画面不过度锐化',
  '阴影方向与光源一致，投影自然落地',
  '材质反射符合真实物理规律'
]

/** 需要规避的 AI 感问题（并入尾句，用「避免」句式） */
export const NEGATIVE_CONSTRAINTS = [
  '蜡感或塑料质感皮肤',
  '全域过曝、高光溢出',
  '过度磨皮、五官失真',
  '畸形肢体、手指错乱',
  '虚假光影、贴图感',
  'AI 塑料质感、边缘模糊发虚'
]

/** 从正向锚点中取前 n 条，避免提示词过长 */
function pickPositive(anchors, n = 4) {
  return anchors.slice(0, n)
}

/** 拼接真实感尾句；includeNegative 控制是否带反向约束 */
export function buildRealismSuffix({ includeNegative = true, positiveCount = 4 } = {}) {
  const positive = pickPositive(POSITIVE_ANCHORS, positiveCount)
  const parts = [`真实实拍质感：${positive.join('；')}`]
  if (includeNegative) {
    parts.push(`避免：${NEGATIVE_CONSTRAINTS.join('、')}`)
  }
  return parts.join('；')
}

/**
 * 组合图片提示词：基础描述 + 真实感锚点 + 反向约束。
 * @param {string} base 用户/模板的基础描述
 * @param {{ includeNegative?: boolean, positiveCount?: number }} opts
 * @returns {string} 可直接提交给文生图渠道的提示词
 */
export function composeImagePrompt(base, opts = {}) {
  const clean = String(base || '').trim()
  if (!clean) return buildRealismSuffix(opts)
  const suffix = buildRealismSuffix(opts)
  // 基础描述已带真实感尾句时不重复追加
  if (clean.includes('真实实拍质感')) return clean
  return `${clean}；${suffix}`
}

/** 供模板直接引用的默认真实感尾句（含反向约束） */
export const REALISM_SUFFIX = buildRealismSuffix()
