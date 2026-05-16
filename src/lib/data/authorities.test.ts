import { describe, expect, it } from 'vitest';
import {
	AUTHORITIES,
	AUTHORITY_KEYS,
	resolveAuthority,
	type AuthorityKey,
	type AuthorityMeta
} from './authorities.js';

describe('AUTHORITIES · Schema + Coverage', () => {
	it('jeder Authority-Eintrag hat mindestens DE-String', () => {
		for (const key of AUTHORITY_KEYS) {
			const meta = AUTHORITIES[key];
			expect(meta, `Key ${key}`).toBeDefined();
			expect(meta.de, `DE-String ${key}`).toBeTruthy();
			expect(typeof meta.de === 'string').toBe(true);
			expect(meta.de.length).toBeGreaterThan(2);
		}
	});

	it('alle Keys in AUTHORITY_KEYS sind Keys in AUTHORITIES', () => {
		for (const key of AUTHORITY_KEYS) {
			expect(Object.prototype.hasOwnProperty.call(AUTHORITIES, key)).toBe(true);
		}
	});

	it('AUTHORITIES enthält keine zusätzlichen Keys ausserhalb von AUTHORITY_KEYS', () => {
		const extraKeys = Object.keys(AUTHORITIES).filter(
			(k) => !AUTHORITY_KEYS.includes(k as AuthorityKey)
		);
		expect(extraKeys).toEqual([]);
	});
});

describe('resolveAuthority', () => {
	it('liefert DE-String per Default', () => {
		const result = resolveAuthority('odis');
		expect(result).toMatch(/ODIS/);
	});

	it('liefert DE-String wenn locale="de"', () => {
		const result = resolveAuthority('senatsvw-umwelt', 'de');
		expect(result).toMatch(/Senatsverwaltung/);
	});

	it('fällt auf DE zurück wenn EN-String fehlt (Phase 3 deferred)', () => {
		const de = resolveAuthority('odis', 'de');
		const en = resolveAuthority('odis', 'en');
		expect(en).toBe(de);
	});

	it('alle Keys lassen sich auflösen ohne Fehler', () => {
		for (const key of AUTHORITY_KEYS) {
			const resolved = resolveAuthority(key);
			expect(resolved, `Key ${key}`).toBeTruthy();
			expect(typeof resolved).toBe('string');
		}
	});
});

describe('Authority-Phase-3-Bereitschaft', () => {
	it('Schema akzeptiert optionales EN-Feld pro Eintrag', () => {
		// Test prüft Type-Compat: EN ist optional, kann später ohne Schema-Bruch
		// gesetzt werden. Aktuell Phase 1 DE-only → keine EN-Werte vorhanden.
		const sample: AuthorityMeta = AUTHORITIES.odis;
		expect(sample.de).toBeTruthy();
		// EN darf undefined sein (Phase 1) ODER ein String sein (Phase 3)
		const enType = typeof sample.en;
		expect(['undefined', 'string']).toContain(enType);
	});

	it('Phase-1-Lock: aktuell sind keine EN-Strings gesetzt (Phase 3 deferred)', () => {
		const withEn = AUTHORITY_KEYS.filter((key) => (AUTHORITIES[key] as AuthorityMeta).en !== undefined);
		expect(withEn).toEqual([]);
	});
});
