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

describe('renderTemplate mit Locale', () => {
	const bilingual: Template = {
		...T,
		body_en: 'In the Kiez {kiez_name}, {top_partei_label} reached {top_anteil_pct}.'
	};
	const ctx = { kiez_name: 'Friedrichshain', top_partei_label: 'GRÜNE', top_anteil_pct: '28.4%' };

	it('nutzt body_de ohne Locale-Angabe (DE-Default)', () => {
		expect(renderTemplate(bilingual, ctx).body).toBe('Im Kiez Friedrichshain kam GRÜNE auf 28.4%.');
	});

	it('nutzt body_de bei locale de', () => {
		expect(renderTemplate(bilingual, ctx, { locale: 'de' }).body).toBe(
			'Im Kiez Friedrichshain kam GRÜNE auf 28.4%.'
		);
	});

	it('nutzt body_en bei locale en', () => {
		expect(renderTemplate(bilingual, ctx, { locale: 'en' }).body).toBe(
			'In the Kiez Friedrichshain, GRÜNE reached 28.4%.'
		);
	});

	it('fällt bei locale en ohne body_en auf body_de zurück', () => {
		expect(renderTemplate(T, ctx, { locale: 'en' }).body).toBe(
			'Im Kiez Friedrichshain kam GRÜNE auf 28.4%.'
		);
	});

	it('meldet missingVars aus dem body der gewählten Locale', () => {
		const out = renderTemplate(
			{ ...bilingual, body_en: 'Only {other_var} here, long enough text.' },
			ctx,
			{ locale: 'en' }
		);
		expect(out.missingVars).toEqual(['other_var']);
	});
});

describe('canRender mit Locale', () => {
	const t: Template = {
		...T,
		body_de: 'Im Kiez {kiez_name} kam {partei} auf {anteil}.',
		body_en: 'In the Kiez {kiez_name}, {party} reached {share}.'
	};

	it('prüft die Platzhalter der gewählten Locale', () => {
		const ctxEn = { kiez_name: 'A', party: 'B', share: 'C' };
		expect(canRender(t, ctxEn, { locale: 'en' })).toBe(true);
		expect(canRender(t, ctxEn, { locale: 'de' })).toBe(false);
		expect(canRender(t, ctxEn)).toBe(false);
	});
});
