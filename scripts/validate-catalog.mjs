import { readFileSync } from "node:fs";

const catalogUrl = new URL("../src/data/models.json", import.meta.url);
const models = JSON.parse(readFileSync(catalogUrl, "utf8"));

const tasks = new Set(["chat", "coding", "vision", "embedding", "image", "audio"]);
const formats = new Set(["gguf", "ollama", "safetensors", "mlx", "onnx", "other"]);
const sources = new Set(["seed", "huggingface", "ollama", "manual"]);
const runtimes = new Set(["ollama", "llama.cpp", "vllm", "mlx", "onnx", "diffusers", "transformers"]);
const accelerators = new Set(["cpu", "metal", "cuda", "rocm", "vulkan", "directml", "openvino", "unknown"]);

const requiredModelFields = [
  "id",
  "name",
  "family",
  "task",
  "format",
  "license",
  "source",
  "lastUpdated",
  "requirements",
  "runtimes",
  "installCommands",
  "qualityHints",
];

const requiredRequirements = ["minRamGb", "recommendedRamGb", "diskGb"];
const requiredHints = ["speed", "quality", "easeOfUse"];
const ids = new Set();
const problems = [];

function problem(model, message) {
  problems.push(`${model.id ?? model.name ?? "unknown model"}: ${message}`);
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function checkEnum(model, key, validValues) {
  if (!validValues.has(model[key])) {
    problem(model, `invalid ${key} "${model[key]}"`);
  }
}

function checkAccelerators(model, key) {
  for (const accelerator of model.requirements?.[key] ?? []) {
    if (!accelerators.has(accelerator)) {
      problem(model, `invalid accelerator "${accelerator}" in ${key}`);
    }
  }
}

if (!Array.isArray(models)) {
  throw new Error("Catalog root must be an array.");
}

for (const model of models) {
  for (const field of requiredModelFields) {
    if (!(field in model)) {
      problem(model, `missing ${field}`);
    }
  }

  if (ids.has(model.id)) {
    problem(model, "duplicate id");
  }
  ids.add(model.id);

  checkEnum(model, "task", tasks);
  checkEnum(model, "format", formats);
  checkEnum(model, "source", sources);

  if (model.sourceUrl && !model.sourceUrl.startsWith("https://")) {
    problem(model, "sourceUrl must start with https://");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(model.lastUpdated ?? "")) {
    problem(model, "lastUpdated must be YYYY-MM-DD");
  }

  for (const runtime of model.runtimes ?? []) {
    if (!runtimes.has(runtime)) {
      problem(model, `invalid runtime "${runtime}"`);
    }
  }

  for (const field of requiredRequirements) {
    if (!isPositiveNumber(model.requirements?.[field])) {
      problem(model, `requirements.${field} must be a positive number`);
    }
  }

  if (model.requirements?.recommendedRamGb < model.requirements?.minRamGb) {
    problem(model, "recommended RAM is below minimum RAM");
  }

  if (
    model.requirements?.recommendedVramGb !== undefined &&
    model.requirements?.minVramGb !== undefined &&
    model.requirements.recommendedVramGb < model.requirements.minVramGb
  ) {
    problem(model, "recommended VRAM is below minimum VRAM");
  }

  checkAccelerators(model, "requiredAccelerators");
  checkAccelerators(model, "preferredAccelerators");

  for (const field of requiredHints) {
    const value = model.qualityHints?.[field];
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      problem(model, `qualityHints.${field} must be an integer from 1 to 5`);
    }
  }

  const hasInstallPath =
    Boolean(model.installCommands?.ollama) ||
    Boolean(model.installCommands?.llamaCpp) ||
    Boolean(model.installCommands?.vllm) ||
    Boolean(model.installCommands?.notes);

  if (!hasInstallPath) {
    problem(model, "missing install command or notes");
  }

  if (model.runtimes?.includes("ollama") && !model.installCommands?.ollama) {
    problem(model, "ollama runtime needs an ollama install command");
  }
}

if (problems.length > 0) {
  console.error(`Catalog validation failed with ${problems.length} issue(s):`);
  for (const item of problems) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

const counts = models.reduce((accumulator, model) => {
  accumulator[model.task] = (accumulator[model.task] ?? 0) + 1;
  return accumulator;
}, {});

const newest = models
  .map((model) => model.lastUpdated)
  .filter(Boolean)
  .sort()
  .at(-1);

console.log(`Catalog OK: ${models.length} models`);
console.log(`Newest update: ${newest}`);
console.log(
  Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([task, count]) => `${task}: ${count}`)
    .join(", "),
);
