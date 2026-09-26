<script lang="ts">
	import type { WahlPortalListStatus } from '$lib/state/wahl-portal-context.svelte.js';
	import { m } from '$lib/paraglide/messages.js';

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
		<span data-testid="portal-datenstand-loading">{m.wahl_portal_datenstand_laden()}</span>
	{:else if status === 'error'}
		<span data-testid="portal-datenstand-error">{m.wahl_portal_datenstand_nicht_verfuegbar()}</span>
	{:else if minJahr !== null && maxJahr !== null}
		<span data-testid="portal-datenstand-text">
			{m.wahl_portal_datenstand_spanne({ min: minJahr, max: maxJahr })} ·
			{m.wahl_label_source_bundeswahlleiterin()} ·
			{m.wahl_label_source_amt_fuer_statistik()}
		</span>
	{:else}
		<span data-testid="portal-datenstand-empty">
			{m.wahl_portal_datenstand_empty()}
		</span>
	{/if}
</p>
