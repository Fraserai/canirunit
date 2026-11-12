import type { ModelVariant, Runtime } from "../catalog/types";
import type { MachineProfile } from "../scanner/types";

function hasRuntime(machine: MachineProfile, runtime: Runtime): boolean {
  if (runtime === "ollama") return machine.installedRuntimes.ollama;
  if (runtime === "llama.cpp") return machine.installedRuntimes.llamaCpp;
  if (runtime === "diffusers" || runtime === "transformers" || runtime === "vllm") {
    return machine.installedRuntimes.python;
  }
  if (runtime === "mlx") return machine.os === "macos" && machine.arch === "arm64";
  if (runtime === "onnx") return true;
  return false;
}

export function getPracticalRuntimes(model: ModelVariant, machine: MachineProfile): Runtime[] {
  return model.runtimes.filter((runtime) => hasRuntime(machine, runtime));
}

export function recommendRuntime(model: ModelVariant, machine: MachineProfile): Runtime | undefined {
  const practical = getPracticalRuntimes(model, machine);

  if (practical.length === 0) {
    return undefined;
  }

  if (model.task === "image" && practical.includes("diffusers")) {
    return "diffusers";
  }

  if (model.task === "embedding") {
    if (practical.includes("ollama")) return "ollama";
    if (practical.includes("onnx")) return "onnx";
    if (practical.includes("transformers")) return "transformers";
  }

  if (machine.os === "macos" && machine.arch === "arm64") {
    if (model.format === "mlx" && practical.includes("mlx")) return "mlx";
    if (practical.includes("ollama")) return "ollama";
    if (practical.includes("llama.cpp")) return "llama.cpp";
    if (practical.includes("transformers")) return "transformers";
  }

  if (machine.accelerators.includes("cuda")) {
    if (model.parameterBillion && model.parameterBillion >= 30 && practical.includes("vllm")) {
      return "vllm";
    }
    if (practical.includes("ollama")) return "ollama";
    if (practical.includes("llama.cpp")) return "llama.cpp";
    if (practical.includes("vllm")) return "vllm";
  }

  if (practical.includes("ollama")) return "ollama";
  if (practical.includes("llama.cpp")) return "llama.cpp";
  return practical[0];
}
