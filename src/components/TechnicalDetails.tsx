import type { CompatibilityResult } from "../lib/compatibility/types";
import { formatGb, humanRuntime } from "../lib/utils/format";

type TechnicalDetailsProps = {
  result: CompatibilityResult;
};

export function TechnicalDetails({ result }: TechnicalDetailsProps) {
  const { model } = result;
  const rows = [
    ["Model ID", model.id],
    ["Parameter count", model.parameterBillion ? `${model.parameterBillion}B` : "Unknown"],
    ["Format", model.format],
    ["Quantization", model.quantization ?? "Unknown"],
    ["Minimum RAM", formatGb(model.requirements.minRamGb)],
    ["Recommended RAM", formatGb(model.requirements.recommendedRamGb)],
    ["Minimum VRAM", formatGb(model.requirements.minVramGb)],
    ["Recommended VRAM", formatGb(model.requirements.recommendedVramGb)],
    ["Runtime compatibility", model.runtimes.map(humanRuntime).join(", ")],
    ["Recommended runtime", humanRuntime(result.recommendedRuntime)],
  ];

  return (
    <div className="technical-details">
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="technical-section">
        <h4>Reasoning behind fit</h4>
        <ul>
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </div>

      <div className="technical-section">
        <h4>Source</h4>
        {model.sourceUrl ? (
          <a href={model.sourceUrl} target="_blank" rel="noreferrer">
            {model.sourceUrl}
          </a>
        ) : (
          <p>No source URL in this catalog entry yet.</p>
        )}
      </div>
    </div>
  );
}
