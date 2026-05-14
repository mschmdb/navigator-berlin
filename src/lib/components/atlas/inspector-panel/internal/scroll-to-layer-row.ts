export interface ScrollToLayerOptions {
	readonly reducedMotion?: boolean;
}

/**
 * Story 1.15 AC-3: nach Pin-Click oder Inspector-Open Inspector zur passenden
 * Layer-Hit-Row scrollen. Pure-Function fuer Testbarkeit; Selector matcht das
 * data-Attribut auf LayerHitRow-root.
 */
export function scrollToLayerHitRow(
	container: HTMLElement | null,
	slug: string | null,
	options: ScrollToLayerOptions = {}
): boolean {
	if (!container || !slug) return false;
	const row = container.querySelector<HTMLElement>(
		`[data-testid="layer-hit-row"][data-layer="${slug}"]`
	);
	if (!row) return false;
	row.scrollIntoView({
		behavior: options.reducedMotion ? 'auto' : 'smooth',
		block: 'center'
	});
	return true;
}
