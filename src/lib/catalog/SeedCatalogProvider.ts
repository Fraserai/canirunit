import type { CatalogProvider, CatalogRefreshResult } from "./CatalogProvider";
import type { ModelVariant } from "./types";

const seedCatalogUrl = new URL("../../data/models.json", import.meta.url).href;
let seedModels: ModelVariant[] | undefined;

async function loadSeedModels(): Promise<ModelVariant[]> {
  if (seedModels) return seedModels;

  const response = await fetch(seedCatalogUrl);
  if (!response.ok) {
    throw new Error(`Could not load curated model catalog (${response.status}).`);
  }

  seedModels = (await response.json()) as ModelVariant[];
  return seedModels;
}

function newestCatalogDate(models: ModelVariant[]): string {
  const dates = models
    .map((model) => model.lastUpdated)
    .filter((date): date is string => Boolean(date))
    .sort();

  return dates[dates.length - 1] ?? new Date().toISOString().slice(0, 10);
}

export class SeedCatalogProvider implements CatalogProvider {
  readonly name = "Curated local catalog";

  async load(): Promise<CatalogRefreshResult> {
    const models = await loadSeedModels();

    return {
      models,
      updatedAt: newestCatalogDate(models),
    };
  }

  async refresh(): Promise<CatalogRefreshResult> {
    const models = await loadSeedModels();

    return {
      models,
      updatedAt: newestCatalogDate(models),
      message: "Live catalog sync coming soon. Using curated local catalog.",
    };
  }
}
