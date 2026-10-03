/** 版本元数据类型（manifest.json 站点清单 + version.json 本地源版本信息） */

/* ─── manifest.json ─── */

export interface GameManifest {
  latest: string;
  available: string[];
  live: string;
  /** 各版本新增内容 ID（仅增量，无完整列表端点 → 目录页通过 CDN 增量推断） */
  new: Record<string, (number | string)[]>;
}

export interface Manifest {
  hsr: GameManifest;
  [game: string]: GameManifest;
}

/* ─── 本地版本信息（converter 输出，public/data/cn/version.json） ─── */

/** 游戏版本信息：由子模块 git 提交标题（OSPRODWin4.4.0_...）解析；git 不可用时为空对象 */
export interface LocalVersionInfo {
  /** 完整版本号（4.4.0） */
  game_version?: string;
  /** 大版本标签（4.4） */
  version_label?: string;
  /** 客户端标识（OSPRODWin4.4.0） */
  client?: string;
  /** 构建号（D..._A..._L...） */
  build?: string;
  /** 源数据同步日期（子模块 git 提交日期） */
  synced_at?: string;
}
