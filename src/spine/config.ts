
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
