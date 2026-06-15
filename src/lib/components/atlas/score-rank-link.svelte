<!--
	Rang-Einordnung + Deep-Link zurück in die Score-Übersicht
	(/umwelt-infrastruktur-score). Schließt die gegenseitige Verlinkung:
	Übersicht verlinkt runter (score-ranking-table), diese Komponente hoch.
	Graceful ohne Rang (DB-loser Prerender): zeigt neutralen Vergleichs-Link.
-->
<script lang="ts">
	interface Props {
		readonly rang: number | null;
		readonly total: number;
		readonly view: 'kieze' | 'bezirke';
	}

	const { rang, total, view }: Props = $props();

	const href = $derived(
		view === 'bezirke'
			? '/umwelt-infrastruktur-score?view=bezirke'
			: '/umwelt-infrastruktur-score'
	);

	const label = $derived(
		typeof rang === 'number' && total > 0
			? `Platz ${rang} von ${total} im Umwelt- & Infrastruktur-Score →`
			: 'Im Umwelt- & Infrastruktur-Score vergleichen →'
	);
</script>

<a
	{href}
	data-testid="score-rank-link"
	class="text-accent underline underline-offset-2 hover:text-accent-strong"
>
	{label}
</a>
