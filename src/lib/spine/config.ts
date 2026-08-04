/**
 * Spine 资源 URL 构造（全站唯一实现）
 *
 * 官网源：atlas 原样加载（page 名为逻辑纹理名，无 ':' 可被解析器正常识别），
 * 通过 rawDataURIs 把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL（ADR 0009）。
 * 注意：官网 atlas 的 page 名若替换为含 ':' 的绝对 URL 会被 Spine 解析器当属性行吞掉。
 */
export function buildOfficialConfig(layer: {
  atlas: string;
  json: string;
  textures: Record<string, string>;
}): { jsonUrl: string; atlasUrl: string; rawDataURIs: Record<string, string> } {
  const atlasDir = layer.atlas.slice(0, layer.atlas.lastIndexOf('/') + 1);
  const rawDataURIs: Record<string, string> = {};
  for (const [logicalName, realUrl] of Object.entries(layer.textures)) {
    rawDataURIs[atlasDir + logicalName] = realUrl;
  }
  return { jsonUrl: layer.json, atlasUrl: layer.atlas, rawDataURIs };
}
