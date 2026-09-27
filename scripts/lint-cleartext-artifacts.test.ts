import { describe, expect, it } from 'vitest';
import {
	FORBIDDEN_PATTERNS,
	buildSvelteScannableText,
	extractStringLiterals,
	runCleartextArtifactLint,
	stripCodeComments,
	stripHrefAttributes,
	stripHtmlComments,
	stripImportStatements,
	stripLinkTargetArguments,
	stripMarkdownLinkTargets,
	type Violation
} from './lint-cleartext-artifacts.js';

// Textbereinigung (spec-textbereinigung-layer-texte.md): Grep-Gate aus der
// I/O-Matrix ("Artefakt-Grep"). Review-Fund 2. Runde: der Scan warf für
// `.svelte`-Dateien den kompletten `<script>`-Block weg (String-Literale wie
// `DISCLAIMER_TEXTS_DE` blieben unsichtbar) -- jetzt bleibt der Script-Block
// erhalten, nur Kommentare/Imports/Link-Ziele werden vor der Literal-
// Extraktion entfernt.

describe('lint-cleartext-artifacts', () => {
	it('findet 0 Verstöße im bereinigten Stand', async () => {
		const violations = await runCleartextArtifactLint();
		if (violations.length > 0) {
			const report = violations.map((v: Violation) => `${v.file}: [${v.pattern}] "${v.match}"`);
			expect(report, 'Gefundene Artefakte').toEqual([]);
		}
		expect(violations).toEqual([]);
	});

	it('jedes Pattern erkennt sein eigenes Beispiel (Selbsttest der Regex-Liste)', () => {
		const examples: Record<string, string> = {
			'Story-Nummer': 'siehe Story 10.6b',
			'Epic-Nummer': 'aus Epic 12',
			'FR-Nummer': 'gemäß FR50',
			'ADR-Nummer': 'seit ADR-015',
			'Option C': 'nicht im Score (Option C)',
			'Legacy-Slug': 'Legacy-Slug ohne Quelle',
			'Cloud-Dancer-Palette': 'Cloud-Dancer-Skala',
			'Strukturell-Indigo-Palette': 'in Strukturell-Indigo',
			'Gut-Skala-Palette': 'Layer Gut-Skala',
			'Methodik-Pfad als Text': 'Methodik: /methodik/kiez-score.'
		};
		for (const { name, regex } of FORBIDDEN_PATTERNS) {
			const example = examples[name];
			expect(example, `kein Beispiel für Pattern "${name}"`).toBeDefined();
			expect(regex.test(example), `Pattern "${name}" matcht nicht "${example}"`).toBe(true);
		}
	});

	// Review-Fund: FR-Nummer war zuvor auf `FR5\d` beschränkt (nur FR50-FR59).
	it('FR-Nummer-Pattern matcht jede FR-Zahl, nicht nur FR5x', () => {
		const pattern = FORBIDDEN_PATTERNS.find((p) => p.name === 'FR-Nummer')!;
		expect(pattern.regex.test('gemäß FR12')).toBe(true);
		expect(pattern.regex.test('gemäß FR99')).toBe(true);
		expect(pattern.regex.test('gemäß FR100')).toBe(true);
	});
});

describe('stripHtmlComments', () => {
	it('entfernt HTML-Kommentare', () => {
		expect(stripHtmlComments('<p>Text</p><!-- Story 10: Hinweis -->')).toBe('<p>Text</p>');
	});

	it('lässt sichtbaren Text außerhalb von Kommentaren unverändert (negativ)', () => {
		expect(stripHtmlComments('<p>Sichtbarer Text ohne Kommentar</p>')).toBe(
			'<p>Sichtbarer Text ohne Kommentar</p>'
		);
	});
});

describe('stripCodeComments', () => {
	it('entfernt Block- und Zeilenkommentare', () => {
		const input = "/* Story 1.28 */\nconst x = 'a'; // Epic 12\nconst y = 'b';";
		const out = stripCodeComments(input);
		expect(out).not.toMatch(/Story 1\.28/);
		expect(out).not.toMatch(/Epic 12/);
		expect(out).toContain("const x = 'a';");
		expect(out).toContain("const y = 'b';");
	});

	it('lässt Code ohne Kommentare unverändert (negativ)', () => {
		const input = "const x = 'kein Kommentar hier';";
		expect(stripCodeComments(input)).toBe(input);
	});
});

describe('stripHrefAttributes', () => {
	it('entfernt href="..." und href={...}', () => {
		const input = `<a href="/methodik/kiez-score">Text</a><a href={localizedHref('/methodik')}>Text2</a>`;
		const out = stripHrefAttributes(input);
		expect(out).not.toContain('/methodik/kiez-score');
		expect(out).not.toContain("localizedHref('/methodik')");
	});

	it('lässt sichtbaren Linktext stehen (negativ)', () => {
		const out = stripHrefAttributes('<a href="/methodik">Methodik zum Kiez-Score</a>');
		expect(out).toContain('Methodik zum Kiez-Score');
	});
});

describe('stripMarkdownLinkTargets', () => {
	it('entfernt das Linkziel, behält den Linktext', () => {
		const out = stripMarkdownLinkTargets('Siehe [Methodik zum Kiez-Score](/methodik/kiez-score).');
		expect(out).toContain('Methodik zum Kiez-Score');
		expect(out).not.toContain('/methodik/kiez-score');
	});

	it('lässt Text ohne Markdown-Link unverändert (negativ)', () => {
		const input = 'Ein normaler Satz ohne Link.';
		expect(stripMarkdownLinkTargets(input)).toBe(input);
	});
});

describe('stripImportStatements', () => {
	it('entfernt einzeilige import-Statements', () => {
		const out = stripImportStatements(
			"import { m } from '$lib/paraglide/messages.js';\nconst x = 1;"
		);
		expect(out).not.toContain('paraglide/messages.js');
		expect(out).toContain('const x = 1;');
	});

	it('entfernt mehrzeilige import-Statements', () => {
		const input = `import {\n\tresolveAuthority,\n\ttype Locale\n} from './authorities.js';\nconst y = 2;`;
		const out = stripImportStatements(input);
		expect(out).not.toContain('./authorities.js');
		expect(out).toContain('const y = 2;');
	});

	it('lässt Code ohne import unverändert (negativ)', () => {
		const input = "const z = 'kein Import';";
		expect(stripImportStatements(input)).toBe(input);
	});
});

describe('stripLinkTargetArguments', () => {
	it('entfernt href:-Property, path:-Property und urlPath:-Property', () => {
		const input = `{ name: 'Kiez-Score', path: '/methodik/kiez-score' }; const u = { urlPath: '/lizenzen' }; const h = { href: '/methodik' };`;
		const out = stripLinkTargetArguments(input);
		expect(out).not.toContain('/methodik/kiez-score');
		expect(out).not.toContain('/lizenzen');
		expect(out).not.toContain("href: '/methodik'");
	});

	it('entfernt resolve(...) und localizedHref(...)-Argumente', () => {
		const input = `const a = resolve('/methodik/kiez-score'); const b = localizedHref('/methodik/wahldaten', locale);`;
		const out = stripLinkTargetArguments(input);
		expect(out).not.toContain('/methodik/kiez-score');
		expect(out).not.toContain('/methodik/wahldaten');
	});

	it('lässt andere String-Property-Werte unverändert (negativ)', () => {
		const input = `const label = 'Kiez-Score';`;
		expect(stripLinkTargetArguments(input)).toBe(input);
	});
});

describe('extractStringLiterals', () => {
	it('scannt String-Literale aus Script-Code (z.B. DISCLAIMER_TEXTS_DE-Werte)', () => {
		const code = `
			export const DISCLAIMER_TEXTS_DE = {
				'compare-mietspiegel': 'Legacy-Slug im Disclaimer-Text.'
			};
		`;
		const out = extractStringLiterals(code);
		expect(out).toContain('Legacy-Slug im Disclaimer-Text.');
	});

	it('scannt Objekt-Properties wie `layers` auf der Kiez-Score-Seite', () => {
		const code = `const dim = { id: 'ruhe-luft', layers: 'Lärmbelastung 2023, Luftbelastung 2023' };`;
		const out = extractStringLiterals(code);
		expect(out).toContain('Lärmbelastung 2023, Luftbelastung 2023');
	});

	it('ignoriert import-Pfade (negativ, kein False-Positive auf Modul-Pfade)', () => {
		const code = `import { resolveAuthority } from './authorities.js';\nconst x = 'echter Text';`;
		const out = extractStringLiterals(code);
		expect(out).not.toContain('./authorities.js');
		expect(out).toContain('echter Text');
	});

	it('ignoriert href/resolve/localizedHref/path-Argumente (negativ)', () => {
		const code = `
			const items = [{ name: 'Methodik', path: '/methodik' }];
			const link = resolve('/methodik/kiez-score');
		`;
		const out = extractStringLiterals(code);
		expect(out).not.toContain('/methodik');
		expect(out).toContain('Methodik');
	});

	it('ignoriert Kommentare (negativ)', () => {
		const code = `// Story 1.28: interner Hinweis\nconst x = 'echter Text';`;
		const out = extractStringLiterals(code);
		expect(out).not.toContain('Story 1.28');
		expect(out).toContain('echter Text');
	});
});

describe('buildSvelteScannableText', () => {
	it('scannt String-Literale im <script>-Block (Review-Fund: vorher komplett verworfen)', () => {
		const svelte = `
			<script lang="ts">
				export const DISCLAIMER_TEXTS_DE = {
					legal: 'Legacy-Slug im Skript.'
				};
			</script>
			<p>Markup-Text</p>
		`;
		const out = buildSvelteScannableText(svelte);
		expect(out).toContain('Legacy-Slug im Skript.');
		expect(out).toContain('Markup-Text');
	});

	it('entfernt href-Attribute und HTML-Kommentare im Markup, behält sichtbaren Text', () => {
		const svelte = `
			<script lang="ts"></script>
			<!-- Story 10: interner Hinweis -->
			<a href="/methodik/kiez-score">Methodik zum Kiez-Score</a>
		`;
		const out = buildSvelteScannableText(svelte);
		expect(out).not.toContain('Story 10');
		expect(out).not.toContain('/methodik/kiez-score');
		expect(out).toContain('Methodik zum Kiez-Score');
	});

	it('ignoriert import-Zeilen und Routing-Properties im Script (negativ)', () => {
		const svelte = `
			<script lang="ts">
				import { buildBreadcrumbList } from '$lib/seo/index.js';
				const items = [{ name: 'Kiez-Score', path: '/methodik/kiez-score' }];
			</script>
			<p>Sichtbar</p>
		`;
		const out = buildSvelteScannableText(svelte);
		expect(out).not.toContain('$lib/seo/index.js');
		expect(out).not.toContain('/methodik/kiez-score');
		expect(out).toContain('Sichtbar');
	});
});
