/**
 * Tool `get_layer_metadata`: liefert Layer-Metadaten + Methodik-Eintrag.
 *
 * Delegiert an `getLayerMetadata` + `getLayerMethodology` aus `$lib/data`.
 * `license_url` wird via lokales License-Mapping aufgelöst (bis Story 2.2
 * einen zentralen Helper publiziert).
 *
 * Nicht-existenter Slug: handler returnt `{ error: 'layer_not_found', slug, hint }`
 * statt zu werfen. LLMs raten oft semantische Slugs („social-status") die
 * keinem Manifest-Slug entsprechen (echter Slug: `mss-gesamtindex-2025`).
 */

import * as v from 'valibot';
import {
	LayerMetadataInputSchema,
	LAYER_METADATA_INPUT_JSON_SCHEMA,
	LAYER_METADATA_OUTPUT_JSON_SCHEMA
} from '../internal/schemas.js';
import type { WebMcpToolDefinition } from '../internal/tool-types.js';
import type { JsonObject } from '../internal/json-types.js';
import { licenseToUrl } from '../internal/license-url.js';
import type { LayerMetadata, Locale } from '$lib/data';
import type { LayerMethodology } from '$lib/data/layer-methodology.js';

export interface GetLayerMetadataDeps {
	readonly getLayerMetadata: (slug: string) => LayerMetadata;
	readonly getLayerMethodology: (slug: string) => LayerMethodology | null;
	/** Ensures manifest is loaded (lazy). Tool-Boundary darf nicht UI-state requiren. */
	readonly loadManifest: () => Promise<unknown>;
	readonly defaultLocale: () => Locale;
}

function serializeMethodology(m: LayerMethodology | null): JsonObject | null {
	if (!m) return null;
	const out: JsonObject = {
		summary: m.calculation ?? '',
		aggregation_level: m.aggregationLevel ?? 'unknown',
		source_layers: m.relatedLayers ?? []
	};
	if (m.authority) out.authority = m.authority;
	if (m.updateFrequency) out.update_frequency = m.updateFrequency;
	if (m.coverageGaps && m.coverageGaps.length > 0) out.coverage_gaps = m.coverageGaps;
	if (m.omissions && m.omissions.length > 0) out.omissions = m.omissions;
	return out;
}

function serializeLayer(meta: LayerMetadata, methodology: JsonObject | null): JsonObject {
	return {
		slug: meta.slug,
		bundle: meta.bundleGroup,
		geometry_type: meta.geometryType,
		feature_count: meta.featureCount,
		source_url: meta.sourceUrl,
		updated_at: meta.sourceUpdatedAt ?? meta.fetchedAt,
		license: meta.license,
		license_url: licenseToUrl(meta.license),
		methodology
	};
}

function isUnknownLayerError(err: unknown): boolean {
	if (err instanceof Error) return err.message.startsWith('Unknown layer:');
	return false;
}

export function createGetLayerMetadataTool(
	deps: GetLayerMetadataDeps
): WebMcpToolDefinition {
	return {
		name: 'get_layer_metadata',
		description:
			'Return rich metadata for a single data layer by slug: source URL, license, license URL, geometry type, feature count, last update, and methodology summary. The slug must match a manifest layer-slug exactly (e.g. mss-gesamtindex-2025, laerm-2023, klima-pet-2022) — semantic guesses like "social-status" or "noise" will fail. Use list_layers_at_point or cross_layer_query to discover valid slugs from a location first. On unknown slug, returns { error: "layer_not_found", slug, hint } instead of throwing.',
		inputSchema: LAYER_METADATA_INPUT_JSON_SCHEMA,
		outputSchema: LAYER_METADATA_OUTPUT_JSON_SCHEMA,
		handler: async (raw) => {
			const input = v.parse(LayerMetadataInputSchema, raw);
			// Side-effect: gewährleistet, dass das Manifest in den Modul-Cache geladen ist,
			// bevor `getLayerMetadata` darauf zugreift.
			await deps.loadManifest();
			// Locale wird derzeit nicht für Methodology-Translation genutzt (DE-only,
			// Phase-1-Lock per Memory `project_i18n_phase_1_de_only`). Der Param bleibt
			// für zukünftige EN-Coverage erhalten.
			void (input.locale ?? deps.defaultLocale());
			try {
				const meta = deps.getLayerMetadata(input.slug);
				const methodology = serializeMethodology(deps.getLayerMethodology(input.slug));
				return serializeLayer(meta, methodology);
			} catch (err) {
				if (isUnknownLayerError(err)) {
					return {
						error: 'layer_not_found',
						slug: input.slug,
						hint: 'The slug must match a manifest layer-slug exactly. Use list_layers_at_point(lat, lng) to discover valid layer-slugs for a location. Semantic guesses like "social-status", "noise", or "rent" will not match — try mss-gesamtindex-2025, laerm-2023, bodenrichtwerte instead.'
					};
				}
				throw err;
			}
		}
	};
}
