export interface GameManifest {
  latest: string;
  available: string[];
  live: string;
  new: Record<string, (number | string)[]>;
}

export interface Manifest {
  hsr: GameManifest;
  [game: string]: GameManifest;
}

export interface LocalVersionInfo {
  game_version?: string;
  version_label?: string;
  client?: string;
  build?: string;
  synced_at?: string;
}
