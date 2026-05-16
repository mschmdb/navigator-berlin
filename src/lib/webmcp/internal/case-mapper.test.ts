import { describe, it, expect } from 'vitest';
import { camelToSnake, snakeToCamel, mapKeysToSnake } from './case-mapper.js';

describe('case-mapper', () => {
	describe('camelToSnake', () => {
		it('konvertiert simple-camelCase zu snake_case', () => {
			expect(camelToSnake('updatedAt')).toBe('updated_at');
		});

		it('lässt single-Wörter unverändert', () => {
			expect(camelToSnake('layer')).toBe('layer');
		});

		it('handelt mehrfache Übergänge', () => {
			expect(camelToSnake('sourceUpdatedAt')).toBe('source_updated_at');
		});

		it('belässt bereits-snake_case unverändert', () => {
			expect(camelToSnake('already_snake')).toBe('already_snake');
		});
	});

	describe('snakeToCamel', () => {
		it('konvertiert snake_case zu camelCase', () => {
			expect(snakeToCamel('updated_at')).toBe('updatedAt');
		});

		it('lässt single-Wörter unverändert', () => {
			expect(snakeToCamel('layer')).toBe('layer');
		});
	});

	describe('mapKeysToSnake', () => {
		it('mappt flat-object', () => {
			const result = mapKeysToSnake({ updatedAt: '2025-01-01', layerName: 'foo' });
			expect(result).toEqual({ updated_at: '2025-01-01', layer_name: 'foo' });
		});

		it('lässt primitives unverändert', () => {
			expect(mapKeysToSnake('foo')).toBe('foo');
			expect(mapKeysToSnake(42)).toBe(42);
			expect(mapKeysToSnake(null)).toBe(null);
		});

		it('mappt nested-objects', () => {
			const result = mapKeysToSnake({
				layerName: 'a',
				meta: { sourceUpdatedAt: '2025-01-01', fetchedAt: '2025-01-02' }
			});
			expect(result).toEqual({
				layer_name: 'a',
				meta: { source_updated_at: '2025-01-01', fetched_at: '2025-01-02' }
			});
		});

		it('mappt arrays von objects', () => {
			const result = mapKeysToSnake([{ updatedAt: '2025-01-01' }, { updatedAt: '2025-01-02' }]);
			expect(result).toEqual([{ updated_at: '2025-01-01' }, { updated_at: '2025-01-02' }]);
		});

		it('respektiert Tiefenlimit (Default 8)', () => {
			// Stress-Test: deeply nested
			let nested: Record<string, unknown> = { leafValue: 1 };
			for (let i = 0; i < 5; i++) {
				nested = { wrapperLevel: nested };
			}
			const result = mapKeysToSnake(nested) as Record<string, unknown>;
			expect(result).toHaveProperty('wrapper_level');
		});
	});
});
