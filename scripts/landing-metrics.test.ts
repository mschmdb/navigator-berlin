import { describe, expect, it } from 'vitest';
import {
	buildEventsQuery,
	buildLandingQuery,
	lengthWarning,
	parseArgs,
	parsePeriod
} from './landing-metrics.js';

describe('parsePeriod', () => {
	it('liest von:bis und liefert ein exklusives Ende am Folgetag', () => {
		expect(parsePeriod('2026-09-16:2026-10-14')).toEqual({
			from: '2026-09-16',
			to: '2026-10-14',
			endExclusive: '2026-10-15'
		});
	});

	it('rollt Monats- und Jahresgrenzen korrekt', () => {
		expect(parsePeriod('2026-12-01:2026-12-31').endExclusive).toBe('2027-01-01');
		expect(parsePeriod('2028-02-01:2028-02-29').endExclusive).toBe('2028-03-01');
	});

	it('akzeptiert einen Ein-Tages-Zeitraum', () => {
		expect(parsePeriod('2026-10-14:2026-10-14').endExclusive).toBe('2026-10-15');
	});

	it.each([
		['2026-09-16', 'fehlt der Doppelpunkt'],
		['2026-9-16:2026-10-14', 'falsches Format'],
		['2026-02-30:2026-03-05', 'kein echtes Datum'],
		['2026-10-14:2026-09-16', 'Ende vor Start'],
		['2026-09-16:2026-10-14:2026-11-01', 'zu viele Teile'],
		["2026-09-16:2026-10-14'; DROP TABLE x;--", 'Injection-Versuch'],
		['', 'leer']
	])('wirft bei %s (%s) mit Formathinweis', (input) => {
		expect(() => parsePeriod(input)).toThrow(/YYYY-MM-DD:YYYY-MM-DD/);
	});
});

describe('buildLandingQuery', () => {
	const a = parsePeriod('2026-09-16:2026-10-14');
	const b = parsePeriod('2026-10-20:2026-11-17');

	it('enthält beide Zeiträume mit Label', () => {
		const sql = buildLandingQuery({ a, b, siteId: '42' });
		expect(sql).toContain("'A' AS period");
		expect(sql).toContain("'B' AS period");
		expect(sql).toContain("'2026-09-16 00:00:00'");
		expect(sql).toContain("'2026-10-15 00:00:00'");
		expect(sql).toContain("'2026-10-20 00:00:00'");
		expect(sql).toContain("'2026-11-18 00:00:00'");
	});

	it('gruppiert nach Seitentyp und gewichtet über sign', () => {
		const sql = buildLandingQuery({ a, b, siteId: '42' });
		expect(sql).toContain('FROM sessions_v2');
		expect(sql).toContain('site_id = 42');
		expect(sql).toContain('sum(sign)');
		expect(sql).toContain('GROUP BY period, page_type');
		for (const type of ['kiez', 'bezirk', 'layer']) expect(sql).toContain(`'${type}'`);
	});

	it('klassifiziert deutsche und englische Pfade', () => {
		const sql = buildLandingQuery({ a, b, siteId: '42' });
		expect(sql).toContain('^(/en)?/kiez/');
		expect(sql).toContain('^(/en)?/bezirk/');
		expect(sql).toContain('^(/en)?/layer/');
	});

	it('nutzt einen Platzhalter, wenn keine Site-ID vorliegt', () => {
		expect(buildLandingQuery({ a, b })).toContain('site_id = <site_id>');
	});

	it('sortiert über beide Zeiträume per Subquery um UNION ALL', () => {
		const sql = buildLandingQuery({ a, b, siteId: '42' });
		expect(sql).toMatch(/^SELECT \* FROM \(/);
		expect(sql).toMatch(/UNION ALL[\s\S]*\)\nORDER BY page_type, period;/);
	});

	it('rechnet die Tagesgrenzen in Berliner Zeit', () => {
		const sql = buildLandingQuery({ a, b, siteId: '42' });
		expect(sql).toContain("toDateTime('2026-09-16 00:00:00', 'Europe/Berlin')");
		expect(sql).not.toMatch(/toDateTime\('[^']+'\)/);
	});

	it('lehnt eine nicht numerische Site-ID ab', () => {
		expect(() => buildLandingQuery({ a, b, siteId: '1 OR 1=1' })).toThrow(/site-id/);
	});
});

describe('parseArgs', () => {
	it('liest --a, --b und --site-id', () => {
		const parsed = parseArgs([
			'--a',
			'2026-09-16:2026-10-14',
			'--b',
			'2026-10-20:2026-11-17',
			'--site-id',
			'7'
		]);
		expect(parsed.siteId).toBe('7');
		expect(parsed.a?.from).toBe('2026-09-16');
		expect(parsed.b.to).toBe('2026-11-17');
		expect(parsed.events).toBe(false);
	});

	it('wirft bei Flag ohne Wert', () => {
		expect(() => parseArgs(['--a', '--b', '2026-10-20:2026-11-17'])).toThrow(/--a braucht/);
		expect(() =>
			parseArgs(['--a', '2026-09-16:2026-10-14', '--b', '2026-10-20:2026-11-17', '--site-id'])
		).toThrow(/--site-id braucht/);
	});

	it('wirft, wenn B nicht nach A beginnt oder sich überschneidet', () => {
		expect(() =>
			parseArgs(['--a', '2026-10-20:2026-11-17', '--b', '2026-09-16:2026-10-14'])
		).toThrow(/nach dem Ende von A/);
		expect(() =>
			parseArgs(['--a', '2026-09-16:2026-10-14', '--b', '2026-10-14:2026-11-10'])
		).toThrow(/nach dem Ende von A/);
	});

	it('--events verlangt nur --b', () => {
		const parsed = parseArgs(['--events', '--b', '2026-10-20:2026-11-17']);
		expect(parsed.events).toBe(true);
		expect(parsed.a).toBeUndefined();
	});
});

describe('lengthWarning', () => {
	it('warnt bei ungleicher Länge', () => {
		const w = lengthWarning(
			parsePeriod('2026-09-16:2026-10-14'),
			parsePeriod('2026-10-20:2026-11-10')
		);
		expect(w).toMatch(/29 Tage.*22/);
	});

	it('schweigt bei gleicher Länge', () => {
		expect(
			lengthWarning(parsePeriod('2026-09-16:2026-10-14'), parsePeriod('2026-10-20:2026-11-17'))
		).toBeNull();
	});
});

describe('buildEventsQuery', () => {
	const b = parsePeriod('2026-10-20:2026-11-17');

	it('zählt Landing-Events je action und page_type für Zeitraum B', () => {
		const sql = buildEventsQuery({ b, siteId: '42' });
		expect(sql).toContain('FROM events_v2');
		expect(sql).toContain("name = 'Landing'");
		expect(sql).toContain("indexOf(meta.key, 'action')");
		expect(sql).toContain("indexOf(meta.key, 'page_type')");
		expect(sql).toContain('GROUP BY page_type, action');
		expect(sql).toContain("toDateTime('2026-11-18 00:00:00', 'Europe/Berlin')");
	});

	it('lehnt eine nicht numerische Site-ID ab', () => {
		expect(() => buildEventsQuery({ b, siteId: 'x' })).toThrow(/site-id/);
	});

	it('wirft ohne --a oder --b', () => {
		expect(() => parseArgs(['--a', '2026-09-16:2026-10-14'])).toThrow(/--b/);
		expect(() => parseArgs(['--b', '2026-09-16:2026-10-14'])).toThrow(/--a/);
	});
});
