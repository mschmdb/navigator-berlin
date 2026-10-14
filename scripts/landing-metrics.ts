/**
 * L8: Gibt eine ClickHouse-SQL-Abfrage für die Plausible-Instanz aus.
 * Sie vergleicht Einstiege, Bounce, Dauer und Seiten pro Besuch je Seitentyp
 * für zwei Zeiträume. Das Skript verbindet sich nicht selbst.
 * Ausführung: siehe docs/runbooks/landing-metrics.md.
 *
 * Aufruf: pnpm metrics:landing --a 2026-09-16:2026-10-14 --b 2026-10-20:2026-11-17 [--site-id 7]
 */
import { pathToFileURL } from 'node:url';

export interface Period {
	readonly from: string;
	readonly to: string;
	/** Folgetag von `to`, damit der letzte Tag voll zählt. */
	readonly endExclusive: string;
}

export interface QueryInput {
	readonly a: Period;
	readonly b: Period;
	readonly siteId?: string;
}

const FORMAT_HINT = 'Erwartet YYYY-MM-DD:YYYY-MM-DD, zum Beispiel 2026-09-16:2026-10-14.';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(value: string, input: string): Date {
	if (!DATE_PATTERN.test(value)) {
		throw new Error(`Ungültiger Zeitraum "${input}". ${FORMAT_HINT}`);
	}
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
		throw new Error(`Ungültiges Datum "${value}" in "${input}". ${FORMAT_HINT}`);
	}
	return date;
}

function isoDay(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function parsePeriod(input: string): Period {
	const parts = input.split(':');
	if (parts.length !== 2) {
		throw new Error(`Ungültiger Zeitraum "${input}". ${FORMAT_HINT}`);
	}
	const [fromRaw, toRaw] = parts as [string, string];
	const from = parseDate(fromRaw, input);
	const to = parseDate(toRaw, input);
	if (to < from) {
		throw new Error(`Das Ende liegt vor dem Start in "${input}". ${FORMAT_HINT}`);
	}
	const next = new Date(to.getTime() + 24 * 60 * 60 * 1000);
	return { from: fromRaw, to: toRaw, endExclusive: isoDay(next) };
}

/** Die Zeiträume sind Berliner Kalendertage. */
const TIME_ZONE = 'Europe/Berlin';

const PAGE_TYPE_SQL = `multiIf(
			match(entry_page, '^(/en)?/?$'), 'start',
			match(entry_page, '^(/en)?/kiez/'), 'kiez',
			match(entry_page, '^(/en)?/bezirk/'), 'bezirk',
			match(entry_page, '^(/en)?/layer/'), 'layer',
			match(entry_page, '^(/en)?/explore'), 'explore',
			'other'
		)`;

function periodSelect(label: 'A' | 'B', period: Period, siteId: string): string {
	return `SELECT
		'${label}' AS period,
		${PAGE_TYPE_SQL} AS page_type,
		sum(sign) AS visits,
		round(100 * sum(sign * is_bounce) / sum(sign), 1) AS bounce_pct,
		round(sum(sign * duration) / sum(sign)) AS avg_duration_s,
		round(sum(sign * pageviews) / sum(sign), 2) AS pages_per_visit
	FROM sessions_v2
	WHERE site_id = ${siteId}
		AND start >= toDateTime('${period.from} 00:00:00', '${TIME_ZONE}')
		AND start < toDateTime('${period.endExclusive} 00:00:00', '${TIME_ZONE}')
	GROUP BY period, page_type
	HAVING sum(sign) > 0`;
}

function resolveSiteId(siteId: string | undefined): string {
	if (siteId !== undefined && !/^\d+$/.test(siteId)) {
		throw new Error(`Ungültige --site-id "${siteId}". Erwartet eine Zahl.`);
	}
	return siteId ?? '<site_id>';
}

export function buildLandingQuery({ a, b, siteId }: QueryInput): string {
	const site = resolveSiteId(siteId);
	return `SELECT * FROM (
${periodSelect('A', a, site)}
UNION ALL
${periodSelect('B', b, site)}
)
ORDER BY page_type, period;
`;
}

/** Klickverteilung je action und page_type für einen Zeitraum (Tabelle events_v2). */
export function buildEventsQuery({ b, siteId }: Pick<QueryInput, 'b' | 'siteId'>): string {
	const site = resolveSiteId(siteId);
	return `SELECT
	meta.value[indexOf(meta.key, 'page_type')] AS page_type,
	meta.value[indexOf(meta.key, 'action')] AS action,
	count() AS clicks
FROM events_v2
WHERE site_id = ${site}
	AND name = 'Landing'
	AND timestamp >= toDateTime('${b.from} 00:00:00', '${TIME_ZONE}')
	AND timestamp < toDateTime('${b.endExclusive} 00:00:00', '${TIME_ZONE}')
GROUP BY page_type, action
ORDER BY page_type, clicks DESC;
`;
}

function dayCount(period: Period): number {
	const ms =
		Date.parse(`${period.endExclusive}T00:00:00Z`) - Date.parse(`${period.from}T00:00:00Z`);
	return Math.round(ms / (24 * 60 * 60 * 1000));
}

/** Warnung bei ungleich langen Zeiträumen, sonst `null`. */
export function lengthWarning(a: Period, b: Period): string | null {
	const days = [dayCount(a), dayCount(b)];
	return days[0] === days[1]
		? null
		: `Warnung: Zeitraum A hat ${days[0]} Tage, B hat ${days[1]}. Besuche sind nur eingeschränkt vergleichbar.`;
}

function readFlag(argv: readonly string[], name: string): string | undefined {
	const index = argv.indexOf(name);
	if (index === -1) return undefined;
	const value = argv[index + 1];
	if (value === undefined || value.startsWith('--')) {
		throw new Error(`Argument ${name} braucht einen Wert.`);
	}
	return value;
}

export interface ParsedArgs {
	readonly a?: Period;
	readonly b: Period;
	readonly siteId?: string;
	readonly events: boolean;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
	const events = argv.includes('--events');
	const a = readFlag(argv, '--a');
	const b = readFlag(argv, '--b');
	const siteId = readFlag(argv, '--site-id');
	if (!events && !a) throw new Error(`Argument --a fehlt. ${FORMAT_HINT}`);
	if (!b) throw new Error(`Argument --b fehlt. ${FORMAT_HINT}`);
	const periodB = parsePeriod(b);
	if (!a) return { b: periodB, siteId, events };
	const periodA = parsePeriod(a);
	if (periodB.from <= periodA.to) {
		throw new Error(`Zeitraum B muss nach dem Ende von A beginnen (A endet ${periodA.to}).`);
	}
	return { a: periodA, b: periodB, siteId, events };
}

function main(): void {
	try {
		const args = parseArgs(process.argv.slice(2));
		if (args.events) {
			process.stdout.write(buildEventsQuery(args));
			return;
		}
		if (!args.a) throw new Error('Argument --a fehlt.');
		const warning = lengthWarning(args.a, args.b);
		if (warning) process.stderr.write(`[landing-metrics] ${warning}\n`);
		process.stdout.write(buildLandingQuery({ a: args.a, b: args.b, siteId: args.siteId }));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		process.stderr.write(`[landing-metrics] ${msg}\n`);
		process.exit(1);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main();
}
