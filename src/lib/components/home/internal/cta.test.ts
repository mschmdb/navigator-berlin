import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ctaPrimary, ctaSecondary } from './cta';

const HOME_DIR = join(process.cwd(), 'src/lib/components/home');

describe('Startseiten-Aktionen', () => {
	it('geben Primär- und Sekundäraktion dieselbe Mindesthöhe', () => {
		expect(ctaPrimary).toContain('min-h-(--target-min)');
		expect(ctaSecondary).toContain('min-h-(--target-min)');
	});

	it('zeigen die Sekundäraktion als Button mit sichtbarem Rahmen, ab sm ohne Umbruch', () => {
		expect(ctaSecondary).toContain('border-rule-strong');
		expect(ctaSecondary).toContain('rounded');
		expect(ctaSecondary).toContain('sm:whitespace-nowrap');
	});

	it('lassen lange Texte bei 320 px umbrechen statt die Seite zu verbreitern (WCAG 1.4.10)', () => {
		for (const cta of [ctaPrimary, ctaSecondary]) {
			expect(cta).toContain('max-w-full');
			expect(cta.split(' ')).not.toContain('whitespace-nowrap');
		}
	});

	it('setzt auf der Startseite keine Pfeil-Icons an Links (Leitlinie 29)', () => {
		const files = readdirSync(HOME_DIR).filter((f) => f.endsWith('.svelte'));
		const withArrow = files.filter((f) =>
			/Arrow(UpRight|Right)/.test(readFileSync(join(HOME_DIR, f), 'utf8'))
		);
		expect(withArrow).toEqual([]);
	});

	it('nutzt auf der Startseite keine reinen Akzent-Textlinks als Aktion', () => {
		const files = readdirSync(HOME_DIR).filter((f) => f.endsWith('.svelte'));
		const weak = files.filter((f) =>
			/class="[^"]*\btext-(xs|sm) text-accent hover:text-ink/.test(
				readFileSync(join(HOME_DIR, f), 'utf8')
			)
		);
		expect(weak).toEqual([]);
	});
});
