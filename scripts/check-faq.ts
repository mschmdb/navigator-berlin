/**
 * scripts/check-faq.ts (NAV-108): Prüft die gespeicherten FAQ-Antworten in
 * `faq_qna` gegen die aktuellen Quelldaten (Aggregat, Scores, Ränge).
 *
 * Run: `pnpm data:faq:check`. Exit 1 bei Widersprüchen. `render-faq.ts` prüft
 * dieselben Regeln schon vor dem Schreiben; dieses Skript fängt einen veralteten
 * Tabellenstand, etwa nach neuen Rängen ohne neuen FAQ-Lauf.
 */

import 'dotenv/config';
import { getDb, closeDb } from '../src/lib/server/db/index.js';
import { faqQna } from '../src/lib/server/db/schema/index.js';
import { checkFaqAnswer } from '../src/lib/server/faq/faq-fact-check.js';
import { loadAllFaqTemplates } from '../src/lib/server/faq/load-templates.js';
import type { PageType, TemplateLocale } from '../src/lib/server/faq/template-schema.js';
import { loadAllTargets, scoreField } from './lib/faq/targets.js';

async function main(): Promise<void> {
	if (!process.env.DATABASE_URL) {
		process.stderr.write('[check-faq] DATABASE_URL fehlt, Abbruch.\n');
		process.exit(1);
	}
	const [{ bezirks, kieze }, templates, rows] = await Promise.all([
		loadAllTargets(),
		loadAllFaqTemplates(),
		getDb().select().from(faqQna)
	]);
	const targets = new Map([...bezirks, ...kieze].map((t) => [`${t.pageType}|${t.slug}`, t]));
	const templateText = new Map<string, string>();
	for (const { locale, file } of templates) {
		for (const t of file.templates) templateText.set(`${locale}|${t.id}`, t.answer);
	}
	const fields = new Map<PageType, Map<string, number[]>>([
		['kiez', scoreField(kieze)],
		['bezirk', scoreField(bezirks)]
	]);

	const problems: string[] = [];
	let checked = 0;
	for (const row of rows) {
		if (row.pageType === 'layer') continue;
		const pageType = row.pageType as PageType;
		const locale = row.locale as TemplateLocale;
		const target = targets.get(`${pageType}|${row.slug}`);
		if (!target) {
			problems.push(`${pageType}/${row.slug} ${locale} ${row.templateId} [ziel] kein Datensatz`);
			continue;
		}
		checked += 1;
		const findings = checkFaqAnswer(
			{
				pageType,
				slug: row.slug,
				locale,
				templateId: row.templateId,
				answer: row.answer,
				templateText: templateText.get(`${locale}|${row.templateId}`) ?? ''
			},
			{
				name: target.name,
				aggregate: target.aggregate,
				metrics: target.metrics,
				field: fields.get(pageType)
			}
		);
		for (const f of findings) {
			problems.push(`${pageType}/${row.slug} ${locale} ${row.templateId} [${f.kind}] ${f.message}`);
		}
	}

	process.stdout.write(
		`[check-faq] ${checked} Antworten geprüft, ${problems.length} Widersprüche.\n`
	);
	if (problems.length > 0) process.stdout.write(`${problems.join('\n')}\n`);
	await closeDb();
	process.exit(problems.length > 0 ? 1 : 0);
}

main().catch(async (err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	process.stderr.write(`[check-faq] FATAL: ${msg}\n`);
	await closeDb().catch(() => undefined);
	process.exit(1);
});
