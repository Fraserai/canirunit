import type { ModelVariant } from "../catalog/types";
import type { MachineProfile } from "../scanner/types";
import type { CompatibilityResult, FitLevel } from "./types";
import { scoreModel, totalScore } from "./scoring";
import { getPracticalRuntimes, recommendRuntime } from "./runtimeRecommendation";

const FIT_LABEL_REASON: Record<FitLevel, string> = {
  perfect: "Runs smoothly on this machine.",
  good: "Should run well, but may use more memory.",
  stretch: "Can run, but expect slower responses.",
  not_recommended: "This model is probably too large for this machine.",
};

function bestVramGb(machine: MachineProfile): number | undefined {
  const values = machine.gpu
    .map((gpu) => gpu.vramGb)
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) return undefined;
  return Math.max(...values);
}

function classifyFit(machine: MachineProfile, model: ModelVariant, score: number, warnings: string[]): FitLevel {
  const ram = machine.memory.totalGb;
  const disk = machine.disk.freeGb;
  const bestVram = bestVramGb(machine);
  const minRam = model.requirements.minRamGb;
  const recommendedRam = model.requirements.recommendedRamGb;
  const minVram = model.requirements.minVramGb;
  const recommendedVram = model.requirements.recommendedVramGb;
  const practicalRuntimes = getPracticalRuntimes(model, machine);

  if (ram < minRam || (disk !== undefined && disk < model.requirements.diskGb) || practicalRuntimes.length === 0) {
    return "not_recommended";
  }

  if (
    minVram !== undefined &&
    bestVram !== undefined &&
    bestVram < minVram &&
    model.requirements.requiredAccelerators?.some((accelerator) => accelerator !== "cpu")
  ) {
    return "not_recommended";
  }

  if (score >= 86 && warnings.length === 0 && ram >= recommendedRam * 1.15) {
    if (recommendedVram === undefined || bestVram === undefined || bestVram >= recommendedVram) {
      return "perfect";
    }
  }

  if (score >= 70 && ram >= minRam * 1.15) {
    return "good";
  }

  if (score >= 45) {
    return "stretch";
  }

  return "not_recommended";
}

function buildReasons(machine: MachineProfile, model: ModelVariant, fit: FitLevel): string[] {
  const reasons = [FIT_LABEL_REASON[fit]];
  const bestVram = bestVramGb(machine);

  if (machine.memory.totalGb >= model.requirements.recommendedRamGb) {
    reasons.push(`Your ${Math.round(machine.memory.totalGb)}GB memory meets the recommended memory for this model.`);
  } else if (machine.memory.totalGb >= model.requirements.minRamGb) {
    reasons.push("Your machine meets the minimum memory, but it may need other apps closed.");
  } else {
    reasons.push("Needs more memory than this machine appears to have.");
  }

  if (model.requirements.recommendedVramGb !== undefined) {
    if (bestVram === undefined && machine.accelerators.includes("metal")) {
      reasons.push("Apple Metal is available; unified memory will be used for acceleration.");
    } else if (bestVram !== undefined && bestVram >= model.requirements.recommendedVramGb) {
      reasons.push("Your graphics memory is comfortably above the recommended level.");
    } else if (bestVram !== undefined && bestVram >= (model.requirements.minVramGb ?? 0)) {
      reasons.push("Graphics memory meets the minimum, but the model may feel slower.");
    } else {
      reasons.push("Best with more GPU memory than detected on this machine.");
    }
  }

  if (machine.disk.freeGb === undefined) {
    reasons.push("Disk space was not detected, so storage was not used strongly in the ranking.");
  } else if (machine.disk.freeGb >= model.requirements.diskGb) {
    reasons.push(`There is enough free disk space for the estimated ${model.requirements.diskGb}GB download.`);
  }

  return reasons;
}

function buildWarnings(machine: MachineProfile, model: ModelVariant): string[] {
  const warnings: string[] = [];
  const bestVram = bestVramGb(machine);

  if (machine.memory.totalGb < model.requirements.recommendedRamGb) {
    warnings.push("May need lower settings or fewer apps open.");
  }

  if (model.requirements.recommendedVramGb !== undefined && bestVram === undefined) {
    warnings.push("GPU memory was not detected; ranking relies on RAM and accelerator hints.");
  }

  if (machine.disk.freeGb !== undefined && machine.disk.freeGb < model.requirements.diskGb) {
    warnings.push("Not enough free disk space for this model.");
  }

  if (getPracticalRuntimes(model, machine).length === 0) {
    warnings.push("No installed local runtime was detected for this model yet.");
  }

  return warnings;
}

export function evaluateModel(machine: MachineProfile, model: ModelVariant): CompatibilityResult {
  const warnings = buildWarnings(machine, model);
  const score = totalScore(scoreModel(machine, model));
  const fit = classifyFit(machine, model, score, warnings);

  return {
    model,
    fit,
    score,
    reasons: buildReasons(machine, model, fit),
    warnings,
    recommendedRuntime: recommendRuntime(model, machine),
  };
}

export function evaluateCatalog(machine: MachineProfile, models: ModelVariant[]): CompatibilityResult[] {
  return models
    .map((model) => evaluateModel(machine, model))
    .sort((a, b) => b.score - a.score || a.model.name.localeCompare(b.model.name));
}
