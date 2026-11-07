<!--
	Einstellungen der Gesamtansicht (#191), Runde 20b: Raster mit drei Spalten (Auswahl
	oben, Darstellung darunter), „Partei hervorheben“ ohne Tooltip, Statuszeile mit
	„Zurücksetzen“ rechts und „Alles einblenden“ nur bei ausgeblendeten Bezirken oder Wahlen.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { PARTY_COLORS } from '$lib/stories/wahl-quadrate/farben';
	import {
		alleEinblenden,
		hatAusgeblendet,
		statusZahlen,
		toggleHervorheben
	} from '$lib/stories/wahl-quadrate/gesamt';
	import { ORDER, type PartyKey } from '$lib/stories/wahl-quadrate/parteien';
	import {
		DEFAULT_URL_STATE,
		type GesamtSort,
		type GesamtState,
		type GesamtWahl,
		type Reihenfolge
	} from '$lib/stories/wahl-quadrate/url-state';
	import Auswahl from './auswahl.svelte';
	import { ganzeProzent } from './format';
	import Knopf from './knopf.svelte';
	import { partyName } from './namen';
	import Regler from './regler.svelte';
	import Schalter from './schalter.svelte';
	import Segmente from './segmente.svelte';

	interface Props {
		readonly state: GesamtState;
		readonly onchange: (next: GesamtState) => void;
	}

	let { state: s, onchange }: Props = $props();

	const id = $props.id();

	const set = (patch: Partial<GesamtState>): void => onchange({ ...s, ...patch });

	const wahlItems = $derived<{ value: GesamtWahl; text: string; help: string }[]>([
		{ value: 'agh', text: m.bq_all_wahl_agh(), help: m.bq_all_wahl_agh_help() },
		{ value: 'btw', text: m.bq_all_wahl_btw(), help: m.bq_all_wahl_btw_help() },
		{ value: 'both', text: m.bq_all_wahl_both(), help: m.bq_all_wahl_both_help() }
	]);

	const sortItems = $derived.by(() => {
		const items: { value: GesamtSort; text: string }[] = [
			{ value: 'nr', text: m.bq_all_sort_nr() },
			{ value: 'alpha', text: m.bq_all_sort_alpha() },
			{ value: 'turnout', text: m.bq_all_sort_turnout() }
		];
		if (s.hervorheben)
			items.push({
				value: 'party',
				text: m.bq_all_sort_party({ party: partyName(s.hervorheben) })
			});
		return items;
	});

	const ordItems = $derived<{ value: Reihenfolge; text: string; help: string }[]>([
		{ value: 'fixed', text: m.bq_all_order_fixed(), help: m.bq_all_order_fixed_help() },
		{ value: 'size', text: m.bq_all_order_size(), help: m.bq_all_order_size_help() }
	]);

	function chipText(k: PartyKey): string {
		if (k !== 'rest') return partyName(k);
		return s.schwelle > 0
			? m.bq_all_chip_grey({ threshold: ganzeProzent(s.schwelle) })
			: m.bq_all_chip_grey_zero();
	}

	function chipClick(k: PartyKey): void {
		if (k === 'rest') set({ nurGrau: !s.nurGrau });
		else onchange(toggleHervorheben(s, k));
	}

	const statusText = $derived.by(() => {
		const z = statusZahlen(s);
		return [
			z.bezirke === 1
				? m.bq_all_status_districts_one()
				: m.bq_all_status_districts({ count: z.bezirke }),
			z.wahlen === 1
				? m.bq_all_status_elections_one()
				: m.bq_all_status_elections({ count: z.wahlen }),
			m.bq_all_status_threshold({ threshold: ganzeProzent(s.schwelle) }),
			s.hervorheben ? m.bq_all_status_highlight({ party: partyName(s.hervorheben) }) : '',
			s.nurGrau ? m.bq_all_status_nogrey() : ''
		]
			.filter(Boolean)
			.join(', ');
	});
</script>

<div class="bq-wsettings" role="group" aria-label={m.bq_all_toolbar()}>
	<div class="bq-wbar">
		<Segmente
			label={m.bq_all_wahl()}
			items={wahlItems}
			value={s.wahl}
			onchange={(wahl) => set({ wahl })}
		/>
		<Auswahl
			label={m.bq_all_sort()}
			items={sortItems}
			value={s.sort}
			onchange={(sort) => set({ sort })}
		/>
		<Segmente
			label={m.bq_all_order()}
			items={ordItems}
			value={s.reihenfolge}
			onchange={(reihenfolge) => set({ reihenfolge })}
		/>
		<Regler
			label={m.bq_all_threshold()}
			min={0}
			max={10}
			value={s.schwelle}
			format={(v) => ganzeProzent(v)}
			help={m.bq_all_threshold_help()}
			oninput={(schwelle) => set({ schwelle })}
		/>
		<Schalter
			label={m.bq_all_nonvoters()}
			text={m.bq_all_nonvoters_text()}
			pressed={s.papier}
			help={m.bq_all_nonvoters_help()}
			onchange={(papier) => set({ papier })}
		/>
		<Schalter
			label={m.bq_all_numbers()}
			text={m.bq_all_numbers_text()}
			pressed={s.zahlen}
			help={m.bq_all_numbers_help()}
			onchange={(zahlen) => set({ zahlen })}
		/>
	</div>

	<div class="bq-wchips">
		<span class="bq-lab" id="{id}-hl">{m.bq_all_highlight()}</span>
		<ul class="bq-chips" aria-labelledby="{id}-hl">
			{#each ORDER as k (k)}
				<li>
					<button
						type="button"
						class="bq-btn bq-chip"
						aria-pressed={k === 'rest' ? s.nurGrau : s.hervorheben === k}
						onclick={() => chipClick(k)}
					>
						<span class="bq-sw" style:background={PARTY_COLORS[k]} aria-hidden="true"></span>
						<span>{chipText(k)}</span>
						{#if k === 'rest'}<span class="bq-sr">{m.bq_all_chip_grey_hide()}</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	</div>

	<div class="bq-wstat">
		<p class="bq-wsum" role="status">{statusText}</p>
		<div class="bq-wact">
			{#if hatAusgeblendet(s)}
				<Knopf
					text={m.bq_all_show_all()}
					help={m.bq_all_show_all_help()}
					onclick={() => onchange(alleEinblenden(s))}
				/>
			{/if}
			<Knopf
				text={m.bq_all_reset()}
				help={m.bq_all_reset_help()}
				onclick={() => onchange(DEFAULT_URL_STATE.gesamt)}
			/>
		</div>
	</div>
</div>
