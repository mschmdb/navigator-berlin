<!--
	Rang-Einordnung + Deep-Link zurück in die Score-Übersicht
	(/umwelt-infrastruktur-score). Schließt die gegenseitige Verlinkung:
	Übersicht verlinkt runter (score-ranking-table), diese Komponente hoch.
	Graceful ohne Rang (DB-loser Prerender): zeigt neutralen Vergleichs-Link.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizedHref } from '$lib/i18n/localized-href.js';
	import { getLocale } from '$lib/paraglide/runtime';

	interface Props {
		readonly rang: number | null;
		readonly total: number;
		readonly view: 'kieze' | 'bezirke';
	}

	const { rang, total, view }: Props = $props();

	const localeOpts = $derived({ locale: getLocale() });

	const href = $derived(
		localizedHref(
			view === 'bezirke'
				? '/umwelt-infrastruktur-score?view=bezirke'
				: '/umwelt-infrastruktur-score'
		)
	);

	const label = $derived(
		typeof rang === 'number' && total > 0
			? m.score_rank_link_placed({ rang, total }, localeOpts)
			: m.score_rank_link_fallback(undefined, localeOpts)
	);
</script>

<a
	{href}
	data-testid="score-rank-link"
	class="hover:text-accent-strong text-accent underline underline-offset-2"
>
	{label}
</a>
