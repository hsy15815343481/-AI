/**
 * 素材存取层。
 * 本期落地为浏览器 dataURI；对外接口已预留对象存储切换位。
 * 未来接入对象存储时，只需替换 storeAsset / getAssetUrl 的内部实现，
 * 节点与业务调用方无需改动。
 */

/** 读取本地文件为 dataURI（FileReader） */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 保存素材。本期返回 dataURI；未来可改为上传对象存储并返回可访问 URL。
 * @param {File|Blob} file
 * @returns {Promise<string>} 素材引用（本期为 dataURI）
 */
export async function storeAsset(file) {
  return readFileAsDataUrl(file)
}

/**
 * 取素材可展示地址。本期原样返回；未来可在此做 URL 补全 / 转存处理。
 * @param {string} ref
 * @returns {string}
 */
export function getAssetUrl(ref) {
  return ref || ''
}
