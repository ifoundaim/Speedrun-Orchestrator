## Structured Tool Results – Design Notes

This document captures ideas for making our tool commands return **more structured and sophisticated results**. It is meant as a long-term reference when evolving tools, schemas, and UIs.

---

## 1. Stronger Structure & Schemas

- **Versioned result envelopes**  
  - Standard top-level shape for every tool: `version`, `status`, `data`, `meta`, `errors`.
  - Use explicit versioning so tools can evolve without breaking orchestrations.

- **Typed domain entities**  
  - Prefer well-defined types (e.g., `Run`, `Job`, `Step`, `Artifact`, `Metric`, `Alert`) over ad‑hoc objects.
  - Tools should always return arrays/maps of these types to make composition predictable.

- **Explicit relationships in payloads**  
  - Include IDs and references: `job_id`, `parent_run_id`, `dependency_ids`, `related_artifact_ids`.
  - Make it easy to reconstruct graphs, timelines, and dependency trees.

- **Multiple data “views” per response**  
  - `data.raw`: low-level records.  
  - `data.summary`: aggregated / human-friendly view.  
  - `data.index`: IDs and keys optimized for navigation.

---

## 2. Rich Metadata, Diagnostics & Observability

- **Execution metadata**  
  - `meta.execution`: timing, retries, cache hits, resource usage, tool version, host, etc.
  - `meta.input_fingerprint`: hash of inputs for reproducibility and caching.

- **Confidence & completeness indicators**  
  - `meta.confidence`: low/medium/high, with reasons.  
  - `meta.coverage`: what portion of the universe was inspected (e.g., “last 100 runs”, “prod only”).

- **Diagnostic channels**  
  - Separate user-facing data from diagnostics: `logs`, `warnings`, `debug_info`.
  - Avoid mixing operational noise into primary `data`.

- **Structured error model**  
  - `errors: [{ code, message, severity, retriable, context }]`.
  - Enables orchestration logic like “retry only if `retriable === true`”.

---

## 3. Organization & Navigation of Results

- **Hierarchical / grouped outputs**  
  - Group by status, environment, failure mode, etc., instead of flat lists.  
  - Example: `data.by_status = { succeeded: [...], failed: [...], pending: [...] }`.

- **Paging & windows**  
  - `paging: { cursor, has_next, total_estimate }` for large collections.
  - Explicit time windows: `window: { start, end, inclusive }`.

- **Query echo & suggested filters**  
  - Echo effective filters/sort order in `meta.query`.
  - Provide `meta.suggested_filters` (e.g., “only flaky tests”, “only critical failures”).

- **Diff-friendly outputs**  
  - For comparisons (configs, metrics, code), return `before`, `after`, and structured `diff`.
  - Diff should identify added/removed/changed fields, not just text.

---

## 4. Cross-Tool Composability & Workflows

- **Stable IDs & entity references across tools**  
  - Use IDs or URIs (`entity_ref`, `entity_uri` like `run://project/x/run/123`) that are accepted by other tools.
  - Make output of one tool a first-class input to others.

- **Declarative “next actions”**  
  - `next_actions: [{ action_id, label, tool, args_template }]`.
  - Lets UIs or agents render buttons like “Re-run failed step”, “Open logs”, “File ticket”.

- **Partial results & continuations**  
  - Support `status: "partial"` with `continuation_token` for large/long-running operations.
  - Enables streaming and incremental refinement without losing structure.

- **Semantic tags for routing**  
  - Tag entities and errors: `tags: ["flaky", "critical", "infra", "performance"]`.
  - Helps orchestrator decide notifications, escalations, and follow-up tools.

---

## 5. Human-Friendly UX & Explainability

- **Dual-format responses**  
  - Machine-oriented: `data` (structured).  
  - Human-oriented: `explanation` (succinct narrative summary).

- **Root-cause & impact hints**  
  - `analysis`: suspected causes, impacted components, suggested owners.
  - Even heuristic hints are useful if coupled with `meta.confidence`.

- **Recommendations over raw data**  
  - `recommendations: [{ type, priority, description, suggested_tool, arguments }]`.
  - Steer users from “What am I looking at?” to “What should I do next?”.

- **Timelines & story-like views**  
  - Represent multi-step runs as ordered events with timestamps, statuses, transitions.
  - Improves debuggability compared to static snapshots.

---

## 6. Orchestrator-Specific Patterns

- **Graph-shaped workflow results**  
  - Model runs as DAGs: `nodes` (steps with state) and `edges` (dependencies).
  - Enables visualizations and smart retries (only recomputing affected dependents).

- **State machine semantics**  
  - Explicit, well-defined states and transitions (`queued → running → succeeded/failed/cancelled`).
  - Encoded in the schema so tools know what operations are legal.

- **Tool “contracts”**  
  - `contract: { inputs_schema_ref, outputs_schema_ref, limitations, assumptions }`.
  - Makes capabilities and constraints visible to both humans and agents.

- **Scenario-aware profiles**  
  - Inputs like `profile: "debug" | "summary" | "performance"` to switch structured variants.
  - Avoids ad-hoc flags that change shapes unpredictably.

---

## 7. Flags, Formats & Schema Hygiene

- **Standard `format` and `detail` options**  
  - `--format=json|yaml|table`, `--detail=summary|normal|verbose`.
  - Same underlying structure, different density for different consumers.

- **Stable naming & deprecation**  
  - Avoid breaking renames; mark deprecated fields in `meta.deprecations` with suggested replacements.
  - Keep a changelog for schema versions.

- **Schema registry & validation**  
  - Validate tool outputs against shared JSON Schemas or equivalent.
  - Catch drift early and keep outputs reliably structured and composable.

---

## How to Use This Document

- **Designing new tools**: start from the standard envelope (`version`, `status`, `data`, `meta`, `errors`) and choose which sections from above apply.
- **Evolving existing tools**: introduce versioned schemas, add metadata fields, and move toward typed entities and cross-tool IDs.
- **UI & agent integration**: rely on `meta`, `analysis`, `next_actions`, and `recommendations` to drive rich UIs and automated workflows.


