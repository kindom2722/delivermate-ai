## MetaGPT Local Setup Status

Date: 2026-05-05

### Installed runtime

- Python: `D:\Tools\Python311\python.exe`
- MetaGPT venv: `D:\Tools\venvs\DeliverMateMetaGPT\Scripts\python.exe`
- Vendored MetaGPT repo: `D:\CodexProjects\git\DeliverMate\vendor\MetaGPT`

### Project environment wiring

The project `.env` is configured to use the MetaGPT bridge:

- `AI_PROVIDER="metagpt"`
- `METAGPT_PYTHON_PATH="D:\Tools\venvs\DeliverMateMetaGPT\Scripts\python.exe"`
- `METAGPT_BRIDGE_SCRIPT="scripts/metagpt_bridge.py"`
- `METAGPT_BACKEND="metagpt"`
- `METAGPT_RUNNER_MODULE="metagpt_runner"`
- `METAGPT_REPO_PATH="vendor/MetaGPT"`
- DeepSeek credentials and model are pointed at the same local bridge flow.

### What was patched

Because the vendored MetaGPT package eagerly imports many optional providers and tools, several files were adjusted to support a minimal local DeepSeek-backed runtime without requiring the full upstream dependency set:

- `vendor/MetaGPT/metagpt/provider/__init__.py`
- `vendor/MetaGPT/metagpt/utils/token_counter.py`
- `vendor/MetaGPT/metagpt/utils/common.py`
- `vendor/MetaGPT/metagpt/repo_parser.py`
- `vendor/MetaGPT/metagpt/tools/__init__.py`
- `vendor/MetaGPT/metagpt/utils/report.py`
- `vendor/MetaGPT/metagpt/actions/__init__.py`
- `vendor/MetaGPT/metagpt/roles/__init__.py`
- `scripts/metagpt_bridge.py`

The bridge script was also updated to suppress intermediate MetaGPT stdout so the Node side can safely parse the final JSON response.

### Verified working

- Python import smoke test for `Action`, `Role`, `LLMConfig`, `Message`
- Real `analyze` request through `scripts/metagpt_bridge.py`
- Real `generate_document` request through `scripts/metagpt_bridge.py`
- Real Node integration via `src/lib/ai/metagpt-bridge.ts`
- Targeted Vitest suite:
  - `src/lib/ai/metagpt-bridge.test.ts`
  - `src/lib/ai/metagpt-provider.test.ts`

### Known caveats

- The vendored MetaGPT runtime is working for the DeliverMate bridge flow, but the full upstream optional toolchain is still not fully installed.
- Network instability prevented a clean full dependency sync from PyPI, so the current setup intentionally relies on minimal-import compatibility patches.
- MetaGPT logs warnings that `deepseek-v4-flash` is not in its built-in token cost table. This does not block execution.

