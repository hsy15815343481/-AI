/**
 * 左侧快捷功能栏配置（对齐参考图中的电商功能清单）。
 *
 * 每项映射到现有工具 slug（targetTool）与预设模板 slug（presetSlug）；
 * pending=true 表示该编辑/穿戴类能力待接入对应模型渠道，前端灰显并提示，
 * 不进入真实提交流程。提示词与表单仍复用 presets.js 的回填逻辑。
 *
 * kind 用于过滤可选模型与比例/分辨率档位：image 文生图 / video 视频 / copy 文案。
 */

export const QUICK_TOOL_GROUPS = [
  { key: 'render', label: '出图套图' },
  { key: 'white', label: '白底与场景' },
  { key: 'model', label: '模特与穿戴' },
  { key: 'edit', label: '图片编辑' },
  { key: 'video', label: '视频动图' }
]

export const QUICK_TOOLS = [
  // 出图套图
  { key: 'agent', name: '万能出图Agent', icon: '✨', group: 'render', kind: 'image', targetTool: 'text-to-image', presetSlug: '', costCredits: 2, pending: false },
  { key: 'main-set', name: '主图套图', icon: '🖼️', group: 'render', kind: 'image', targetTool: 'text-to-image', presetSlug: 'main-set', costCredits: 2, pending: false },
  { key: 'remake', name: '主图复刻', icon: '📋', group: 'render', kind: 'image', targetTool: 'text-to-image', presetSlug: 'remake', costCredits: 2, pending: false },
  { key: 'multi-angle', name: '主图裂变/多角度', icon: '🔁', group: 'render', kind: 'image', targetTool: 'text-to-image', presetSlug: 'multi-angle', costCredits: 2, pending: false },

  // 白底与场景
  { key: 'white-bg', name: '服装白底图', icon: '⬜', group: 'white', kind: 'image', targetTool: 'text-to-image', presetSlug: 'white-bg', costCredits: 2, pending: false },
  { key: 'product-white', name: '商品白底图', icon: '◻️', group: 'white', kind: 'image', targetTool: 'text-to-image', presetSlug: 'white-bg', costCredits: 2, pending: false },
  { key: 'scene', name: '产品做场景', icon: '🏞', group: 'white', kind: 'image', targetTool: 'text-to-image', presetSlug: 'scene-image', costCredits: 2, pending: false },
  { key: 'detail', name: '生成细节图', icon: '🔍', group: 'white', kind: 'image', targetTool: 'text-to-image', presetSlug: 'detail-image', costCredits: 2, pending: false },

  // 模特与穿戴
  { key: 'model-wear', name: 'AI服装上身', icon: '🧍', group: 'model', kind: 'image', targetTool: 'text-to-image', presetSlug: 'model-wear', costCredits: 2, pending: true },
  { key: 'tryon-all', name: '万物穿戴', icon: '👕', group: 'model', kind: 'image', targetTool: 'text-to-image', presetSlug: 'tryon-all', costCredits: 2, pending: true },
  { key: 'pose-split', name: '姿势裂变', icon: '🧘', group: 'model', kind: 'image', targetTool: 'text-to-image', presetSlug: 'pose-split', costCredits: 2, pending: false },

  // 图片编辑
  { key: 'replace-product', name: '替换产品', icon: '🔄', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'replace-product', costCredits: 2, pending: true },
  { key: 'remove-watermark', name: '去除水印', icon: '🚫', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'remove-watermark', costCredits: 2, pending: true },
  { key: 'recolor', name: '一键换色', icon: '🎨', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'recolor', costCredits: 2, pending: false },
  { key: 'smooth-cloth', name: '服装去褶皱', icon: '🧺', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'smooth-cloth', costCredits: 2, pending: false },
  { key: 'cutout', name: '精准抠图', icon: '✂️', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'cutout', costCredits: 2, pending: true },
  { key: 'upscale', name: '高清放大', icon: '🔎', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'upscale', costCredits: 2, pending: true },
  { key: 'img-translate', name: '图片翻译', icon: '🌐', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'img-translate', costCredits: 2, pending: false },
  { key: 'clean-img', name: '洗图', icon: '✨', group: 'edit', kind: 'image', targetTool: 'text-to-image', presetSlug: 'clean-img', costCredits: 2, pending: false },

  // 视频动图
  { key: 'gif', name: 'GIF动图', icon: '🎞', group: 'video', kind: 'video', targetTool: 'text-to-video', presetSlug: 'gif', costCredits: 5, pending: true }
]

export function quickToolsByGroup(groupKey) {
  return QUICK_TOOLS.filter((t) => t.group === groupKey)
}

export function getQuickTool(key) {
  return QUICK_TOOLS.find((t) => t.key === key) || null
}
