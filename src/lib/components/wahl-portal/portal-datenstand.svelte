<script lang="ts">
	import type { WahlPortalListStatus } from '$lib/state/wahl-portal-context.svelte.js';

	type Props = {
		minJahr: number | null;
		maxJahr: number | null;
		status: WahlPortalListStatus;
	};

	let { minJahr, maxJahr, status }: Props = $props();
</script>

<p
	data-testid="portal-datenstand"
	class="flex flex-wrap items-baseline gap-x-2 font-mono text-[10px] text-ink-subtle"
>
	{#if status === 'loading' || status === 'idle'}
		<span data-testid="portal-datenstand-loading">Wahl-Daten laden.</span>
	{:else if status === 'error'}
		<span data-testid="portal-datenstand-error">Wahl-Daten aktuell nicht verfügbar.</span>
	{:else if minJahr !== null && maxJahr !== null}
		<span data-testid="portal-datenstand-text">
			Datenstand: Wahlen {minJahr}–{maxJahr} · Bundeswahlleiterin · Amt für Statistik Berlin-Brandenburg
		</span>
	{:else}
		<span data-testid="portal-datenstand-empty">
			Wahl-Daten werden mit dem nächsten Build freigeschaltet.
		</span>
	{/if}
</p>
