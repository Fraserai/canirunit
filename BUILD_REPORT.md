# CanIRunAI Build Report

## Project Summary

CanIRunAI is a polished MVP desktop app concept built with Tauri, React, TypeScript, and Rust command scaffolding.

The core product promise is:

> Scan your machine. Instantly see which open-source AI models your hardware can run.

The MVP focuses on the main product output: a real compatibility-ranked list of local/open-source AI model variants.

## What Was Built

The project was created at:

```bash
/Users/caeseyfraser/Desktop/CanIRunAI
```

The app includes:

- Welcome screen with product name, tagline, scan button, and privacy note
- Calm scanning screen with staged progress messages
- Results screen with machine summary, compatibility headline, best match, tabs, filters, and model list
- Actual model compatibility cards with fit labels, install command copy action, and hidden technical details
- Local JSON model catalog with 50 model variants
- Deterministic compatibility engine
- Mock machine selector for development/testing
- Tauri Rust command scaffold for local hardware scanning
- Catalog provider architecture for future live sync

## Key Product Screens

### 1. Welcome

Shows:

- CanIRunAI
- “See which open-source AI models your machine can run.”
- “We scan your hardware locally and match it against a live model catalog.”
- “Scan My Machine” button
- Privacy-first hardware scan note

### 2. Scanning

Shows calm progress states:

- Checking your hardware
- Detecting memory
- Detecting graphics
- Matching open-source models

### 3. Results

Shows:

- Machine summary
- Compatibility headline
- Best Match card
- Model compatibility list
- Tabs for Best Matches, All Compatible, Stretch, and Too Heavy
- Search, filters, sorting, catalog refresh, and mock profile switching

## Model Catalog

The local seed catalog is stored at:

```bash
src/data/models.json
```

It contains 50 runnable model variants across:

- Chat: 20
- Coding: 8
- Embeddings: 6
- Vision: 5
- Image: 5
- Audio: 6

Representative model families include:

- Llama
- Qwen
- Mistral
- DeepSeek
- Phi
- Gemma
- TinyLlama
- Nomic Embed
- BGE
- Whisper
- Stable Diffusion
- FLUX

The catalog includes models across all fit categories: Perfect, Good, Stretch, and Not recommended.

## Compatibility Engine

The compatibility engine is implemented in:

```bash
src/lib/compatibility/
```

It evaluates every model against a normalized `MachineProfile` and returns:

- Fit level
- Score from 0 to 100
- Plain-English reasons
- Warnings
- Recommended runtime

Scoring considers:

- Memory fit
- GPU/accelerator fit
- Runtime availability
- Disk space
- Ease of use
- Metadata confidence

## Hardware Scanner

The TypeScript scanner abstraction is implemented in:

```bash
src/lib/scanner/
```

The Rust/Tauri scanner scaffold is implemented in:

```bash
src-tauri/src/scanner.rs
```

The scanner is local-first and designed to detect:

- OS and OS version
- Architecture
- CPU name and core/thread count
- Total and available memory
- GPU name, vendor, and VRAM where available
- Free disk space
- Accelerator hints such as Metal, CUDA, ROCm, Vulkan, DirectML, and CPU
- Installed runtimes such as Ollama, llama.cpp, Python, and Docker

The scanner does not:

- Request admin permissions
- Scan the network
- Read personal files
- Send hardware data to a server
- Install models automatically

## Mock Profiles

Mock profiles are included so the UI can be tested without complete platform detection.

Profiles include:

- MacBook Air M2, 16GB
- MacBook Pro M3 Max, 64GB
- Windows gaming PC with RTX 4070
- Windows laptop with integrated graphics
- Linux server with RTX 4090
- Old 8GB CPU-only laptop
- Raspberry Pi-style ARM device

## Catalog Architecture

Provider files are located at:

```bash
src/lib/catalog/
```

Implemented providers:

- `CatalogProvider`
- `SeedCatalogProvider`
- `HuggingFaceCatalogProvider`
- `OllamaCatalogProvider`

For the MVP, `SeedCatalogProvider` is fully functional. Hugging Face and Ollama providers are scaffolded for future live catalog sync.

The UI includes a “Refresh catalog” button. For now, it shows:

> Live catalog sync coming soon. Using curated local catalog.

## UI Components

The React component structure includes:

- `App`
- `WelcomeScreen`
- `ScanningScreen`
- `ResultsScreen`
- `MachineSummaryCard`
- `BestMatchCard`
- `ModelTabs`
- `ModelFilters`
- `ModelCard`
- `FitBadge`
- `CompatibilityReason`
- `TechnicalDetails`
- `EmptyState`
- `PrivacyNote`

The UI is intentionally simple and non-technical by default, with technical model details hidden behind “Show details.”

## Validation Performed

The following checks passed:

```bash
npm run typecheck
npm run lint
npm run build
```

Production build completed successfully with Vite.

No automated test script exists yet.

## Current Local Run Command

To run the browser-preview MVP:

```bash
cd /Users/caeseyfraser/Desktop/CanIRunAI
npm run dev
```

Then open:

```bash
http://127.0.0.1:1420/
```

## Desktop Run Command

Rust is not currently installed on this machine, so the Tauri desktop shell was scaffolded but not compiled.

After installing Rust, run:

```bash
cd /Users/caeseyfraser/Desktop/CanIRunAI
npm run tauri dev
```

## MVP Status

The MVP meets the main acceptance criteria:

- App launches in Vite preview
- User can click “Scan My Machine”
- Machine profile is shown
- Model catalog loads
- Compatibility is calculated for every model
- Actual model names are shown
- Models are grouped into Best Matches, All Compatible, Stretch, and Too Heavy
- Each model has a fit label and reason
- Search, filtering, and sorting are implemented
- Install commands can be copied when available
- Technical details are hidden by default
- Privacy-first behavior is reflected in the architecture and UI

## Known Limitations

- Tauri desktop build requires Rust to be installed
- Live Hugging Face and Ollama catalog sync is scaffolded but not implemented
- Hardware detection will be more accurate once the Tauri shell is compiled and running
- No automated unit tests have been added yet
- Model metadata is approximate but structured for future updates

## Recommended Next Steps

1. Install Rust and run the Tauri desktop shell.
2. Add unit tests for the compatibility engine.
3. Add visual smoke tests for the main user flow.
4. Improve live catalog ingestion for Hugging Face and Ollama.
5. Add richer platform-specific scanner parsing after real desktop testing.
