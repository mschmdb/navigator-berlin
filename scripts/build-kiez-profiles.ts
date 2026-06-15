/**
 * scripts/build-kiez-profiles.ts (Story 11.6).
 *
 * Owner-getriggertes Authoring-Script (NICHT in prebuild). Generiert pro
 * Kiez/Bezirk ein grounded 2-3-Absatz-Profil via Claude API und schreibt es als
 * committetes Content-File `src/lib/content/{kiez,bezirk}-profile/{slug}.md`.
 * Build/Deploy liest die Files statisch, ruft NIE die API.
 *
 * Run:
 *   pnpm data:profiles --only=alexanderplatz,mitte   # Pilot
 *   pnpm data:profiles --type=kiez                    # alle Kieze
 *   pnpm data:profiles                                # alle (kiez+bezirk)
 *   pnpm data:profiles --force                        # ignoriert inputHash
 *   pnpm data:profiles --dump-inputs                  # nur JSON-Inputs (keine API),
 *                                                       # für gratis Subscription/Subagent-Generierung
 *
 * Inkrementell: überspringt Areas mit unverändertem inputHash (außer --force).
 * Input-Erzeugung liegt in `scripts/lib/profiles/build.ts` (geteilt mit dem Lint).
 *
 * EU-FOSS-Ausnahme (Epic 4 / ADR-016): Claude API ist US-Anbieter, hier nur zur
 * Authoring-Zeit (offline), nicht im Production-Pfad.
 */

import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { closeDb } from '../src/lib/server/db/index.js';
import { buildAllInputs, type BuiltInput } from './lib/profiles/build.js';
import type { ProfileInput } from './lib/profiles/input.js';

export const MODEL = 'claude-sonnet-4-6';
const API_URL = 'https://api.anthropic.com/v1/messages';

export const SYSTEM_PROMPT = `Du schreibst ein kurzes, gut lesbares Profil eines Berliner Kiezes oder Bezirks für navigator.berlin. Es soll klingen wie von einem ortskundigen Menschen, der nüchtern einordnet, nicht wie ein Datenbank-Bericht.

So schreibst du:
- Genau 2 kurze Absätze auf Deutsch. Reine Prosa, keine Überschriften, keine Aufzählungen.
- Kurze Sätze, höchstens 15 bis 18 Wörter. Ein Gedanke pro Satz.
- Aktiv und konkret. Kein Nominalstil, keine Funktionsverben ("erreicht einen Wert von", "wird ausgewiesen", "lässt sich festhalten"). Schreib zum Beispiel "[Gebiet] ist gut angebunden" statt "[Gebiet] erreicht im Mobilitäts-Score einen Wert von".
- Verwende im Text ausschließlich den Namen aus dem Input (Feld "name"). Übernimm KEINE Beispielnamen oder Orte aus dieser Anleitung.
- Der erste Satz nennt das Charakteristische zuerst (die größte Stärke oder den größten Kontrast).
- Rang nur nennen, wenn er etwas aussagt (sehr gut oder sehr schwach), und in Worte gepackt ("zweitbester von 143"), nicht roh.

Zahlen sparsam:
- Nenne KEINE Einzel-Counts: nicht die Zahl der U-Bahn-, S-Bahn-, Tram- oder Bus-Halte, nicht die Zahl der Grünanlagen oder Spielplätze. Diese stehen bereits in der Steckbrief-Tabelle der Seite.
- Als konkrete Zahlen erlaubt sind höchstens: die ÖPNV-Haltestellendichte (oepnvStopsProKm2), die gefühlte Temperatur (petGrad), einzelne Score-Werte und Ränge. Wähle 2 bis 4 davon, webe sie natürlich ein.

Kennzahlen-Bedeutung (so und nicht anders benennen):
- Score-Werte (composite, ruheLuft, gruenHitze, mobilitaet, versorgung, wohnschutz, kultur) sind Punkte von 0 bis 100, höher ist besser.
- Kultur misst Kulturorte in Reichweite. Verknüpfe Kultur im Text NIE mit dem Gesamt-Score (nicht "hebt/senkt den Gesamt-Score"). Schreibe AUCH KEINE Meta-Hinweise wie "zählt eigenständig", "eigene Dimension" oder "nicht im Gesamt-Score" in den Profiltext, das ist Methodik, kein Profil.
- Wenn Kultur unter den zwei höchsten ODER zwei niedrigsten Dimensionen liegt, erwähne sie natürlich mit Wert und qualitativer Einordnung (z.B. "kulturell stark, Rang X von 143" oder "wenig Kultur in Reichweite"). Sonst nur, wenn sie etwas aussagt.
- petGrad ist die mittlere gefühlte Temperatur (PET) an heißen Tagen in Grad Celsius. Nenne sie "gefühlte Temperatur", NICHT "Oberflächentemperatur" oder "Lufttemperatur".
- oepnvStopsProKm2 ist die Haltestellendichte pro Quadratkilometer.
- laermKlasse und wohnlage sind Kategorien (niedrig/mittel/hoch bzw. einfach/mittel/gut).
- mss ist der Index "Monitoring Soziale Stadtentwicklung" (Sozialstruktur, Stufen niedrig/mittel/hoch). Das ist NICHT Milieuschutz und NICHT der Wohnschutz. Nenne ihn höchstens "soziale Lage" und nur, wenn nötig.

Strikte Regeln:
- Nutze AUSSCHLIESSLICH die im JSON gelieferten Werte. Erfinde nichts: keine Geschichte, keine Sehenswürdigkeiten, keine Namen, keine Stimmung, die nicht aus den Daten folgt.
- Jede Zahl im Text muss exakt aus den Daten stammen. Rechne nichts aus: keine Verhältnisse, keine Faktoren. Vergleiche nur qualitativ: über, unter oder nahe am Median bzw. Bezirksschnitt.
- Benenne und interpretiere Kennzahlen nicht um. Wenn du unsicher bist, was eine Zahl bedeutet, lass sie weg.
- Neutral, nicht stigmatisierend: keine Wertung wie "guter" oder "schlechter" Kiez, kein "beliebt", kein "lebenswert". Bei schwachen Werten sachlich bleiben.
- Keine Gedankenstriche (kein — und kein –). Komma oder Punkt.
- Keine Füllwörter (eigentlich, durchaus, natürlich, zudem, darüber hinaus).`;

interface Args {
	only: Set<string> | null;
	type: 'kiez' | 'bezirk' | 'both';
	force: boolean;
	dumpInputs: boolean;
}

function parseArgs(argv: readonly string[]): Args {
	let only: Set<string> | null = null;
	let type: Args['type'] = 'both';
	let force = false;
	let dumpInputs = false;
	for (const a of argv) {
		if (a.startsWith('--only='))
			only = new Set(
				a
					.slice(7)
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			);
		else if (a === '--type=kiez') type = 'kiez';
		else if (a === '--type=bezirk') type = 'bezirk';
		else if (a === '--force') force = true;
		else if (a === '--dump-inputs') dumpInputs = true;
	}
	return { only, type, force, dumpInputs };
}

async function callClaude(input: ProfileInput): Promise<string> {
	const apiKey = process.env.CLAUDE_API_KEY;
	if (!apiKey) throw new Error('CLAUDE_API_KEY fehlt');
	const res = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			model: MODEL,
			max_tokens: 700,
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: 'user',
					content: `Schreibe das Kurzprofil aus diesen Daten:\n\n${JSON.stringify(input, null, 2)}`
				}
			]
		})
	});
	if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
	const data = (await res.json()) as { content: { type: string; text?: string }[] };
	const text = data.content
		.filter((c) => c.type === 'text' && c.text)
		.map((c) => c.text)
		.join('\n')
		.trim();
	if (!text) throw new Error('Leere Antwort vom Modell');
	return text;
}

export function profileFrontmatter(
	b: BuiltInput,
	model: string,
	generatedAt: string
): {
	slug: string;
	name: string;
	pageType: string;
	model: string;
	inputHash: string;
	generatedAt: string;
} {
	return {
		slug: b.slug,
		name: b.name,
		pageType: b.pageType,
		model,
		inputHash: b.inputHash,
		generatedAt
	};
}

function outPath(pageType: 'kiez' | 'bezirk', slug: string): string {
	return join(process.cwd(), 'src/lib/content', `${pageType}-profile`, `${slug}.md`);
}

async function existingHash(path: string): Promise<string | null> {
	if (!existsSync(path)) return null;
	try {
		const fm = matter(await readFile(path, 'utf-8'));
		return typeof fm.data.inputHash === 'string' ? fm.data.inputHash : null;
	} catch {
		return null;
	}
}

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[profiles] DATABASE_URL fehlt — abort.\n');
		process.exit(1);
	}
	const args = parseArgs(process.argv.slice(2));
	const types: ('kiez' | 'bezirk')[] = args.type === 'both' ? ['bezirk', 'kiez'] : [args.type];
	let all = await buildAllInputs(types);
	if (args.only) all = all.filter((b) => args.only!.has(b.slug));

	if (args.dumpInputs) {
		process.stdout.write(JSON.stringify(all, null, 2));
		await closeDb();
		return;
	}

	let written = 0;
	let skipped = 0;
	for (const pageType of types) {
		await mkdir(join(process.cwd(), 'src/lib/content', `${pageType}-profile`), { recursive: true });
	}
	for (const b of all) {
		const path = outPath(b.pageType, b.slug);
		if (!args.force && (await existingHash(path)) === b.inputHash) {
			skipped += 1;
			continue;
		}
		process.stdout.write(`[profiles] generating ${b.pageType}/${b.slug} ...\n`);
		const prose = await callClaude(b.input);
		const fm = profileFrontmatter(b, MODEL, new Date().toISOString());
		await writeFile(path, matter.stringify(`\n${prose}\n`, fm), 'utf-8');
		written += 1;
	}
	process.stdout.write(`[profiles] done. written=${written} skipped=${skipped}\n`);
	await closeDb();
}

// Nur ausführen, wenn direkt als Script gestartet (nicht beim Import von
// SYSTEM_PROMPT/Helpern durch andere Module/Tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch(async (err: unknown) => {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[profiles] FATAL: ${msg}\n`);
		await closeDb().catch(() => undefined);
		process.exit(1);
	});
}
