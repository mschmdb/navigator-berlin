import * as v from 'valibot';
import type { GeocodeSuggestion } from '$lib/data';
import { BookmarkStoreSchema, type Bookmark, type BookmarkStore } from './bookmark-schema.js';

export const STORAGE_KEY = 'navigator-berlin.bookmarks.v1';
export const MAX_BOOKMARKS = 50;
const COORD_PRECISION = 6;

export function emptyStore(): BookmarkStore {
	return { schemaVersion: 1, bookmarks: [] };
}

export function loadBookmarks(storage: Storage | null): BookmarkStore {
	if (!storage) return emptyStore();
	const raw = storage.getItem(STORAGE_KEY);
	if (raw === null) return emptyStore();
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		console.warn('[bookmark-store] malformed JSON in storage, falling back to empty');
		return emptyStore();
	}
	const result = v.safeParse(BookmarkStoreSchema, parsed);
	if (!result.success) {
		console.warn('[bookmark-store] schema mismatch, falling back to empty');
		return emptyStore();
	}
	return result.output;
}

export function saveBookmark(store: BookmarkStore, bookmark: Bookmark): BookmarkStore {
	if (isBookmarked(store, bookmark.lat, bookmark.lng)) return store;
	if (store.bookmarks.length >= MAX_BOOKMARKS) return store;
	return {
		schemaVersion: 1,
		bookmarks: [...store.bookmarks, bookmark]
	};
}

export function removeBookmark(store: BookmarkStore, id: string): BookmarkStore {
	const next = store.bookmarks.filter((b) => b.id !== id);
	if (next.length === store.bookmarks.length) return store;
	return { schemaVersion: 1, bookmarks: next };
}

export function clearAllBookmarks(): BookmarkStore {
	return emptyStore();
}

export function isBookmarked(store: BookmarkStore, lat: number, lng: number): boolean {
	const latKey = lat.toFixed(COORD_PRECISION);
	const lngKey = lng.toFixed(COORD_PRECISION);
	return store.bookmarks.some(
		(b) => b.lat.toFixed(COORD_PRECISION) === latKey && b.lng.toFixed(COORD_PRECISION) === lngKey
	);
}

export function persistBookmarks(storage: Storage | null, store: BookmarkStore): boolean {
	if (!storage) return false;
	try {
		storage.setItem(STORAGE_KEY, JSON.stringify(store));
		return true;
	} catch {
		return false;
	}
}

export interface BookmarkInput {
	displayName: string;
	lat: number;
	lng: number;
	bezirk?: string;
	postcode?: string;
}

export function createBookmark(input: BookmarkInput): Bookmark {
	return {
		id: crypto.randomUUID(),
		displayName: input.displayName.slice(0, 200),
		lat: input.lat,
		lng: input.lng,
		bezirk: input.bezirk,
		postcode: input.postcode,
		createdAt: new Date().toISOString()
	};
}

export function bookmarkToSuggestion(bookmark: Bookmark): GeocodeSuggestion {
	return {
		id: `bookmark:${bookmark.id}`,
		displayName: bookmark.displayName,
		lat: bookmark.lat,
		lng: bookmark.lng,
		type: 'bookmark',
		addresstype: 'bookmark',
		bezirk: bookmark.bezirk,
		postcode: bookmark.postcode
	};
}

export type { Bookmark, BookmarkStore };
