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

export function getToolDef(slug) {
  return TOOL_DEFS.find((t) => t.slug === slug) || null
}
