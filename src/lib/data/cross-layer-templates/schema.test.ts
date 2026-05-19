import { describe, it, expect } from 'vitest';
import * as v from 'valibot';
import { TemplateSchema, TemplateFileSchema } from './schema.js';

describe('cross-layer-template schema', () => {
	it('akzeptiert valides Template', () => {
		const ok = v.safeParse(TemplateSchema, {
			id: 'wahl-test',
			applicableTo: ['kiez'],
			requires: ['wahl_aggregat_kiez.top_partei'],
			body_de: 'Test-Body mit ausreichend Zeichen drin.'
		});
		expect(ok.success).toBe(true);
	});

	it('lehnt id mit Großbuchstaben ab', () => {
		const r = v.safeParse(TemplateSchema, {
			id: 'WahlTest',
			applicableTo: ['kiez'],
			requires: ['x'],
			body_de: 'Test-Body mit ausreichend Zeichen.'
		});
		expect(r.success).toBe(false);
	});

	it('lehnt zu kurzen body_de ab', () => {
		const r = v.safeParse(TemplateSchema, {
			id: 'wahl-test',
			applicableTo: ['kiez'],
			requires: ['x'],
			body_de: 'kurz'
		});
		expect(r.success).toBe(false);
	});

	it('lehnt leere requires ab', () => {
		const r = v.safeParse(TemplateSchema, {
			id: 'wahl-test',
			applicableTo: ['kiez'],
			requires: [],
			body_de: 'Test-Body mit ausreichend Zeichen.'
		});
		expect(r.success).toBe(false);
	});

	it('lehnt unbekannten applicableTo-Scope ab', () => {
		const r = v.safeParse(TemplateSchema, {
			id: 'wahl-test',
			applicableTo: ['layer'],
			requires: ['x'],
			body_de: 'Test-Body mit ausreichend Zeichen.'
		});
		expect(r.success).toBe(false);
	});

	it('TemplateFile braucht bundle + locale + templates[]', () => {
		const ok = v.safeParse(TemplateFileSchema, {
			bundle: 'wahl',
			locale: 'de',
			templates: [
				{
					id: 'wahl-test',
					applicableTo: ['kiez'],
					requires: ['x'],
					body_de: 'Test-Body mit ausreichend Zeichen.'
				}
			]
		});
		expect(ok.success).toBe(true);
	});

	it('TemplateFile lehnt falsche locale ab', () => {
		const r = v.safeParse(TemplateFileSchema, {
			bundle: 'wahl',
			locale: 'en',
			templates: [
				{
					id: 'x',
					applicableTo: ['kiez'],
					requires: ['y'],
					body_de: 'Lang genug für Min-Length-Check.'
				}
			]
		});
		expect(r.success).toBe(false);
	});
});
