export interface InitOptions {
  name: string;
}

export interface DevOptions {
  port: string;
  host: string;
}

export interface BuildOptions {}

export interface PreviewOptions {
  port: string;
}

export interface SherpConfig {
  theme?: string;
  title?: string;
  author?: string;
  presentations?: string;
  customStyles?: string;
  customScripts?: string;
  components?: string;
}

export interface ServerOptions {
  host?: string;
  port?: number;
  liveReload?: boolean;
}

export interface ServerInstance {
  server: any;
  url: string;
  port: number;
  reload: () => void;
  close: () => Promise<void>;
}
