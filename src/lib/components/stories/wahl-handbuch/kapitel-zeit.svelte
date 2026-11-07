<!--
	Kapitel 5 „Ein Bezirk über die Zeit“ (#190): Oben gleitet ein Quadrat von Wahl zu Wahl,
	darunter stehen alle Wahlen nebeneinander. Die Karte hat feste Maße, damit wechselnde Texte
	nichts verschieben. Mit `prefers-reduced-motion` entfallen Karte und Pause-Knopf.
	Bezirk und Wahl kommen von außen (URL) und gehen über `onzeit` zurück.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { Auswahl, Knopf, Segmente } from '$lib/components/stories/quadrate';
	import { m } from '$lib/paraglide/messages.js';
	import type { HandbuchDaten } from '$lib/stories/wahl-quadrate/handbuch-daten';
	import type { OrderMode } from '$lib/stories/wahl-quadrate/layout';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien';
	import type { ZeitState } from '$lib/stories/wahl-quadrate/url-state';
	import Karte from './karte.svelte';
	import Reihe from './reihe.svelte';
	import Reihenfolge from './reihenfolge.svelte';
	import { typName } from './texte';
	import { zeitpunkt } from './zeitleiste';

	interface Props {
		readonly daten: HandbuchDaten;
		readonly zeit: ZeitState;
		readonly onzeit?: (zeit: ZeitState) => void;
	}

	let { daten, zeit, onzeit }: Props = $props();

	let gewaehlt = $state<ZeitState | null>(null);
	const aktuell = $derived(gewaehlt ?? zeit);
	const bezirk = $derived(daten.bezirke.find((b) => b.slug === aktuell.bezirk) ?? daten.bezirke[0]);
	const wahlen = $derived(daten.wahlen.filter((w) => w.typ === aktuell.wahl));
	let order = $state<OrderMode>('fixed');

	const reduced = new MediaQuery('prefers-reduced-motion: reduce');
	let playing = $state(true);
	let time = $state(0);

	$effect(() => {
		if (!playing || reduced.current) return;
		let last = performance.now();
		let raf = requestAnimationFrame(function tick(now: number): void {
			time += Math.min(0.1, (now - last) / 1000);
			last = now;
			raf = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(raf);
	});

	const zp = $derived(zeitpunkt(time, wahlen.length));
	const shown = $derived(wahlen[zp.shown]);
	const morph = $derived(
		zp.t > 0
			? {
					from: bezirk.wahlen[wahlen[zp.from].slug].e,
					to: bezirk.wahlen[wahlen[zp.to].slug].e,
					t: zp.t
				}
			: null
	);

	function setze(next: ZeitState): void {
		gewaehlt = next;
		time = 0;
		onzeit?.(next);
	}
</script>

<div class="hb-ctls">
	<Auswahl
		label={m.bq_hb_bezirk_label()}
		items={daten.bezirke.map((b) => ({ value: b.slug, text: b.name }))}
		value={aktuell.bezirk}
		onchange={(v) => setze({ ...aktuell, bezirk: v })}
	/>
	<Segmente
		label={m.bq_hb_wahl_label()}
		items={(['agh', 'btw'] as const).map((t) => ({ value: t, text: typName(t) }))}
		value={aktuell.wahl}
		onchange={(v: WahlTyp) => setze({ ...aktuell, wahl: v })}
	/>
	<Reihenfolge bind:value={order} />
	{#if !reduced.current}
		<div class="bq-ctl">
			<span class="bq-lab">{m.bq_hb_motion_label()}</span>
			<Knopf
				text={playing ? m.bq_hb_motion_pause() : m.bq_hb_motion_play()}
				help={m.bq_hb_motion_help()}
				onclick={() => (playing = !playing)}
			/>
		</div>
	{/if}
</div>
<div class="hb-stage">
	{#if !reduced.current}
		<div class="anim" data-testid="hb-anim">
			<Karte
				name={bezirk.name}
				typ={shown.typ}
				jahr={shown.jahr}
				ergebnis={bezirk.wahlen[shown.slug]}
				{order}
				{morph}
				fixed
			/>
		</div>
	{/if}
	<div class="ser">
		<Reihe {bezirk} {wahlen} {order} />
		{#if aktuell.wahl === 'btw'}
			<p class="hb-note">{m.bq_hb_btw21_note()}</p>
		{/if}
	</div>
</div>

<style>
	.anim {
		flex: 0 0 auto;
		width: min(100%, 400px);
	}
	.ser {
		flex: 1 1 100%;
		margin-top: var(--hb-s3);
		padding-top: var(--hb-s3);
		border-top: 1px solid var(--hb-ink);
	}
	.hb-note {
		margin: var(--hb-s3) 0 0;
		font-size: 14px;
		color: var(--hb-muted);
		max-width: 60ch;
	}
</style>
