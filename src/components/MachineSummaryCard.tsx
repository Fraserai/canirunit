import { Cpu, HardDrive, MemoryStick, MonitorCog } from "lucide-react";
import type { MachineProfile } from "../lib/scanner/types";
import { formatGb } from "../lib/utils/format";

type MachineSummaryCardProps = {
  machine: MachineProfile;
};

function runtimeSummary(machine: MachineProfile): string {
  const active = Object.entries(machine.installedRuntimes)
    .filter(([, installed]) => installed)
    .map(([runtime]) => (runtime === "llamaCpp" ? "llama.cpp" : runtime));

  return active.length > 0 ? active.join(", ") : "No common local runtime detected";
}

export function MachineSummaryCard({ machine }: MachineSummaryCardProps) {
  const gpuSummary =
    machine.gpu.length > 0
      ? machine.gpu.map((gpu) => `${gpu.name}${gpu.vramGb ? `, ${formatGb(gpu.vramGb)}` : ""}`).join(", ")
      : "No GPU detected";

  return (
    <article className="summary-card machine-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Machine summary</p>
          <h2>{machine.cpu.name}</h2>
        </div>
        <span className="os-pill">
          {machine.os === "macos" ? "macOS" : machine.os} {machine.arch}
        </span>
      </div>

      <dl className="machine-grid">
        <div>
          <Cpu size={18} aria-hidden="true" />
          <dt>Processor</dt>
          <dd>
            {machine.cpu.cores ?? "?"} cores
            {machine.cpu.threads ? `, ${machine.cpu.threads} threads` : ""}
          </dd>
        </div>
        <div>
          <MemoryStick size={18} aria-hidden="true" />
          <dt>Memory</dt>
          <dd>
            {formatGb(machine.memory.totalGb)}
            {machine.memory.availableGb ? ` total, ${formatGb(machine.memory.availableGb)} available` : " total"}
          </dd>
        </div>
        <div>
          <MonitorCog size={18} aria-hidden="true" />
          <dt>Graphics</dt>
          <dd>{gpuSummary}</dd>
        </div>
        <div>
          <HardDrive size={18} aria-hidden="true" />
          <dt>Storage</dt>
          <dd>{formatGb(machine.disk.freeGb)} free</dd>
        </div>
      </dl>

      <div className="runtime-strip">
        <span>Best local paths</span>
        <strong>{runtimeSummary(machine)}</strong>
      </div>

      {machine.scanWarnings.length > 0 ? (
        <div className="warning-box">
          {machine.scanWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </article>
  );
}
