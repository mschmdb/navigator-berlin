import { describe, expect, it, beforeEach } from 'vitest';
import {
	STORAGE_KEY,
	MAX_BOOKMARKS,
	emptyStore,
	loadBookmarks,
	saveBookmark,
	removeBookmark,
	clearAllBookmarks,
	isBookmarked,
	persistBookmarks,
	createBookmark,
	bookmarkToSuggestion
} from './bookmark-store.js';
import type { Bookmark, BookmarkStore } from './bookmark-schema.js';

class FakeStorage implements Storage {
	private map = new Map<string, string>();
	failOnSet = false;
	get length() {
		return this.map.size;
	}
	clear(): void {
		this.map.clear();
	}
	getItem(key: string): string | null {
		return this.map.get(key) ?? null;
	}
	key(index: number): string | null {
		return Array.from(this.map.keys())[index] ?? null;
	}
	removeItem(key: string): void {
		this.map.delete(key);
	}
	setItem(key: string, value: string): void {
		if (this.failOnSet) {
			const err = new DOMException('Quota', 'QuotaExceededError');
			throw err;
		}
		this.map.set(key, value);
	}
}

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
	return {
		id: '11111111-1111-4111-8111-111111111111',
		displayName: 'Wörther Str. 11, 10405 Berlin',
		lat: 52.535,
		lng: 13.418,
		bezirk: 'Pankow',
		postcode: '10405',
		createdAt: '2026-05-15T10:00:00.000Z',
		...overrides
	};
}

let storage: FakeStorage;
beforeEach(() => {
	storage = new FakeStorage();
});

describe('bookmark-store constants', () => {
	it('STORAGE_KEY versioned', () => {
		expect(STORAGE_KEY).toBe('navigator-berlin.bookmarks.v1');
	});

	it('MAX_BOOKMARKS = 50', () => {
		expect(MAX_BOOKMARKS).toBe(50);
	});

	it('emptyStore liefert valides Store-Object', () => {
		const store = emptyStore();
		expect(store.schemaVersion).toBe(1);
		expect(store.bookmarks).toEqual([]);
	});
});

describe('loadBookmarks', () => {
	it('null-storage (SSR) liefert empty', () => {
		const store = loadBookmarks(null);
		expect(store).toEqual({ schemaVersion: 1, bookmarks: [] });
	});

	it('leeres Storage liefert empty', () => {
		expect(loadBookmarks(storage)).toEqual(emptyStore());
	});

	it('valides Store wird gelesen', () => {
		const bm = makeBookmark();
		storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, bookmarks: [bm] }));
		const store = loadBookmarks(storage);
		expect(store.bookmarks).toHaveLength(1);
		expect(store.bookmarks[0]?.displayName).toBe(bm.displayName);
	});

	it('malformed JSON → empty fallback, Storage nicht überschrieben', () => {
		storage.setItem(STORAGE_KEY, 'not-json{{{');
		const store = loadBookmarks(storage);
		expect(store).toEqual(emptyStore());
		expect(storage.getItem(STORAGE_KEY)).toBe('not-json{{{');
	});

	it('Schema-Mismatch (fehlende Felder) → empty fallback', () => {
		storage.setItem(
			STORAGE_KEY,
			JSON.stringify({ schemaVersion: 1, bookmarks: [{ id: 'x', displayName: 'a' }] })
		);
		const store = loadBookmarks(storage);
		expect(store).toEqual(emptyStore());
	});

	it('falsche schemaVersion → empty fallback', () => {
		storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, bookmarks: [] }));
		const store = loadBookmarks(storage);
		expect(store).toEqual(emptyStore());
	});

	it('lat/lng außerhalb Berlin-Bbox → reject (empty fallback)', () => {
		const bm = makeBookmark({ lat: 48.137, lng: 11.575 });
		storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, bookmarks: [bm] }));
		expect(loadBookmarks(storage)).toEqual(emptyStore());
	});
});

describe('saveBookmark', () => {
	it('fügt Bookmark hinzu (immutable, neuer Store-Reference)', () => {
		const store = emptyStore();
		const bm = makeBookmark();
		const result = saveBookmark(store, bm);
		expect(result.bookmarks).toHaveLength(1);
		expect(store.bookmarks).toHaveLength(0);
	});

	it('Dedup: gleiche lat/lng (6-Dezimal) wird nicht doppelt gespeichert', () => {
		const store = emptyStore();
		const bm1 = makeBookmark({ id: '11111111-1111-4111-8111-111111111111' });
		const bm2 = makeBookmark({
			id: '22222222-2222-4222-8222-222222222222',
			lat: 52.5350001,
			lng: 13.4180001
		});
		const after1 = saveBookmark(store, bm1);
		const after2 = saveBookmark(after1, bm2);
		expect(after2.bookmarks).toHaveLength(1);
		expect(after2.bookmarks[0]?.id).toBe(bm1.id);
	});

	it('verschiedene Adressen werden separat gespeichert', () => {
		const a = makeBookmark({ id: '11111111-1111-4111-8111-111111111111', lat: 52.52, lng: 13.4 });
		const b = makeBookmark({
			id: '22222222-2222-4222-8222-222222222222',
			lat: 52.5,
			lng: 13.45
		});
		const result = saveBookmark(saveBookmark(emptyStore(), a), b);
		expect(result.bookmarks).toHaveLength(2);
	});

	it('Quota: 51. Bookmark wird abgelehnt', () => {
		let store: BookmarkStore = emptyStore();
		for (let i = 0; i < MAX_BOOKMARKS; i++) {
			const id = `${i.toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`;
			store = saveBookmark(store, makeBookmark({ id, lat: 52.5 + i * 0.001, lng: 13.4 }));
		}
		expect(store.bookmarks).toHaveLength(MAX_BOOKMARKS);
		const overflow = saveBookmark(
			store,
			makeBookmark({
				id: 'ffffffff-1111-4111-8111-111111111111',
				lat: 52.6,
				lng: 13.5
			})
		);
		expect(overflow.bookmarks).toHaveLength(MAX_BOOKMARKS);
	});
});

describe('removeBookmark', () => {
	it('entfernt Bookmark per ID', () => {
		const bm = makeBookmark();
		const store = saveBookmark(emptyStore(), bm);
		const result = removeBookmark(store, bm.id);
		expect(result.bookmarks).toHaveLength(0);
	});

	it('unbekannte ID lässt Liste unverändert', () => {
		const bm = makeBookmark();
		const store = saveBookmark(emptyStore(), bm);
		const result = removeBookmark(store, '99999999-9999-4999-8999-999999999999');
		expect(result.bookmarks).toHaveLength(1);
	});
});

describe('clearAllBookmarks', () => {
	it('liefert leeres Store', () => {
		const store = saveBookmark(emptyStore(), makeBookmark());
		const result = clearAllBookmarks();
		expect(result.bookmarks).toEqual([]);
		expect(result.schemaVersion).toBe(1);
	});
});

describe('isBookmarked', () => {
	it('exact-match per 6-Dezimal lat/lng', () => {
		const bm = makeBookmark({ lat: 52.535, lng: 13.418 });
		const store = saveBookmark(emptyStore(), bm);
		expect(isBookmarked(store, 52.535, 13.418)).toBe(true);
		expect(isBookmarked(store, 52.5350001, 13.4180001)).toBe(true);
		expect(isBookmarked(store, 52.54, 13.418)).toBe(false);
	});

	it('leeres Store: false', () => {
		expect(isBookmarked(emptyStore(), 52.5, 13.4)).toBe(false);
	});
});

describe('persistBookmarks', () => {
	it('Erfolgsfall: true + Storage geschrieben', () => {
		const store = saveBookmark(emptyStore(), makeBookmark());
		const ok = persistBookmarks(storage, store);
		expect(ok).toBe(true);
		const raw = storage.getItem(STORAGE_KEY);
		expect(raw).not.toBeNull();
		const parsed = JSON.parse(raw!);
		expect(parsed.bookmarks).toHaveLength(1);
	});

	it('Quota-Fehler: false, kein Throw', () => {
		storage.failOnSet = true;
		const store = saveBookmark(emptyStore(), makeBookmark());
		const ok = persistBookmarks(storage, store);
		expect(ok).toBe(false);
	});

	it('null-storage (SSR): false ohne Throw', () => {
		const store = saveBookmark(emptyStore(), makeBookmark());
		expect(persistBookmarks(null, store)).toBe(false);
	});
});

describe('createBookmark', () => {
	it('generiert valides Bookmark mit uuid + ISO-Datum', () => {
		const bm = createBookmark({
			displayName: 'Test',
			lat: 52.5,
			lng: 13.4,
			bezirk: 'Mitte',
			postcode: '10115'
		});
		expect(bm.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		);
		expect(bm.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
		expect(bm.displayName).toBe('Test');
	});
});

describe('bookmarkToSuggestion', () => {
	it('mappt Bookmark zu GeocodeSuggestion mit bookmark: prefix', () => {
		const bm = makeBookmark();
		const sugg = bookmarkToSuggestion(bm);
		expect(sugg.id).toBe(`bookmark:${bm.id}`);
		expect(sugg.type).toBe('bookmark');
		expect(sugg.addresstype).toBe('bookmark');
		expect(sugg.lat).toBe(bm.lat);
		expect(sugg.lng).toBe(bm.lng);
		expect(sugg.displayName).toBe(bm.displayName);
		expect(sugg.bezirk).toBe(bm.bezirk);
		expect(sugg.postcode).toBe(bm.postcode);
	});
});
