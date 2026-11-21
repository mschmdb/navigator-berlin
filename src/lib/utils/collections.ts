/**
 * Kleine Collection-Helfer. Die Maps und Sets sind lokale, nicht reaktive Werte.
 * Sie liegen bewusst in einer .ts-Datei, damit Komponenten keine SvelteMap/SvelteSet brauchen.
 */

export function groupBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
	const groups = new Map<K, T[]>();
	for (const item of items) {
		const k = key(item);
		const bucket = groups.get(k);
		if (bucket) bucket.push(item);
		else groups.set(k, [item]);
	}
	return groups;
}

export function indexBy<T, K>(items: readonly T[], key: (item: T) => K): Map<K, T> {
	const index = new Map<K, T>();
	for (const item of items) index.set(key(item), item);
	return index;
}

export function unique<T>(items: readonly T[]): T[] {
	return [...new Set(items)];
}
