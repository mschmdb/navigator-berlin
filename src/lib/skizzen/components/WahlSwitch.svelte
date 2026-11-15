<script lang="ts">
	import { WAHL_ARTEN, type WahlArt } from '../wahl-types';
	let { value = $bindable() }: { value: WahlArt } = $props();
</script>

<fieldset class="flex flex-wrap items-center gap-2">
	<legend class="sr-only">Wahl</legend>
	{#each WAHL_ARTEN as w (w.id)}
		<label
			class="inline-flex min-h-8 cursor-pointer items-center rounded-full border border-rule-strong px-3 text-sm text-ink
			hover:border-accent has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-bg
			has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
		>
			<input type="radio" name="wahlart" class="sr-only" value={w.id} bind:group={value} />
			{w.label}<span class="sr-only">, {w.stimmtyp}</span>
		</label>
	{/each}
</fieldset>
