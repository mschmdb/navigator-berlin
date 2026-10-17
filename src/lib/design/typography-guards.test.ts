import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Wächter für die Typografie (GH-87, Leitlinie 29). Plex Sans trägt alle Texte
 * und Zahlen (Zahlen mit tabular-nums), Mono bleibt Code vorbehalten. Keine Versalien-Labels,
 * keine Mittelpunkt-Meta-Strings, kein Pfeil an Link-Texten.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function svelteFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) {
			if (name === 'paraglide') continue;
			out.push(...svelteFiles(path));
		} else if (name.endsWith('.svelte')) {
			out.push(path);
		}
	}
	return out;
}

function stripComments(source: string): string {
	return source
		.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
		.replace(/(^|[^:"'`])\/\/.*$/gm, (m, p: string) => p + ' '.repeat(m.length - p.length));
}

interface Hit {
	file: string;
	line: number;
	text: string;
}

function findHits(test: (line: string, file: string) => boolean): Hit[] {
	const hits: Hit[] = [];
	for (const file of svelteFiles(SRC)) {
		const rel = relative(ROOT, file);
		const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
		lines.forEach((text, i) => {
			if (test(text, rel)) hits.push({ file: rel, line: i + 1, text: text.trim() });
		});
	}
	return hits;
}

const format = (hits: Hit[]) => hits.map((h) => `${h.file}:${h.line}  ${h.text}`).join('\n');

/** Code-Ausgaben dürfen Mono tragen, auch ohne Zahl. */
const MONO_CODE_FILES = ['src/lib/components/webmcp-diagnose.svelte'];

describe('Typografie-Guard (GH-87)', () => {
	it('nutzt keine Serif-Schrift in Komponenten', () => {
		const hits = findHits((line) => /\bfont-serif\b/.test(line));
		expect(format(hits)).toBe('');
	});

	it('nutzt keine Versalien-Labels', () => {
		const hits = findHits((line) => /(^|[\s"'`{:])uppercase(?=[\s"'`}]|$)/.test(line));
		expect(format(hits)).toBe('');
	});

	it('setzt Mono nur an Code, Zahlen laufen in Sans mit tabular-nums', () => {
		const hits = findHits((line, file) => {
			if (MONO_CODE_FILES.includes(file)) return false;
			if (!/\bfont-mono\b/.test(line)) return false;
			return !/<(code|pre|kbd)\b/.test(line);
		});
		expect(format(hits)).toBe('');
	});

	it('setzt Mono auch nicht per Inline-Style', () => {
		const hits = findHits(
			(line, file) =>
				!MONO_CODE_FILES.includes(file) &&
				/font-family:\s*(monospace|var\(--font-mono\))/.test(line)
		);
		expect(format(hits)).toBe('');
	});

	it('nutzt keinen Mittelpunkt als Trenner in Templates', () => {
		const hits = findHits(
			(line, file) =>
				line.includes('·') &&
				!MONO_CODE_FILES.includes(file) &&
				// OG-Bildtext: eigenes Medium, bleibt bei #87 unverändert.
				!line.includes('ogImageInput')
		);
		expect(format(hits)).toBe('');
	});

	it('lädt keine Serif-Schrift mehr in app.css und app.html', () => {
		const css = readFileSync(join(SRC, 'app.css'), 'utf8');
		const html = readFileSync(join(SRC, 'app.html'), 'utf8');
		expect(css).not.toMatch(/IBM Plex Serif|--font-serif/);
		expect(html).not.toMatch(/plex-serif/);
	});
});

/* ---------- Messages ---------- */

type Messages = Record<string, string>;
const load = (lang: string): Messages =>
	JSON.parse(readFileSync(join(ROOT, 'messages', `${lang}.json`), 'utf8')) as Messages;

/** Pfeile mit Fluss- oder Abbildungs-Bedeutung (von → nach, Wert → Punkte). */
const ARROW_ALLOWED: RegExp[] = [
	/^wahl_portal_sankey_band_aria_label_/,
	/^layer_methodology_/,
	/^methodik_kiez_score_norm_/,
	/^methodik_wahldaten_geometrien_p2$/,
	/^methodik_wahldaten_alias_p1$/,
	/^uis_accordion_content$/,
	/^webmcp_support_chatgpt_desc$/
];

/** Mittelpunkte ohne sichtbaren UI-Text: Seitentitel, OG-Alt, Druck-Fußzeile. */
const MIDDOT_ALLOWED: RegExp[] = [/_meta_title$/, /_og_alt$/, /^inspector_print_footer$/];

function offending(messages: Messages, char: string, allowed: RegExp[]): string[] {
	return Object.entries(messages)
		.filter(([key, value]) => key !== '$schema' && value.includes(char))
		.filter(([key]) => !allowed.some((re) => re.test(key)))
		.map(([key]) => key);
}

describe.each(['de', 'en'])('Messages %s (GH-87)', (lang) => {
	const messages = load(lang);

	it('hängt keinen Pfeil an Link- und Buttontexte', () => {
		expect(offending(messages, '→', ARROW_ALLOWED)).toEqual([]);
	});

	it('nutzt keinen Mittelpunkt als Meta-Trenner', () => {
		expect(offending(messages, '·', MIDDOT_ALLOWED)).toEqual([]);
	});
});
