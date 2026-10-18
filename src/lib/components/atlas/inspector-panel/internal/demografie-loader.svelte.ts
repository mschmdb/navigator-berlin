import type { UiState } from '$lib/state/ui-context.svelte.js';
import { getDemografieByScopeAt } from '$lib/data/get-kiez-demografie.js';
import type { DemografieByScope } from './demografie-types.js';

type LevelSlugs = { readonly kiezSlug: string | null; readonly bezirkSlug: string | null };

export interface DemografieLoader {
	readonly byScope: DemografieByScope | null;
	/** #152: lädt gerade für die aktuelle Adresse; der alte Wert bleibt bis dahin stehen. */
	readonly loading: boolean;
}

/**
 * Story 10.5: Bevölkerungsprofil pro Scope (Standort/Kiez/Bezirk) laden.
 * #152: beim Adresswechsel bleibt das alte Profil stehen, bis das neue da ist.
 * Nur die jüngste Anfrage darf das Ergebnis setzen.
 */
export function useDemografieLoader(ui: UiState, level: LevelSlugs): DemografieLoader {
	let byScope = $state<DemografieByScope | null>(null);
	let loading = $state(false);
	let request = 0;

	$effect(() => {
		const addr = ui.selectedAddress;
		const current = ++request;
		if (!addr) {
			byScope = null;
			loading = false;
			ui.demografieScope = 'standort';
			return;
		}
		const { lat, lng } = addr;
		const kiezSlug = level.kiezSlug;
		const bezirkSlug = level.bezirkSlug;
		loading = true;
		void getDemografieByScopeAt(lat, lng, kiezSlug, bezirkSlug)
			.then((d) => {
				if (current !== request) return;
				byScope = d;
				loading = false;
				// Scope auf Standort zurücksetzen, wenn der gewählte Bezug hier keine Daten hat.
				if (
					(ui.demografieScope === 'kiez' && !d.kiez) ||
					(ui.demografieScope === 'bezirk' && !d.bezirk)
				) {
					ui.demografieScope = 'standort';
				}
			})
			.catch(() => {
				if (current !== request) return;
				byScope = null;
				loading = false;
			});
	});

	return {
		get byScope() {
			return byScope;
		},
		get loading() {
			return loading;
		}
	};
}
