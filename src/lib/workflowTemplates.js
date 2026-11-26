/**
 * 工作流模板（对标创米 AI 的预置流程）。
 *
 * 每个模板是一套可复用的节点 + 连线编排：
 * - nodes: 节点数组，`key` 为模板内引用标识，`type` 对应 NODE_TYPES，
 *   `position` 为画布坐标，`data` 为覆盖默认值的字段。
 * - edges: 连线数组，`source` / `target` 引用 nodes 中的 `key`。
 *
 * 加载时由 workflow store 映射为真实节点 id 并合并节点默认参数。
 * 后续模板可由后台/配置上传，结构保持不变即可被画布反序列化。
 *
 * 公开字段预留（第一版默认私有自用，后续开放给其他用户复用时只改值/后台配置）：
 * - author: 作者标识（当前为系统预置，后续替换为用户昵称）
 * - visibility: 可见范围，'private' 仅自己 / 'public' 公开复用
 * - updatedAt: 预留更新时间戳
 */
import { REALISM_SUFFIX } from './realism.js'

const VIDEO_SUFFIX = '镜头连贯自然，光影稳定不闪烁，人物与物体不变形，背景干净'


export const WORKFLOW_TEMPLATES = [
  {
    id: 'outfit-look',
    title: '穿搭成品生成',
    icon: '🧍',
    group: 'image',
    description: '人物自拍 + 单品图，结合文案提示词生成自然真实的穿搭展示图。',
    author: '系统预置',
    visibility: 'private',
    nodes: [
      {
        key: 'text',
        type: 'text',
        position: { x: 140, y: 80 },
        data: { text: `参考人物与单品，生成自然真实的早秋穿搭展示图；${REALISM_SUFFIX}` }
      },
      {
        key: 'person',
        type: 'image',
        position: { x: 140, y: 180 },
        data: { title: '人物自拍' }
      },
      {
        key: 'item',
        type: 'image',
        position: { x: 140, y: 360 },
        data: { title: '单品图' }
      },
      {
        key: 'out',
        type: 'ai-image',
        position: { x: 480, y: 200 },
        data: { title: '穿搭成品', size: '3:4', count: 1 }
      }
    ],
    edges: [
      { source: 'text', target: 'out' },
      { source: 'person', target: 'out' },
      { source: 'item', target: 'out' }
    ]
  },
  {
    id: 'main-image',
    title: '商品主图直出',
    icon: '🖼',
    group: 'image',
    description: '一段商品描述提示词直接生成方形白底主图，适合快速出图跑量。',
    author: '系统预置',
    visibility: 'private',
    nodes: [
      {
        key: 'text',
        type: 'text',
        position: { x: 140, y: 160 },
        data: { text: `商品：____；纯白干净背景；柔和均匀光线；主体居中占画面约七成；${REALISM_SUFFIX}` }
      },
      {
        key: 'out',
        type: 'ai-image',
        position: { x: 480, y: 160 },
        data: { title: '主图', size: '1:1', count: 1 }
      }
    ],
    edges: [{ source: 'text', target: 'out' }]
  },
  {
    id: 'product-video',
    title: '商品展示视频',
    icon: '🎬',
    group: 'video',
    description: '提示词驱动的竖屏商品运镜短视频，展示整体与细节。',
    author: '系统预置',
    visibility: 'private',
    nodes: [
      {
        key: 'text',
        type: 'text',
        position: { x: 140, y: 160 },
        data: { text: `商品：____；镜头缓慢环绕/推拉展示整体与细节；背景干净，光线均匀；节奏轻快，竖屏约 5 秒；${VIDEO_SUFFIX}` }
      },
      {
        key: 'out',
        type: 'video',
        position: { x: 480, y: 160 },
        data: { title: '展示视频', ratio: '9:16', duration: 5 }
      }
    ],
    edges: [{ source: 'text', target: 'out' }]
  }
]

export function getWorkflowTemplate(id) {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id) || null
}
