import { describe, it, expect } from 'vitest';
import { explainLayerPrompt } from './explain-layer.js';

describe('explain-layer prompt', () => {
	it('hat snake_case-name', () => {
		expect(explainLayerPrompt.name).toBe('explain_layer');
	});

	it('rendert DE mit Layer-Slug', () => {
		const out = explainLayerPrompt.render({ slug: 'laerm-2023' }, 'de');
		expect(out).toContain('laerm-2023');
		expect(out).toMatch(/get_layer_metadata/);
		expect(out).not.toContain('—');
	});

	it('rendert EN mit Layer-Slug', () => {
		const out = explainLayerPrompt.render({ slug: 'laerm-2023' }, 'en');
		expect(out).toContain('laerm-2023');
		expect(out).toMatch(/get_layer_metadata/);
	});
});
