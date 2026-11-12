import { useMemo, useState } from "react";
import { ResultsScreen } from "../components/ResultsScreen";
import { ScanningScreen } from "../components/ScanningScreen";
import { WelcomeScreen } from "../components/WelcomeScreen";
import { SeedCatalogProvider } from "../lib/catalog/SeedCatalogProvider";
import type { ModelVariant } from "../lib/catalog/types";
import { evaluateCatalog } from "../lib/compatibility/compatibilityEngine";
import type { CompatibilityResult } from "../lib/compatibility/types";
import { mockProfileOptions, type MockProfileId } from "../lib/scanner/mockMachine";
import { scanMachine } from "../lib/scanner/scanMachine";
import type { MachineProfile } from "../lib/scanner/types";
import { copyText } from "../lib/utils/copy";

type Screen = "welcome" | "scanning" | "results";

const minimumScanDurationMs = 1800;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function App() {
  const catalogProvider = useMemo(() => new SeedCatalogProvider(), []);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedMockProfile, setSelectedMockProfile] = useState<MockProfileId>("auto");
  const [scanningStep, setScanningStep] = useState(0);
  const [machine, setMachine] = useState<MachineProfile | undefined>();
  const [models, setModels] = useState<ModelVariant[]>([]);
  const [results, setResults] = useState<CompatibilityResult[]>([]);
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState<string | undefined>();
  const [catalogMessage, setCatalogMessage] = useState<string | undefined>();
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false);
  const [toast, setToast] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function runScan(profileId = selectedMockProfile) {
    setScreen("scanning");
    setError(undefined);
    setCatalogMessage(undefined);
    setScanningStep(0);

    const started = Date.now();
    const interval = window.setInterval(() => {
      setScanningStep((step) => Math.min(step + 1, 3));
    }, 520);

    try {
      const [profile, catalog] = await Promise.all([scanMachine(profileId), catalogProvider.load()]);
      const elapsed = Date.now() - started;
      if (elapsed < minimumScanDurationMs) {
        await delay(minimumScanDurationMs - elapsed);
      }

      setMachine(profile);
      setModels(catalog.models);
      setCatalogUpdatedAt(catalog.updatedAt);
      setCatalogMessage(catalog.message);
      setResults(evaluateCatalog(profile, catalog.models));
      setScreen("results");
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : String(scanError));
      setScreen("welcome");
    } finally {
      window.clearInterval(interval);
    }
  }

  async function refreshCatalog() {
    if (!machine) return;
    setIsRefreshingCatalog(true);
    try {
      const refreshed = await catalogProvider.refresh();
      setModels(refreshed.models);
      setCatalogUpdatedAt(refreshed.updatedAt);
      setCatalogMessage(refreshed.message);
      setResults(evaluateCatalog(machine, refreshed.models));
    } catch (refreshError) {
      setCatalogMessage(refreshError instanceof Error ? refreshError.message : "Catalog refresh failed.");
    } finally {
      setIsRefreshingCatalog(false);
    }
  }

  async function handleCopyInstallCommand(command?: string) {
    if (!command) {
      setToast("Install command not available yet for this catalog entry.");
      window.setTimeout(() => setToast(undefined), 2400);
      return;
    }

    await copyText(command);
    setToast("Install command copied.");
    window.setTimeout(() => setToast(undefined), 1800);
  }

  if (screen === "scanning") {
    return <ScanningScreen stepIndex={scanningStep} />;
  }

  if (screen === "results" && machine) {
    return (
      <>
        <ResultsScreen
          machine={machine}
          results={results}
          catalogUpdatedAt={catalogUpdatedAt}
          catalogMessage={catalogMessage}
          isRefreshingCatalog={isRefreshingCatalog}
          selectedMockProfile={selectedMockProfile}
          onRefreshCatalog={refreshCatalog}
          onRescan={(profileId) => runScan(profileId ?? selectedMockProfile)}
          onMockProfileChange={setSelectedMockProfile}
          onCopyInstallCommand={handleCopyInstallCommand}
        />
        {toast ? <div className="toast" role="status">{toast}</div> : null}
      </>
    );
  }

  return (
    <>
      <WelcomeScreen
        selectedMockProfile={selectedMockProfile}
        onMockProfileChange={setSelectedMockProfile}
        onScan={() => runScan()}
      />
      {error ? <div className="toast error-toast" role="alert">{error}</div> : null}
      {models.length > 0 && import.meta.env.DEV ? (
        <div className="catalog-debug" aria-hidden="true">
          {models.length} seed models loaded across {mockProfileOptions.length - 1} mock machines
        </div>
      ) : null}
    </>
  );
}
