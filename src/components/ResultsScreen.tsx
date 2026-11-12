import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { ModelTask, Runtime } from "../lib/catalog/types";
import type { CompatibilityResult, FitLevel } from "../lib/compatibility/types";
import { mockProfileOptions, type MockProfileId } from "../lib/scanner/mockMachine";
import type { MachineProfile } from "../lib/scanner/types";
import { BestMatchCard } from "./BestMatchCard";
import { EmptyState } from "./EmptyState";
import { MachineSummaryCard } from "./MachineSummaryCard";
import { ModelCard } from "./ModelCard";
import { ModelFilters, type SortOption } from "./ModelFilters";
import { ModelTabs, type ModelTab } from "./ModelTabs";
import { PrivacyNote } from "./PrivacyNote";

type ResultsScreenProps = {
  machine: MachineProfile;
  results: CompatibilityResult[];
  catalogUpdatedAt?: string;
  catalogMessage?: string;
  isRefreshingCatalog: boolean;
  selectedMockProfile: MockProfileId;
  onRefreshCatalog: () => void;
  onRescan: (profileId?: MockProfileId) => void;
  onMockProfileChange: (profileId: MockProfileId) => void;
  onCopyInstallCommand: (command?: string) => void;
};

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function isCommercialFriendly(license: string): boolean {
  const lower = license.toLowerCase();
  return !["non-commercial", "research", "cc-by-nc"].some((term) => lower.includes(term));
}

function inTab(result: CompatibilityResult, activeTab: ModelTab): boolean {
  if (activeTab === "best") return result.fit === "perfect" || result.fit === "good";
  if (activeTab === "compatible") return result.fit !== "not_recommended";
  if (activeTab === "stretch") return result.fit === "stretch";
  return result.fit === "not_recommended";
}

function sortResults(results: CompatibilityResult[], sort: SortOption): CompatibilityResult[] {
  return [...results].sort((a, b) => {
    if (sort === "lowest-memory") {
      return a.model.requirements.recommendedRamGb - b.model.requirements.recommendedRamGb || b.score - a.score;
    }
    if (sort === "highest-quality") {
      return b.model.qualityHints.quality - a.model.qualityHints.quality || b.score - a.score;
    }
    if (sort === "fastest") {
      return b.model.qualityHints.speed - a.model.qualityHints.speed || b.score - a.score;
    }
    if (sort === "smallest-download") {
      return a.model.requirements.diskGb - b.model.requirements.diskGb || b.score - a.score;
    }
    return b.score - a.score || a.model.name.localeCompare(b.model.name);
  });
}

export function ResultsScreen({
  machine,
  results,
  catalogUpdatedAt,
  catalogMessage,
  isRefreshingCatalog,
  selectedMockProfile,
  onRefreshCatalog,
  onRescan,
  onMockProfileChange,
  onCopyInstallCommand,
}: ResultsScreenProps) {
  const [activeTab, setActiveTab] = useState<ModelTab>("best");
  const [search, setSearch] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<ModelTask[]>([]);
  const [selectedRuntimes, setSelectedRuntimes] = useState<Runtime[]>([]);
  const [selectedFitLevels, setSelectedFitLevels] = useState<FitLevel[]>([]);
  const [commercialOnly, setCommercialOnly] = useState(false);
  const [runsOfflineOnly, setRunsOfflineOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("best-fit");
  const [licenseText, setLicenseText] = useState("");

  const compatibleResults = useMemo(
    () => results.filter((result) => result.fit !== "not_recommended"),
    [results],
  );
  const bestMatch = compatibleResults[0];

  const counts = useMemo<Record<ModelTab, number>>(
    () => ({
      best: results.filter((result) => result.fit === "perfect" || result.fit === "good").length,
      compatible: compatibleResults.length,
      stretch: results.filter((result) => result.fit === "stretch").length,
      heavy: results.filter((result) => result.fit === "not_recommended").length,
    }),
    [compatibleResults.length, results],
  );

  const filteredResults = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedLicense = licenseText.trim().toLowerCase();

    return sortResults(
      results.filter((result) => {
        const model = result.model;
        const matchesTab = inTab(result, activeTab);
        const matchesSearch =
          normalizedSearch.length === 0 ||
          model.name.toLowerCase().includes(normalizedSearch) ||
          model.family.toLowerCase().includes(normalizedSearch);
        const matchesTask = selectedTasks.length === 0 || selectedTasks.includes(model.task);
        const matchesRuntime =
          selectedRuntimes.length === 0 || selectedRuntimes.some((runtime) => model.runtimes.includes(runtime));
        const matchesFit = selectedFitLevels.length === 0 || selectedFitLevels.includes(result.fit);
        const matchesCommercial = !commercialOnly || isCommercialFriendly(model.license);
        const matchesOffline = !runsOfflineOnly || model.runtimes.length > 0;
        const matchesLicense =
          normalizedLicense.length === 0 || model.license.toLowerCase().includes(normalizedLicense);

        return (
          matchesTab &&
          matchesSearch &&
          matchesTask &&
          matchesRuntime &&
          matchesFit &&
          matchesCommercial &&
          matchesOffline &&
          matchesLicense
        );
      }),
      sort,
    );
  }, [
    activeTab,
    commercialOnly,
    licenseText,
    results,
    runsOfflineOnly,
    search,
    selectedFitLevels,
    selectedRuntimes,
    selectedTasks,
    sort,
  ]);

  function handleMockChange(profileId: MockProfileId) {
    onMockProfileChange(profileId);
    onRescan(profileId);
  }

  return (
    <main className="results-shell">
      <header className="results-header">
        <div>
          <p className="eyebrow">CanIRunAI results</p>
          <h1>We found {compatibleResults.length} open-source AI models this machine can run.</h1>
          <p>
            Ranked by hardware fit first. Technical requirements stay tucked away until you ask for details.
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => onRescan()}>
            <RotateCcw size={16} aria-hidden="true" />
            Scan again
          </button>
          {import.meta.env.DEV ? (
            <label className="mock-switcher">
              <span>Mock profile</span>
              <select value={selectedMockProfile} onChange={(event) => handleMockChange(event.target.value as MockProfileId)}>
                {mockProfileOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </header>

      <section className="top-grid">
        <BestMatchCard result={bestMatch} />
        <MachineSummaryCard machine={machine} />
      </section>

      <PrivacyNote compact />

      <ModelTabs activeTab={activeTab} counts={counts} onTabChange={setActiveTab} />

      <ModelFilters
        search={search}
        selectedTasks={selectedTasks}
        selectedRuntimes={selectedRuntimes}
        selectedFitLevels={selectedFitLevels}
        commercialOnly={commercialOnly}
        runsOfflineOnly={runsOfflineOnly}
        sort={sort}
        licenseText={licenseText}
        isRefreshing={isRefreshingCatalog}
        catalogUpdatedAt={catalogUpdatedAt}
        catalogMessage={catalogMessage}
        onSearchChange={setSearch}
        onToggleTask={(task) => setSelectedTasks((values) => toggleValue(values, task))}
        onToggleRuntime={(runtime) => setSelectedRuntimes((values) => toggleValue(values, runtime))}
        onToggleFitLevel={(fit) => setSelectedFitLevels((values) => toggleValue(values, fit))}
        onCommercialOnlyChange={setCommercialOnly}
        onRunsOfflineOnlyChange={setRunsOfflineOnly}
        onSortChange={setSort}
        onLicenseTextChange={setLicenseText}
        onRefreshCatalog={onRefreshCatalog}
      />

      <section className="model-list" aria-label="Model compatibility list">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <ModelCard key={result.model.id} result={result} onCopyInstallCommand={onCopyInstallCommand} />
          ))
        ) : (
          <EmptyState
            title="No models match these filters"
            message="Clear a filter or switch tabs to see more catalog entries for this machine."
          />
        )}
      </section>
    </main>
  );
}
