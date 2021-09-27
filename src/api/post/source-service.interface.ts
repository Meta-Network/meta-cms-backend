export interface SourceService {
  fetch(path: string): Promise<string>;
}
