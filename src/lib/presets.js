/**
 * 电商场景模板（快捷功能入口）。
 * 每个模板映射到现有工具 slug（text-to-image / copywriting / text-to-video），
 * 点击侧边入口后把预置提示词与默认参数回填到工具详情页，用户只需替换占位内容。
 *
 * badge 为「待接入」的模板属于图片编辑/图生图类能力，当前后端渠道尚未支持，
 * 仅预置提示词与表单，不承诺真实出图效果。
 *
 * 公开字段预留（第一版默认私有自用，后续开放给其他用户复用时只改值/后台配置）：
 * - author: 作者标识（当前为系统预置，后续替换为用户昵称）
 * - visibility: 可见范围，'private' 仅自己 / 'public' 公开复用
 * 未在条目内显式声明时，由后端 /templates 出口兜底补默认值。
 */
import { REALISM_SUFFIX } from './realism.js'

export const PRESET_GROUPS = [
  { key: 'image', label: '电商出图' },
  { key: 'copy', label: '营销文案' },
  { key: 'video', label: '商品视频' },
  { key: 'edit', label: '图片编辑' }
]

export const PRESETS = [
  // ---- 电商出图 ----
  {
    slug: 'main-image',
    group: 'image',
    title: '商品主图',
    icon: '🖼',
    targetTool: 'text-to-image',
    badge: '',
    description: '方形白底主图，突出商品主体与材质，填入商品名称即可。',
    params: { size: '1:1', n: 1 },
    prompt: '【商品主图】主体：____（填商品名称/款式/颜色）；背景：纯白干净背景；光线：柔和均匀、无硬阴影；构图：主体居中、占画面约七成，突出材质与细节；风格：写实电商摄影，高清 2K，画面干净无杂物。'
  },
  {
    slug: 'main-set',
    group: 'image',
    title: '主图套图',
    icon: '🖼️',
    targetTool: 'text-to-image',
    badge: '',
    description: '一套成套主图：正面主图、侧面、细节统一出图。',
    params: { size: '1:1', n: 3 },
    prompt: '【主图套图】商品：____（填款式/颜色）；成套输出：正面主图、侧面图、细节特写各一张；背景统一为干净浅色，光线与风格一致；主体居中、版型完整；高清写实电商图，三张构图协调。'
  },
  {
    slug: 'white-bg',
    group: 'image',
    title: '服装/商品白底图',
    icon: '⬜',
    targetTool: 'text-to-image',
    badge: '',
    description: '标准白底展示图，适合平台主图位。',
    params: { size: '1:1', n: 1 },
    prompt: '【白底图】主体：____（填服装/商品）；背景：纯白色 #FFFFFF；无道具、无文字、无水印；光线均匀，边缘清晰；平铺或正面悬挂，版型完整；高清写实，适合电商平台白底主图。'
  },
  {
    slug: 'scene-image',
    group: 'image',
    title: '产品场景图',
    icon: '🏞',
    targetTool: 'text-to-image',
    badge: '',
    description: '把商品放进真实使用场景，增强代入感。',
    params: { size: '3:4', n: 1 },
    prompt: '【场景图】主体：____（填商品）；使用场景：____（如街头/居家/办公室/户外）；人物或环境氛围：____；光线：自然日光，氛围真实；构图：商品为视觉中心，场景做衬托；风格：生活方式实拍感，高清，色调统一。'
  },
  {
    slug: 'detail-image',
    group: 'image',
    title: '生成细节图',
    icon: '🔍',
    targetTool: 'text-to-image',
    badge: '',
    description: '面料、走线、配件等局部特写。',
    params: { size: '1:1', n: 1 },
    prompt: '【细节特写】聚焦：____（填面料/走线/纽扣/logo/配件）；主体：____（商品）；背景虚化突出局部；光线：柔和打光体现纹理与质感；微距写实，高清，能看清材质细节，无多余杂物。'
  },
  {
    slug: 'multi-angle',
    group: 'image',
    title: '主图裂变 / 多角度',
    icon: '🔁',
    targetTool: 'text-to-image',
    badge: '',
    description: '同一款商品多角度成套出图。',
    params: { size: '3:4', n: 4 },
    prompt: '【多角度套装】商品：____（填款式/颜色）；视角：正面、侧面、背面、细节各一张；背景统一为干净浅色；光线一致、风格统一；主体居中，版型完整；高清写实电商图，四张构图协调。'
  },
  {
    slug: 'model-wear',
    group: 'image',
    title: 'AI 服装上身',
    icon: '🧍',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '模特上身效果图，需支持参考图的图像渠道。',
    params: { size: '3:4', n: 1 },
    prompt: '【模特上身】服装：____（填款式/颜色）；模特：____（性别/体型/风格）；姿势：自然站立/日常穿搭；场景：简洁街拍或纯色背景；光线自然，服装版型与颜色还原准确；高清穿搭实拍感。'
  },
  {
    slug: 'tryon-all',
    group: 'image',
    title: '万物穿戴',
    icon: '👕',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '把配饰/图案穿戴到模特或物件上，需参考图渠道。',
    params: { size: '3:4', n: 1 },
    prompt: '【万物穿戴】穿戴对象：____（填配饰/图案/鞋包）；载体：____（模特/商品）；佩戴位置自然贴合；风格统一高清，写实展示佩戴效果。'
  },
  {
    slug: 'pose-split',
    group: 'image',
    title: '姿势裂变',
    icon: '🧘',
    targetTool: 'text-to-image',
    badge: '',
    description: '同一服装/形象不同姿势成套出图（文生图近似，非参考图保真）。',
    params: { size: '3:4', n: 4 },
    prompt: '【姿势裂变】人物/服装：____；姿势：正面站立、侧身、坐姿、回眸各一张；场景与光线保持一致；人物形象统一；高清穿搭实拍感。'
  },

  // ---- 营销文案 ----
  {
    slug: 'sell-copy',
    group: 'copy',
    title: '卖点文案',
    icon: '✍️',
    targetTool: 'copywriting',
    badge: '',
    description: '提炼商品核心卖点，短平快适合主图/标题。',
    params: { tone: '种草' },
    topic: '商品：____（填款式/品类）；目标人群：18-26 岁学生与职场新人；请提炼 3 条简洁卖点，突出材质、版型、性价比，口语化不夸大。'
  },
  {
    slug: 'detail-copy',
    group: 'copy',
    title: '详情页文案',
    icon: '📄',
    targetTool: 'copywriting',
    badge: '',
    description: '分段详情文案：卖点、面料、穿搭建议。',
    params: { tone: '正式' },
    topic: '商品：____（填款式/品类）；请写一段详情页文案，分卖点介绍、面料/工艺、穿搭建议三段，语气可信、面向年轻消费者，不要空话套话。'
  },
  {
    slug: 'social-copy',
    group: 'copy',
    title: '社交种草文案',
    icon: '📱',
    targetTool: 'copywriting',
    badge: '',
    description: '小红书/朋友圈风格种草短文。',
    params: { tone: '活泼' },
    topic: '商品：____（填款式/品类）；请写一条社交平台种草短文，第一人称分享，带使用场景和一句推荐语，结尾留互动引导，语气自然像真实买家。'
  },

  // ---- 商品视频 ----
  {
    slug: 'product-video',
    group: 'video',
    title: '商品展示视频',
    icon: '🎬',
    targetTool: 'text-to-video',
    badge: '',
    description: '商品运镜展示短视频。',
    params: { ratio: '9:16', duration: 5, resolution: '720P' },
    prompt: '【商品展示视频】主体：____（填商品）；镜头：缓慢环绕/推拉展示整体与细节；背景干净，光线均匀；节奏轻快，突出商品质感；时长约 5 秒，竖屏。'
  },
  {
    slug: 'tryon-video',
    group: 'video',
    title: '穿搭上身视频',
    icon: '👖',
    targetTool: 'text-to-video',
    badge: '待接入',
    description: '模特走动/转身穿搭视频，需参考图渠道。',
    params: { ratio: '9:16', duration: 5, resolution: '720P' },
    prompt: '【穿搭上身视频】服装：____（填款式）；模特自然走动并转身展示版型；场景简洁；光线自然，服装颜色还原；竖屏短视频，时长约 5 秒。'
  },

  // ---- 图片编辑 ----
  {
    slug: 'replace-product',
    group: 'edit',
    title: '替换产品',
    icon: '🔄',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '保留背景与构图，替换画面中的商品。',
    params: { size: '1:1' },
    prompt: '【替换产品】保留原图背景、构图、光线不变；将商品替换为：____（填新商品）；新商品角度、阴影、质感与原场景自然融合。'
  },
  {
    slug: 'remake',
    group: 'edit',
    title: '主图复刻',
    icon: '📋',
    targetTool: 'text-to-image',
    badge: '',
    description: '按参考图的构图/风格复刻新主图（文生图近似，非逐像素还原）。',
    params: { size: '1:1' },
    prompt: '【主图复刻】参考图的构图、机位、光影与风格；主体换成：____（填自有商品）；保持画面比例与排版一致，高清写实。'
  },
  {
    slug: 'remove-watermark',
    group: 'edit',
    title: '去除水印',
    icon: '🚫',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '清除画面水印并补全背景。',
    params: { size: '1:1' },
    prompt: '【去水印】移除画面中的水印/文字标记，按周围背景自然补全，不留痕迹；其余画面保持不变。'
  },
  {
    slug: 'recolor',
    group: 'edit',
    title: '一键换色',
    icon: '🎨',
    targetTool: 'text-to-image',
    badge: '',
    description: '保持款式不变，近似更换商品颜色（非严格保真换色）。',
    params: { size: '1:1' },
    prompt: '【一键换色】款式、面料、光影尽量不变；将商品颜色改为：____（填颜色）；颜色过渡自然，材质质感保留。'
  },
  {
    slug: 'smooth-cloth',
    group: 'edit',
    title: '服装去褶皱',
    icon: '🧺',
    targetTool: 'text-to-image',
    badge: '',
    description: '提示词抚平衣物褶皱，保留版型纹理（近似处理）。',
    params: { size: '1:1' },
    prompt: '【去褶皱】抚平服装褶皱与折痕，面料平整自然；保留原有版型、颜色和布料纹理，不改变款式。'
  },
  {
    slug: 'cutout',
    group: 'edit',
    title: '精准抠图',
    icon: '✂️',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '分离主体、去掉背景。',
    params: { size: '1:1' },
    prompt: '【精准抠图】完整保留商品主体，边缘干净无毛边；去除原背景，输出便于二次排版的主体图。'
  },
  {
    slug: 'upscale',
    group: 'edit',
    title: '高清放大',
    icon: '🔎',
    targetTool: 'text-to-image',
    badge: '待接入',
    description: '提升分辨率与清晰度，不改变内容。',
    params: { size: '1:1' },
    prompt: '【高清放大】在不改变构图与内容的前提下提升分辨率与清晰度，修复模糊，边缘锐利，细节更干净。'
  },
  {
    slug: 'img-translate',
    group: 'edit',
    title: '图片翻译',
    icon: '🌐',
    targetTool: 'text-to-image',
    badge: '',
    description: '图中文字翻译为目标语言（文生图近似，复杂排版可能不准）。',
    params: { size: '1:1' },
    prompt: '【图片翻译】将图中文字翻译为：____（填目标语言）；尽量保留原字体风格、位置与排版，译文自然通顺。'
  },
  {
    slug: 'clean-img',
    group: 'edit',
    title: '洗图',
    icon: '✨',
    targetTool: 'text-to-image',
    badge: '',
    description: '降噪调色、净化画面质感（近似增强）。',
    params: { size: '1:1' },
    prompt: '【洗图】降低噪点、校正偏色、提升通透感与对比度；保留真实材质，不过度磨皮，画面干净清晰。'
  },
  {
    slug: 'gif',
    group: 'edit',
    title: 'GIF 动图',
    icon: '🎞',
    targetTool: 'text-to-video',
    badge: '待接入',
    description: '短循环动图，后续接入动图渠道。',
    params: { ratio: '1:1', duration: 3, resolution: '480P' },
    prompt: '【GIF 动图】主体：____；动作：轻微循环摆动/转场；画面简洁，循环自然，短时长。'
  }
]

// 图片类模板统一补真实感锚点与反向约束（已含尾句的不重复追加）
for (const p of PRESETS) {
  if (p.group === 'image' && p.prompt && !p.prompt.includes('真实实拍质感')) {
    p.prompt = `${p.prompt}；${REALISM_SUFFIX}`
  }
}

export function getPreset(slug) {
  return PRESETS.find((p) => p.slug === slug) || null
}

export function presetsByGroup(groupKey) {
  return PRESETS.filter((p) => p.group === groupKey)
}
