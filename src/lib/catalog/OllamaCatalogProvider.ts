import type { CatalogProvider, CatalogRefreshResult } from "./CatalogProvider";

export class OllamaCatalogProvider implements CatalogProvider {
  readonly name = "Ollama";

  async load(): Promise<CatalogRefreshResult> {
    return this.refresh();
  }

  async refresh(): Promise<CatalogRefreshResult> {
    return {
      models: [],
      updatedAt: new Date().toISOString().slice(0, 10),
      message: "Live Ollama catalog sync coming soon. Using curated local catalog for now.",
    };
  }
}
