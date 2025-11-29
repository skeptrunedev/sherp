export interface InitOptions {
  name?: string;
}

export interface DevOptions {
  port: string;
  host: string;
}

export interface BuildOptions {}

export interface ExportOptions {
  format?: 'pdf' | 'pptx' | 'images';
  output?: string;
}

export interface PreviewOptions {
  port: string;
}

export interface SherpConfig {
  title?: string;
  author?: string;
  presentationFile?: string;
  customStyles?: string;
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
