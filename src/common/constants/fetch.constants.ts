export enum FetchSource {
  NVD = 'NVD',
}

export enum ResourceType {
  CVE = 'CVE',
}

export enum FetchStatus {
  IDLE = 'idle',
  FETCHING = 'fetching',
  ERROR = 'error',
}

export enum FetchStrategy {
  INCREMENTAL = 'incremental',
  FULL = 'full',
}
