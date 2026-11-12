import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import type { Runtime } from "../lib/catalog/types";
import type { CompatibilityResult } from "../lib/compatibility/types";
import { formatDate, formatGb, humanRuntime, humanTask } from "../lib/utils/format";
import { CompatibilityReason } from "./CompatibilityReason";
import { FitBadge } from "./FitBadge";
import { TechnicalDetails } from "./TechnicalDetails";

type ModelCardProps = {
  result: CompatibilityResult;
  onCopyInstallCommand: (command?: string) => void;
};

function installCommandFor(result: CompatibilityResult): string | undefined {
  const preferred = result.recommendedRuntime;
  const commands = result.model.installCommands;

  const byRuntime: Partial<Record<Runtime, string | undefined>> = {
    ollama: commands.ollama,
    "llama.cpp": commands.llamaCpp,
    vllm: commands.vllm,
  };

  return (
    (preferred ? byRuntime[preferred] : undefined) ??
    commands.ollama ??
    commands.llamaCpp ??
    commands.vllm
  );
}

export function ModelCard({ result, onCopyInstallCommand }: ModelCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const command = useMemo(() => installCommandFor(result), [result]);

  async function handleCopy() {
    onCopyInstallCommand(command);
    if (command) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <article className="model-card">
      <div className="model-main">
        <div className="model-title-block">
          <div className="model-title-row">
            <h3>{result.model.name}</h3>
            <FitBadge fit={result.fit} score={result.score} />
          </div>
          <CompatibilityReason reasons={result.reasons} warnings={result.warnings} />
        </div>

        <div className="model-actions">
          <button className="secondary-button" type="button" onClick={handleCopy}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? "Copied" : "Copy install command"}
          </button>
          <button className="text-button" type="button" onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            {expanded ? "Hide details" : "Show details"}
          </button>
        </div>
      </div>

      <dl className="model-meta">
        <div>
          <dt>Task</dt>
          <dd>{humanTask(result.model.task)}</dd>
        </div>
        <div>
          <dt>Memory needed</dt>
          <dd>{formatGb(result.model.requirements.recommendedRamGb)}</dd>
        </div>
        <div>
          <dt>Download size</dt>
          <dd>{formatGb(result.model.requirements.diskGb)}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{result.model.runtimes.map(humanRuntime).join(", ")}</dd>
        </div>
        <div>
          <dt>License</dt>
          <dd>{result.model.license}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(result.model.lastUpdated)}</dd>
        </div>
      </dl>

      {expanded ? <TechnicalDetails result={result} /> : null}
    </article>
  );
}
