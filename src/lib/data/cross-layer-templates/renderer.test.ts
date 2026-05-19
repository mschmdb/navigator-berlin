import { describe, it, expect } from 'vitest';
import { renderTemplate, canRender } from './renderer.js';
import type { Template } from './schema.js';

const T: Template = {
	id: 'wahl-test',
	applicableTo: ['kiez'],
	requires: ['x', 'y'],
	body_de: 'Im Kiez {kiez_name} kam {top_partei_label} auf {top_anteil_pct}.'
};

describe('renderTemplate', () => {
	it('substituiert alle Variablen', () => {
		const out = renderTemplate(T, {
			kiez_name: 'Friedrichshain',
			top_partei_label: 'GRÜNE',
			top_anteil_pct: '28,4 %'
		});
		expect(out.body).toBe('Im Kiez Friedrichshain kam GRÜNE auf 28,4 %.');
		expect(out.missingVars).toEqual([]);
	});

	it('listet missingVars bei fehlender Variable', () => {
		const out = renderTemplate(T, { kiez_name: 'Friedrichshain' });
		expect(out.missingVars).toEqual(['top_partei_label', 'top_anteil_pct']);
		expect(out.body).toContain('{top_partei_label}');
	});

	it('trimmt mehrfach-Whitespace zu Single-Space', () => {
		const t2: Template = {
			...T,
			body_de: 'Foo   {x}\n\nBar    {y}.'
		};
		const out = renderTemplate(t2, { x: 'A', y: 'B' });
		expect(out.body).toBe('Foo A Bar B.');
	});

	it('passt mit Number-Werten', () => {
		const out = renderTemplate(T, {
			kiez_name: 'Mitte',
			top_partei_label: 'SPD',
			top_anteil_pct: 23
		});
		expect(out.body).toBe('Im Kiez Mitte kam SPD auf 23.');
	});

	it('skipt bei null', () => {
		const out = renderTemplate(T, {
			kiez_name: 'Mitte',
			top_partei_label: null,
			top_anteil_pct: '20 %'
		});
		expect(out.missingVars).toContain('top_partei_label');
	});
});

describe('canRender', () => {
	it('true wenn alle Placeholders gefüllt', () => {
		expect(
			canRender(T, {
				kiez_name: 'A',
				top_partei_label: 'B',
				top_anteil_pct: 'C'
			})
		).toBe(true);
	});

	it('false bei fehlendem Wert', () => {
		expect(canRender(T, { kiez_name: 'A' })).toBe(false);
	});

	it('false bei leerem String', () => {
		expect(
			canRender(T, {
				kiez_name: '',
				top_partei_label: 'B',
				top_anteil_pct: 'C'
			})
		).toBe(false);
	});
});
