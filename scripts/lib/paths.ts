/**
 * Gemeinsame Pfade für Skripte. Prozessmaterial (BMAD-Specs, Planung,
 * Spikes) liegt unter `docs/process`. Der BMAD-Override steht in
 * `_bmad/custom/config.toml`.
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PROCESS_DIR = join(REPO_ROOT, 'docs', 'process');
export const IMPLEMENTATION_ARTIFACTS_DIR = join(PROCESS_DIR, 'implementation-artifacts');
export const PLANNING_ARTIFACTS_DIR = join(PROCESS_DIR, 'planning-artifacts');
export const SPIKE_ARTIFACTS_DIR = join(PROCESS_DIR, 'spike-artifacts');
