<!--
	Download-Link für das Plakat „Berlin in Quadraten: Alle Bezirke, alle Wahlen“ (#192). Das
	PDF liegt pro Sprache und Wahlart beim Build vor. Der Klick zählt als Plausible-Event wie
	bei „Punkt, Linie, Kiez“. Gedacht für die Gesamtansicht (#191) und die Beitragsseite (#190).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { getLocale } from '$lib/paraglide/runtime';
	import { trackEvent } from '$lib/utils/plausible.js';
	import type { WahlTyp } from '$lib/stories/wahl-quadrate/parteien.js';
	import { TEXTE } from '$lib/stories/wahl-quadrate/texte.js';
	import { STORY_INK } from '$lib/stories/tokens.js';

	interface Props {
		readonly typ: WahlTyp;
	}

	const { typ }: Props = $props();
	const locale = $derived(getLocale());
	const t = $derived(TEXTE[locale]);
	const href = $derived(resolve(`/stories/berlin-in-quadraten/${locale}/alle-bezirke-${typ}.pdf`));
</script>

<a
	data-testid="bq-plakat-link"
	onclick={() =>
		trackEvent('Stories PDF Download', {
			serie: 'berlin-in-quadraten',
			bezirk: 'alle',
			wahl: typ,
			sprache: locale
		})}
	{href}
	download="berlin-in-quadraten-alle-bezirke-{typ}-{locale}.pdf"
	class="inline-flex min-h-6 items-center border px-3 py-1 text-base font-semibold underline underline-offset-2"
	style:border-color={STORY_INK}
>
	{t.pdfLink(t.typ[typ])}
</a>
