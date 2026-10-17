<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { Quelle } from '$lib/kaelte/hilfe-dienste.js';

	let { quellen }: { quellen: readonly Quelle[] } = $props();
</script>

<!-- Trenner als String-Ausdruck: Ein Komma mit Zeilenumbruch im {#if} verliert beim Kompilieren das Leerzeichen. -->
<p data-testid="kaelte-quellen" class="font-sans text-xs text-ink-subtle">
	{m.kaelte_quellen()}:
	{#each quellen as quelle, i (quelle.label)}{#if i > 0}{', '}{/if}{#if quelle.url}<a
				href={quelle.url}
				target="_blank"
				rel="noopener noreferrer"
				class="underline underline-offset-2 hover:text-ink">{quelle.label}</a
			><span class="sr-only"> {m.kaelte_new_tab_hint()}</span>{:else}{quelle.label}{/if}{/each}
</p>
