import { RefreshCw, Search } from "lucide-react";
import type { ModelTask, Runtime } from "../lib/catalog/types";
import type { FitLevel } from "../lib/compatibility/types";
import { humanTask } from "../lib/utils/format";

export type SortOption = "best-fit" | "lowest-memory" | "highest-quality" | "fastest" | "smallest-download";

type ModelFiltersProps = {
  search: string;
  selectedTasks: ModelTask[];
  selectedRuntimes: Runtime[];
  selectedFitLevels: FitLevel[];
  commercialOnly: boolean;
  runsOfflineOnly: boolean;
  sort: SortOption;
  licenseText: string;
  isRefreshing: boolean;
  catalogUpdatedAt?: string;
  catalogMessage?: string;
  onSearchChange: (value: string) => void;
  onToggleTask: (task: ModelTask) => void;
  onToggleRuntime: (runtime: Runtime) => void;
  onToggleFitLevel: (fit: FitLevel) => void;
  onCommercialOnlyChange: (value: boolean) => void;
  onRunsOfflineOnlyChange: (value: boolean) => void;
  onSortChange: (sort: SortOption) => void;
  onLicenseTextChange: (value: string) => void;
  onRefreshCatalog: () => void;
};

const tasks: ModelTask[] = ["chat", "coding", "vision", "embedding", "image", "audio"];
const runtimes: Runtime[] = ["ollama", "llama.cpp", "vllm"];
const fitLevels: FitLevel[] = ["perfect", "good", "stretch", "not_recommended"];

function chipClass(active: boolean): string {
  return active ? "filter-chip active" : "filter-chip";
}

function fitText(fit: FitLevel): string {
  if (fit === "not_recommended") return "Not recommended";
  return fit[0].toUpperCase() + fit.slice(1);
}

export function ModelFilters({
  search,
  selectedTasks,
  selectedRuntimes,
  selectedFitLevels,
  commercialOnly,
  runsOfflineOnly,
  sort,
  licenseText,
  isRefreshing,
  catalogUpdatedAt,
  catalogMessage,
  onSearchChange,
  onToggleTask,
  onToggleRuntime,
  onToggleFitLevel,
  onCommercialOnlyChange,
  onRunsOfflineOnlyChange,
  onSortChange,
  onLicenseTextChange,
  onRefreshCatalog,
}: ModelFiltersProps) {
  return (
    <section className="filter-panel" aria-label="Model filters">
      <div className="filter-top-row">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search models</span>
          <input
            type="search"
            placeholder="Search model or family"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <label className="sort-field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as SortOption)}>
            <option value="best-fit">Best fit</option>
            <option value="lowest-memory">Lowest memory</option>
            <option value="highest-quality">Highest quality</option>
            <option value="fastest">Fastest</option>
            <option value="smallest-download">Smallest download</option>
          </select>
        </label>

        <button className="secondary-button" type="button" onClick={onRefreshCatalog} disabled={isRefreshing}>
          <RefreshCw size={16} aria-hidden="true" />
          {isRefreshing ? "Refreshing" : "Refresh catalog"}
        </button>
      </div>

      <div className="catalog-status">
        <span>Catalog updated {catalogUpdatedAt ?? "Unknown"}</span>
        {catalogMessage ? <strong>{catalogMessage}</strong> : null}
      </div>

      <div className="filter-groups">
        <div className="filter-group" aria-label="Task filters">
          {tasks.map((task) => (
            <button
              key={task}
              type="button"
              className={chipClass(selectedTasks.includes(task))}
              onClick={() => onToggleTask(task)}
            >
              {humanTask(task)}
            </button>
          ))}
        </div>

        <div className="filter-group" aria-label="Runtime filters">
          {runtimes.map((runtime) => (
            <button
              key={runtime}
              type="button"
              className={chipClass(selectedRuntimes.includes(runtime))}
              onClick={() => onToggleRuntime(runtime)}
            >
              {runtime === "vllm" ? "vLLM" : runtime}
            </button>
          ))}
        </div>

        <div className="filter-group" aria-label="Fit filters">
          {fitLevels.map((fit) => (
            <button
              key={fit}
              type="button"
              className={chipClass(selectedFitLevels.includes(fit))}
              onClick={() => onToggleFitLevel(fit)}
            >
              {fitText(fit)}
            </button>
          ))}
        </div>

        <div className="filter-group" aria-label="Catalog filters">
          <button
            type="button"
            className={chipClass(sort === "smallest-download")}
            onClick={() => onSortChange(sort === "smallest-download" ? "best-fit" : "smallest-download")}
          >
            Smallest download
          </button>
          <button
            type="button"
            className={chipClass(commercialOnly)}
            onClick={() => onCommercialOnlyChange(!commercialOnly)}
          >
            Commercial-use license
          </button>
          <button
            type="button"
            className={chipClass(runsOfflineOnly)}
            onClick={() => onRunsOfflineOnlyChange(!runsOfflineOnly)}
          >
            Runs offline
          </button>
          <label className="license-field">
            <span>License</span>
            <input
              type="search"
              placeholder="Apache, MIT, Llama..."
              value={licenseText}
              onChange={(event) => onLicenseTextChange(event.target.value)}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
