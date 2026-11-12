import type { CatalogProvider, CatalogRefreshResult } from "./CatalogProvider";

export class HuggingFaceCatalogProvider implements CatalogProvider {
  readonly name = "Hugging Face";

  async load(): Promise<CatalogRefreshResult> {
    return this.refresh();
  }

  async refresh(): Promise<CatalogRefreshResult> {
    return {
      models: [],
      updatedAt: new Date().toISOString().slice(0, 10),
      message: "Live Hugging Face catalog sync coming soon. Using curated local catalog for now.",
    };
  }
}
