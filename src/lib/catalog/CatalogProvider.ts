import type { ModelVariant } from "./types";

export type CatalogRefreshResult = {
  models: ModelVariant[];
  updatedAt: string;
  message?: string;
};

export interface CatalogProvider {
  readonly name: string;
  load(): Promise<CatalogRefreshResult>;
  refresh(): Promise<CatalogRefreshResult>;
}
