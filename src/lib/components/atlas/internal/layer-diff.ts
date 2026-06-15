export interface LayerDiff {
	readonly toAdd: readonly string[];
	readonly toRemove: readonly string[];
}

export function diffLayerSlugs(current: readonly string[], next: readonly string[]): LayerDiff {
	const currentSet = new Set(current);
	const nextSet = new Set(next);
	const toAdd: string[] = [];
	const toRemove: string[] = [];
	for (const slug of next) {
		if (!currentSet.has(slug)) toAdd.push(slug);
	}
	for (const slug of current) {
		if (!nextSet.has(slug)) toRemove.push(slug);
	}
	return { toAdd, toRemove };
}

export function sourceIdFor(slug: string): string {
	return `navigator-source-${slug}`;
}

export function layerIdFor(slug: string): string {
	return `navigator-layer-${slug}`;
}
