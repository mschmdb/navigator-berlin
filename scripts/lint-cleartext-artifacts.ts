/**
 * Textbereinigung (spec-textbereinigung-layer-texte.md): Grep-Gate gegen
 * interne Artefakte in öffentlichen DE/EN-Texten. Deckt die I/O-Matrix-Zeile
 * "Artefakt-Grep" ab: `src/`, `messages/` (ohne Kommentare/Tests) dürfen
 * keine Story-/Epic-/FR-Nummern, "Option C", "Legacy-Slug", Palettennamen
 * oder Methodik-Pfade als sichtbaren Text mehr enthalten.
 *
 * Kein Vollrepo-Grep: Code-Kommentare (z.B. "Story 1.28" als Entwickler-
 * Referenz), `import`-Zeilen und `href`/`resolve(`/`localizedHref(`/`path:`-
 * Argumente (echte, funktionierende Links bzw. interne Routing-Daten) sind
 * KEIN Artefakt im Sinne dieser Spec -- nur sichtbarer Fließtext zählt.
 *
 * Review-Fund (2. Runde): Der ursprüngliche Scan warf für `.svelte`-Dateien
 * den kompletten `<script>`-Block weg -- damit blieben String-Literale wie
 * `DISCLAIMER_TEXTS_DE` oder die `dimensions`-Arrays auf der Kiez-Score-Seite
 * unsichtbar für das Gate. Jetzt bleibt der Script-Block erhalten, nur
 * Kommentare werden entfernt; gescannt werden ausschließlich extrahierte
 * String-/Template-Literale (keine Bezeichner, keine `import`-Pfade), um
 * False-Positives aus Imports/Routing-Code zu vermeiden.
 */
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, extname } from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

export interface Pattern {
	readonly name: string;
	readonly regex: RegExp;
}

export const FORBIDDEN_PATTERNS: readonly Pattern[] = [
	{ name: 'Story-Nummer', regex: /\bStory\s+\d/i },
	{ name: 'Epic-Nummer', regex: /\bEpic\s+\d/i },
	{ name: 'FR-Nummer', regex: /\bFR\d+\b/ },
	{ name: 'ADR-Nummer', regex: /\bADR-\d/ },
	{ name: 'Option C', regex: /\bOption C\b/ },
	{ name: 'Legacy-Slug', regex: /Legacy-Slug/i },
	{ name: 'Cloud-Dancer-Palette', regex: /Cloud[- ]Dancer/i },
	{ name: 'Strukturell-Indigo-Palette', regex: /Strukturell-Indigo/ },
	{ name: 'Gut-Skala-Palette', regex: /Gut-Skala/ },
	{ name: 'Methodik-Pfad als Text', regex: /\/methodik\/[a-z-]+/ }
];

/** JSON-Message-Dateien: reiner Text, keine Kommentare/Attribute -- direkt scannbar. */
export const MESSAGE_FILES: readonly string[] = ['messages/de.json', 'messages/en.json'];

/** Einzeldateien ohne sinnvolle Geschwister zum Globben (Data-Module). */
export const SINGLE_FILES: readonly string[] = [
	'src/lib/components/atlas/inspector-panel/internal/layer-explain.ts',
	'src/lib/data/layer-methodology.ts',
	'src/lib/components/atlas/editorial-disclaimer.svelte',
	'src/lib/components/atlas/map-legend.svelte'
];

/**
 * Verzeichnis-Globs statt Datei-für-Datei-Liste (Review-Fund). `recursive`
 * deckt verschachtelte Routen ab (z.B. `methodik/kiez-score/+page.svelte`);
 * `wahl-portal` bleibt bewusst NICHT rekursiv -- `internal/` enthält Sankey-/
 * Chart-Hilfsmodule außerhalb des Spec-Scopes.
 */
interface GlobDir {
	readonly dir: string;
	readonly ext: string;
	readonly recursive: boolean;
}

export const GLOB_DIRS: readonly GlobDir[] = [
	{ dir: 'src/routes/(with-header)/methodik', ext: '.svelte', recursive: true },
	{ dir: 'src/routes/(with-header)/lizenzen', ext: '.svelte', recursive: true },
	{ dir: 'src/routes/(with-header)/layer/[slug]', ext: '.svelte', recursive: true },
	{ dir: 'src/lib/components/wahl-portal', ext: '.svelte', recursive: false }
];

/** Update-Posts: alle datierten Posts (`YYYY-MM-DD-*.md`) -- schließt `README.md` aus. */
const UPDATE_POST_NAME_RE = /^\d{4}-\d{2}-\d{2}-.*\.md$/;

async function listUpdatePosts(): Promise<string[]> {
	const entries = await readdir(join(REPO_ROOT, '_content/updates'), { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && UPDATE_POST_NAME_RE.test(e.name))
		.map((e) => `_content/updates/${e.name}`)
		.sort();
}

async function walk(absDir: string, ext: string, recursive: boolean): Promise<string[]> {
	let entries;
	try {
		entries = await readdir(absDir, { withFileTypes: true });
	} catch {
		return [];
	}
	const out: string[] = [];
	for (const entry of entries) {
		const full = join(absDir, entry.name);
		if (entry.isDirectory()) {
			if (recursive) out.push(...(await walk(full, ext, recursive)));
			continue;
		}
		if (extname(entry.name) === ext) out.push(full);
	}
	return out;
}

async function listGlobDirFiles(): Promise<string[]> {
	const results = await Promise.all(
		GLOB_DIRS.map(async (g) => {
			const abs = await walk(join(REPO_ROOT, g.dir), g.ext, g.recursive);
			return abs.map((a) => a.slice(REPO_ROOT.length));
		})
	);
	return results.flat().sort();
}

/** Entfernt `<!-- ... -->`-Kommentare (Svelte-Markup, außerhalb `<script>`). */
export function stripHtmlComments(text: string): string {
	return text.replace(/<!--[\s\S]*?-->/g, '');
}

/** Entfernt `//`- und `/* *\/`-Kommentare (JS/TS-Code). */
export function stripCodeComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Entfernt `href="..."` / `href={...}` -- echte Links sind kein sichtbarer Text. */
export function stripHrefAttributes(text: string): string {
	return text.replace(/href=(?:"[^"]*"|\{[^}]*\})/g, 'href=""');
}

/** Entfernt das Linkziel `(...)` in Markdown-Links `[Text](/pfad)` -- nur `Text` ist sichtbar. */
export function stripMarkdownLinkTargets(text: string): string {
	return text.replace(/\]\([^)]*\)/g, ']()');
}

/** Entfernt komplette `import ... from '...';`-Statements (auch mehrzeilig). */
export function stripImportStatements(text: string): string {
	return text.replace(/\bimport\s+[\s\S]*?from\s*['"][^'"]*['"];?/g, '');
}

/**
 * Entfernt Argumente von `href:`/`href=`, `resolve(...)`, `localizedHref(...)`
 * sowie `path:`/`urlPath:` -- Routing-/Link-Ziele sind kein sichtbarer Text,
 * unabhängig davon, ob sie als Attribut, Objekt-Property (Breadcrumb-Items,
 * `buildSpeakableWebPage`-Aufrufe) oder Funktionsargument stehen.
 */
export function stripLinkTargetArguments(text: string): string {
	return text
		.replace(/\bhref\s*[:=]\s*(?:\{[^}]*\}|["'`](?:[^"'`\\]|\\.)*["'`])/g, '')
		.replace(/\b(?:path|urlPath)\s*:\s*["'`](?:[^"'`\\]|\\.)*["'`]/g, '')
		.replace(/\bresolve\(\s*["'`](?:[^"'`\\]|\\.)*["'`]\s*\)/g, '')
		.replace(/\blocalizedHref\(\s*["'`](?:[^"'`\\]|\\.)*["'`][^)]*\)/g, '');
}

const STRING_LITERAL_RE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

/**
 * Extrahiert nur die INHALTE von String-/Template-Literalen aus Code (keine
 * Bezeichner, keine Kommentare, keine `import`-Pfade). Dadurch scannt das
 * Gate genau das, was als Daten/Text im Code steht (z.B. `DISCLAIMER_TEXTS_DE`-
 * Werte oder die `layers`-Property auf der Kiez-Score-Seite), ohne auf
 * Modul-Pfade wie `'./authorities.js'` anzuspringen.
 */
export function extractStringLiterals(code: string): string {
	const withoutComments = stripCodeComments(code);
	const withoutImports = stripImportStatements(withoutComments);
	const withoutLinkTargets = stripLinkTargetArguments(withoutImports);
	const matches = withoutLinkTargets.match(STRING_LITERAL_RE) ?? [];
	return matches.map((m) => m.slice(1, -1)).join('\n');
}

const SCRIPT_BLOCK_RE = /<script[^>]*>([\s\S]*?)<\/script>/gi;

/**
 * Baut den scannbaren Text einer `.svelte`-Datei: Markup bleibt Klartext
 * (mit `href`-Attributen/HTML-Kommentaren entfernt), `<script>`-Inhalte
 * werden auf ihre String-Literale reduziert (siehe `extractStringLiterals`).
 */
export function buildSvelteScannableText(raw: string): string {
	const scriptLiterals: string[] = [];
	const markupOnly = raw.replace(SCRIPT_BLOCK_RE, (_match, inner: string) => {
		scriptLiterals.push(extractStringLiterals(inner));
		return '';
	});
	const cleanedMarkup = stripHrefAttributes(stripHtmlComments(markupOnly));
	return `${cleanedMarkup}\n${scriptLiterals.join('\n')}`;
}

export interface Violation {
	readonly file: string;
	readonly pattern: string;
	readonly match: string;
}

function scanText(file: string, text: string): Violation[] {
	const violations: Violation[] = [];
	for (const { name, regex } of FORBIDDEN_PATTERNS) {
		const match = text.match(regex);
		if (match) violations.push({ file, pattern: name, match: match[0] });
	}
	return violations;
}

async function scanMessageFile(relPath: string): Promise<Violation[]> {
	const raw = await readFile(join(REPO_ROOT, relPath), 'utf-8');
	const data = JSON.parse(raw) as Record<string, unknown>;
	const violations: Violation[] = [];
	for (const [key, value] of Object.entries(data)) {
		if (typeof value !== 'string') continue;
		for (const v of scanText(`${relPath}#${key}`, value)) violations.push(v);
	}
	return violations;
}

async function scanFile(relPath: string): Promise<Violation[]> {
	const raw = await readFile(join(REPO_ROOT, relPath), 'utf-8');
	if (relPath.endsWith('.svelte')) {
		return scanText(relPath, buildSvelteScannableText(raw));
	}
	if (relPath.endsWith('.md')) {
		return scanText(relPath, stripMarkdownLinkTargets(raw));
	}
	// .ts / sonstiger Code: komplette Datei ist "Script".
	return scanText(relPath, extractStringLiterals(raw));
}

export async function runCleartextArtifactLint(): Promise<Violation[]> {
	const [updatePosts, globDirFiles] = await Promise.all([listUpdatePosts(), listGlobDirFiles()]);
	const targets = [...SINGLE_FILES, ...globDirFiles, ...updatePosts];
	const results = await Promise.all([
		...MESSAGE_FILES.map(scanMessageFile),
		...targets.map(scanFile)
	]);
	return results.flat();
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMain) {
	runCleartextArtifactLint().then((violations) => {
		if (violations.length === 0) {
			console.log('lint-cleartext-artifacts: 0 Verstöße');
			return;
		}
		console.error(`lint-cleartext-artifacts: ${violations.length} Verstöße`);
		for (const v of violations) {
			console.error(`  ${v.file}: [${v.pattern}] "${v.match}"`);
		}
		process.exitCode = 1;
	});
}
