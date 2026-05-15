import * as v from 'valibot';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const BookmarkSchema = v.object({
	id: v.pipe(v.string(), v.regex(UUID_REGEX)),
	displayName: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	lat: v.pipe(v.number(), v.minValue(52.3), v.maxValue(52.7)),
	lng: v.pipe(v.number(), v.minValue(13.0), v.maxValue(13.8)),
	bezirk: v.optional(v.pipe(v.string(), v.maxLength(100))),
	postcode: v.optional(v.pipe(v.string(), v.regex(/^\d{5}$/))),
	createdAt: v.pipe(v.string(), v.isoTimestamp())
});

export const BookmarkStoreSchema = v.object({
	schemaVersion: v.literal(1),
	bookmarks: v.pipe(v.array(BookmarkSchema), v.maxLength(50))
});

export type Bookmark = v.InferOutput<typeof BookmarkSchema>;
export type BookmarkStore = v.InferOutput<typeof BookmarkStoreSchema>;
