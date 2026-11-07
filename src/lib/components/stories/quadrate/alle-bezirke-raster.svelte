<!--
	Raster einer Wahlart in der Gesamtansicht (#191): Jahreszeile, darunter je Bezirk eine
	Reihe Quadrate. Jahres- und Bezirksknöpfe blenden aus und ein, ihre Tooltips öffnen nach
	unten. Ausgeblendete Wahlen behalten eine schmale Spalte, ausgeblendete Bezirke ihren Namen.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { toElectionShares } from '$lib/stories/wahl-quadrate/eingabe';
	import {
		bezirkAn,
		jahrAn,
		sichtbareJahre,
		toggleBezirk,
		toggleJahr
	} from '$lib/stories/wahl-quadrate/gesamt';
	import { JAHRE, wahlSlug, type WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { BezirkWahlen } from '$lib/stories/wahl-quadrate/types';
	import type { GesamtState } from '$lib/stories/wahl-quadrate/url-state';
	import Hinweis from './hinweis.svelte';
	import Quadrat from './quadrat.svelte';

	interface Props {
		readonly typ: WahlTyp;
		readonly typName: string;
		readonly state: GesamtState;
		/** Bereits sortiert. */
		readonly bezirke: readonly BezirkWahlen[];
		readonly alleNr: readonly string[];
		readonly schmal: boolean;
		/** Überschrift zeigen, wenn beide Wahlarten untereinander stehen. */
		readonly titel: boolean;
		readonly onchange: (next: GesamtState) => void;
	}

	let { typ, typName, state: s, bezirke, alleNr, schmal, titel, onchange }: Props = $props();

	const jahre = $derived(JAHRE[typ]);
	const anzahlAn = $derived(sichtbareJahre(s, typ).length);
	const spalten = $derived(
		jahre.map((y) => (jahrAn(s, typ, y) ? 'var(--bq-sq)' : 'var(--bq-off)')).join(' ')
	);
	const kurz = (y: number): string => String(y).slice(2);
</script>

<section class="bq-wset" aria-label={titel ? undefined : typName}>
	{#if titel}<h3 class="bq-wtitle">{typName}</h3>{/if}
	<div class="bq-wrow bq-whead">
		<div></div>
		<div class="bq-hdr" style:grid-template-columns={spalten}>
			{#each jahre as jahr (jahr)}
				{@const an = jahrAn(s, typ, jahr)}
				<Hinweis
					text={an
						? m.bq_all_year_hide_help({ year: jahr })
						: m.bq_all_year_show_help({ year: jahr })}
					below
				>
					{#snippet children(describedBy)}
						<button
							type="button"
							class="bq-ybtn"
							aria-pressed={an}
							aria-describedby={describedBy}
							onclick={() => onchange(toggleJahr(s, typ, jahr))}
							><span class="bq-sr">{typName}&#32;</span>{an
								? jahr
								: schmal
									? kurz(jahr)
									: m.bq_all_year_off({ short: kurz(jahr) })}</button
						>
					{/snippet}
				</Hinweis>
			{/each}
		</div>
	</div>
	{#each bezirke as b (b.nr)}
		{@const an = bezirkAn(s, b.nr)}
		<div class="bq-wrow" class:off={!an}>
			<div class="bq-rl">
				<Hinweis
					text={an
						? m.bq_all_district_hide_help({ name: b.name })
						: m.bq_all_district_show_help({ name: b.name })}
					below
				>
					{#snippet children(describedBy)}
						<button
							type="button"
							class="bq-rbtn"
							aria-pressed={an}
							aria-describedby={describedBy}
							onclick={() => onchange(toggleBezirk(s, b.nr, alleNr))}
							>{an ? `${b.nr} ${b.name}` : m.bq_all_district_off({ name: b.name })}</button
						>
					{/snippet}
				</Hinweis>
			</div>
			{#if an && anzahlAn > 0}
				<div class="bq-series" style:grid-template-columns={spalten}>
					{#each jahre as jahr (jahr)}
						{@const slug = wahlSlug(typ, jahr)}
						{@const z = slug ? b.wahlen[slug] : undefined}
						{#if z && jahrAn(s, typ, jahr)}
							<div class="bq-cell">
								<Quadrat
									election={toElectionShares(z)}
									title={m.bq_all_square_title({ district: b.name, set: typName, year: jahr })}
									threshold={s.schwelle / 100}
									order={s.reihenfolge}
									turnout={z.wahlbeteiligung}
									nonVoters={s.papier}
									numbers={s.zahlen}
									insideOnly={schmal}
									highlight={s.hervorheben}
									hideGrey={s.nurGrau}
									table={false}
								/>
							</div>
						{:else}
							<div class="bq-ph"></div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</section>
