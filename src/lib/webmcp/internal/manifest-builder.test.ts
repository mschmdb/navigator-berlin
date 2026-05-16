import { describe, it, expect } from 'vitest';
import { buildWebMcpManifest } from './manifest-builder.js';
import { WEBMCP_SPEC_VERSION } from './spec-version.js';

describe('buildWebMcpManifest', () => {
	const manifest = buildWebMcpManifest();

	it('enthält die spec_version-Konstante', () => {
		expect(manifest.spec_version).toBe(WEBMCP_SPEC_VERSION);
	});

	it('hat name + description', () => {
		expect(manifest.name).toBe('navigator.berlin');
		expect(manifest.description).toMatch(/Berlin/);
	});

	it('exportiert genau 5 Tools', () => {
		expect(manifest.tools).toHaveLength(5);
	});

	it('alle Tool-Names sind snake_case + erwartete Liste', () => {
		const names = manifest.tools.map((t) => t.name).sort();
		expect(names).toEqual(
			[
				'address_lookup',
				'cross_layer_query',
				'get_kiez_profile',
				'get_layer_metadata',
				'list_layers_at_point'
			].sort()
		);
		for (const name of names) {
			expect(name).toMatch(/^[a-z][a-z0-9_]+$/);
		}
	});

	it('jedes Tool hat input_schema + output_schema', () => {
		for (const tool of manifest.tools) {
			expect(tool).toHaveProperty('input_schema');
			expect(tool).toHaveProperty('output_schema');
			expect(tool).toHaveProperty('description');
		}
	});

	it('exportiert mindestens 2 Resources', () => {
		expect(manifest.resources.length).toBeGreaterThanOrEqual(2);
	});

	it('Resource navigator://layers/active existiert', () => {
		const slugs = manifest.resources.map((r) => r.uri_template);
		expect(slugs).toContain('navigator://layers/active');
	});

	it('exportiert genau 3 Prompts', () => {
		expect(manifest.prompts).toHaveLength(3);
		const names = manifest.prompts.map((p) => p.name).sort();
		expect(names).toEqual(['address_overview', 'compare_kieze', 'explain_layer']);
	});

	it('Prompts haben arguments-Array', () => {
		for (const p of manifest.prompts) {
			expect(Array.isArray(p.arguments)).toBe(true);
		}
	});

	it('License-Hinweis im Manifest', () => {
		expect(manifest.license).toBeDefined();
		expect(manifest.attribution).toMatch(/navigator\.berlin/);
	});

	it('Keine em-dashes in description-Strings', () => {
		const text = JSON.stringify(manifest);
		expect(text).not.toContain('—');
	});

	it('Keine „lebenswert"-Vokabel im Manifest', () => {
		const text = JSON.stringify(manifest).toLowerCase();
		expect(text).not.toContain('lebenswert');
	});
});
