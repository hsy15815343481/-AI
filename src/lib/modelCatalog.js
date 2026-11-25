/**
 * 模型目录（前端展示层）。
 *
 * 每个型号对应后端渠道注册表中的一个真实渠道 + 模型（channel/model），
 * 前端用自有别名 label 展示，提交时仍回传真实 channel + model。
 *
 * 字段：
 *   key      前端唯一标识
 *   channel  渠道 id（对应 server/channel-registry.js）
 *   model    真实模型名
 *   label    产品型号别名（不沿用竞品命名）
 *   desc     一句能力说明
 *   fit      适用场景标签
 *   kind     image / video / chat
 *   available 是否已开通真实渠道；未开通前置 false，后端渠道状态回来后可覆盖
 *   badge    可选运营角标文案
 *
 * 注意：能力说明为占位文案，待真实渠道开通后按实测效果校正。
 */

export const MODEL_CATALOG = [
  // ---- 文生图 ----
  {
    key: 'seadream-lite',
    channel: 'volc-seedream',
    model: 'doubao-seedream-5-0-lite',
    label: '秋挽·通用版',
    desc: '改图、做商品主图能力强，上手快',
    fit: '主图 · 跑量款',
    kind: 'image',
    available: false
  },
  {
    key: 'seadream-pro',
    channel: 'volc-seedream',
    model: 'doubao-seedream-5-0-pro',
    label: '秋挽·Pro 版',
    desc: '通用升级版，整体品质更好',
    fit: '高质量主图',
    kind: 'image',
    available: false
  },
  {
    key: 'seadream-cloth',
    channel: 'volc-seedream',
    model: 'doubao-seedream-5-5-261028',
    label: '秋挽·服装细节版',
    desc: '面料纹理细节表现好，服装鞋帽家纺适用',
    fit: '服装 · 面料细节',
    kind: 'image',
    available: false
  },
  {
    key: 'cogview-stable',
    channel: 'zhipu',
    model: 'cogview-4',
    label: '秋挽·高质稳定版',
    desc: '质感稳、一致性强，适合模特类高质量出图',
    fit: '模特 · 高质量',
    kind: 'image',
    available: false
  },

  // ---- 文案 ----
  {
    key: 'deepseek-copy',
    channel: 'deepseek',
    model: 'deepseek-chat',
    label: '秋挽·文案模型',
    desc: '提炼卖点，生成营销 / 种草文案',
    fit: '营销文案',
    kind: 'chat',
    available: false
  },

  // ---- 视频 ----
  {
    key: 'seedance-fast',
    channel: 'volc-seedance',
    model: 'doubao-seedance-2-0-fast',
    label: '秋挽·视频快版',
    desc: '出片快，适合跑量商品展示视频',
    fit: '商品展示',
    kind: 'video',
    available: false
  },
  {
    key: 'seedance-pro',
    channel: 'volc-seedance',
    model: 'doubao-seedance-2-5',
    label: '秋挽·视频 Pro',
    desc: '画质与运动表现更好，适合高质穿搭视频',
    fit: '高质穿搭视频',
    kind: 'video',
    available: false
  },
  {
    key: 'wanxiang-stable',
    channel: 'bailian-wanxiang',
    model: 'wan3.0-video-prime',
    label: '秋挽·视频稳版',
    desc: '稳定性强，服装上身类场景适用',
    fit: '穿搭视频',
    kind: 'video',
    available: false
  }
]

/** 按用途过滤模型；kind 缺省返回全部 */
export function modelsByKind(kind) {
  return kind ? MODEL_CATALOG.filter((m) => m.kind === kind) : MODEL_CATALOG
}

export function getModel(key) {
  return MODEL_CATALOG.find((m) => m.key === key) || null
}
