<script lang="ts">
	/**
	 * #127: Übergänge als Liste. Auf schmalen Bildschirmen sind die Bänder nur
	 * wenige Pixel hoch und kaum zu treffen; die Liste trägt dort die Details.
	 * Antippen hebt das passende Band in der Grafik hervor (gleicher Schlüssel).
	 */
	import { m } from '$lib/paraglide/messages.js';
	import { formatPercent } from '$lib/i18n/format.js';
	import { parteiColor } from '$lib/data/partei-farben.js';
	import { parteiDisplayName } from './winner-map-data.js';
	import type { UebergangsGruppe } from './sankey-liste.js';

	type Props = {
		gruppen: readonly UebergangsGruppe[];
		selectedKey: string | null;
		onToggle: (key: string) => void;
	};
	let { gruppen, selectedKey, onToggle }: Props = $props();
</script>

<section data-testid="sankey-uebergaenge-liste" class="flex flex-col gap-3">
	<h3 class="text-sm font-semibold text-ink">{m.wahl_portal_sankey_table_caption()}</h3>
	<p class="text-dense-meta text-ink-subtle">{m.wahl_portal_sankey_liste_hinweis()}</p>
	{#each gruppen as gruppe (gruppe.nachJahr)}
		<div class="flex flex-col">
			<h4
				class="border-b border-rule pb-1 text-dense-meta font-semibold text-ink-muted tabular-nums"
			>
				{m.wahl_portal_sankey_jahresspanne({ von: gruppe.vonJahr, bis: gruppe.nachJahr })}
			</h4>
			<ul class="flex flex-col">
				{#each gruppe.eintraege as eintrag (eintrag.key)}
					{@const pressed = selectedKey === eintrag.key}
					<li class="border-b border-rule">
						<button
							type="button"
							data-testid="sankey-liste-eintrag"
							aria-pressed={pressed}
							onclick={() => onToggle(eintrag.key)}
							class="flex min-h-(--target-min) w-full items-center gap-2 py-1.5 text-left text-sm text-ink"
							class:bg-bg-muted={pressed}
						>
							<span
								aria-hidden="true"
								class="size-2 shrink-0 rounded-full"
								style:background-color={parteiColor(eintrag.von)}
							></span>
							<span class="min-w-0 flex-1 font-medium">
								{parteiDisplayName(eintrag.von)} → {parteiDisplayName(eintrag.nach)}
							</span>
							<span class="shrink-0 text-ink-muted tabular-nums">
								{m.wahl_portal_sankey_liste_eintrag({
									value: eintrag.value,
									anteil: formatPercent(eintrag.anteil)
								})}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</section>
