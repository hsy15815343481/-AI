// 首批工具配置：与后端 tools 表 slug 对齐
export const TOOL_DEFS = [
  {
    slug: 'text-to-image',
    name: 'AI 绘画',
    category: '图像',
    costCredits: 2,
    description: '输入提示词，生成风格化图片。',
    fields: [
      { key: 'prompt', label: '提示词', type: 'textarea', placeholder: '描述你想生成的画面，例如：赛博朋克风格的猫，雨夜街道', required: true },
      { key: 'size', label: '尺寸', type: 'select', options: ['1:1', '3:4', '16:9'], required: false }
    ]
  },
  {
    slug: 'copywriting',
    name: '文案生成',
    category: '文本',
    costCredits: 1,
    description: '根据主题生成营销 / 社交文案。',
    fields: [
      { key: 'topic', label: '主题', type: 'input', placeholder: '例如：秋季新款卫衣卖点', required: true },
      { key: 'tone', label: '语气', type: 'select', options: ['活泼', '正式', '种草', '简洁'], required: false }
    ]
  },
  {
    slug: 'text-to-video',
    name: 'AI 视频',
    category: '多媒体',
    costCredits: 5,
    description: '根据提示词与参考图生成短视频。',
    fields: [
      { key: 'prompt', label: '提示词', type: 'textarea', placeholder: '描述镜头、主体与场景，例如：卫衣模特自然走动转身，街拍背景，竖屏', required: true },
      { key: 'ratio', label: '画幅', type: 'select', options: ['16:9', '9:16', '1:1'], required: false },
      { key: 'duration', label: '时长(秒)', type: 'input', placeholder: '2-30 秒，默认 5', required: false }
    ]
  }
]

export const INITIAL_CREDITS = Number(import.meta.env.VITE_INITIAL_CREDITS || 10)

/** 品牌与顶部标语（集中维护，避免多处写死） */
export const BRAND = {
  name: '秋挽AI',
  slogan: '专为服装电商行业打造的AI工具'
}

/** 首页创作区主标题与副标（卖点文案，可配置） */
export const PAGE_HERO = {
  title: '国内 / 跨境电商出图专家',
  subtitle: '天花板的效果，跑量的价格，极致性价比'
}

/** 工具 slug → 展示名（各页面统一引用，消除重复字面量） */
export const TOOL_LABELS = {
  'text-to-image': 'AI 绘画',
  copywriting: '文案生成',
  'text-to-video': 'AI 视频'
}

/** 比例选项；shape 用于组件内绘制比例轮廓小图标 */
export const RATIO_OPTIONS = [
  { value: 'random', label: '随机比例', shape: 'random' },
  { value: '1:1', label: '1:1', shape: 'square' },
  { value: '3:4', label: '3:4', shape: 'portrait' },
  { value: '16:9', label: '16:9', shape: 'landscape' },
  { value: '4:3', label: '4:3', shape: 'four-three' },
  { value: '9:16', label: '9:16', shape: 'nine-sixteen' },
  { value: '2:3', label: '2:3', shape: 'two-three' },
  { value: '3:2', label: '3:2', shape: 'three-two' },
  { value: '21:9', label: '21:9', shape: 'ultrawide' }
]

/** 各用途可用比例子集（随机比例通吃） */
export const RATIO_KIND_MAP = {
  image: ['random', '1:1', '3:4', '4:3', '2:3', '16:9'],
  video: ['random', '16:9', '9:16', '1:1', '21:9', '3:4'],
  copy: []
}

/** 分辨率档位，按用途区分 */
export const RESOLUTION_OPTIONS = {
  image: [
    { value: '2K', label: '高清 2K' },
    { value: '4K', label: '超清 4K' }
  ],
  video: [
    { value: '480P', label: '标清 480P' },
    { value: '720P', label: '高清 720P' },
    { value: '1080P', label: '超清 1080P' }
  ]
}

/** 默认比例 / 分辨率 */
export const DEFAULT_RATIO = 'random'
export const DEFAULT_RESOLUTION = { image: '2K', video: '720P', copy: '' }

export function getToolDef(slug) {
  return TOOL_DEFS.find((t) => t.slug === slug) || null
}
