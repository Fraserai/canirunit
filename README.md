# CanIRunAI

CanIRunAI is a polished local-first desktop MVP that scans a machine and ranks real open-source/local AI model variants by hardware fit.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Browser preview uses a safe mock/fallback scanner unless the app is running inside Tauri.

## Catalog checks

The bundled model catalog lives in `src/data/models.json`. After editing it, run:

```bash
npm run validate:catalog
```

This dependency-free check validates model IDs, enum values, requirement numbers, install command coverage, and task counts.

## Desktop shell

The Tauri command architecture is included under `src-tauri/`. This machine currently needs Rust installed before the desktop shell can compile:

```bash
npm run tauri dev
```

The scanner only uses safe read-only local system commands. It does not scan the network, read personal files, request admin permissions, collect telemetry, or install models.
