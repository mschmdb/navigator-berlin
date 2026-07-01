<script lang="ts">
	import { Mail, ExternalLink } from '@lucide/svelte';
	import { buildOptOutMailto } from '$lib/utils/contact.js';
	import { KUEHLE_ORTE_QUELLEN, KUEHLE_ORTE_HALTUNG } from './transparenz-content.js';

	const optOutUrl = buildOptOutMailto();
</script>

<section aria-labelledby="transparenz-h" class="flex flex-col gap-4">
	<h2 id="transparenz-h" class="font-sans text-2xl font-semibold text-ink">
		Transparenz und Quellen
	</h2>

	<p class="font-serif text-base leading-relaxed text-ink-muted">
		{KUEHLE_ORTE_HALTUNG}
	</p>

	<ul class="flex flex-col gap-3">
		{#each KUEHLE_ORTE_QUELLEN as quelle (quelle.name)}
			<li class="flex flex-col gap-0.5 rounded border border-rule bg-bg-elevated px-3 py-2.5">
				<span class="flex flex-wrap items-baseline gap-2">
					<span class="font-sans text-sm font-medium text-ink">{quelle.name}</span>
					{#if quelle.lizenz}
						<span class="font-mono text-[11px] text-ink-subtle">{quelle.lizenz}</span>
					{/if}
				</span>
				<span class="font-serif text-sm text-ink-muted">{quelle.detail}</span>
			</li>
		{/each}
	</ul>

	<p class="font-serif text-sm text-ink-muted">
		Die vollständige Lizenz-Übersicht steht auf der
		<a
			data-testid="transparenz-lizenzen-link"
			href="/lizenzen"
			class="hover:text-accent-strong text-accent underline underline-offset-2">Lizenzen-Seite</a
		>.
	</p>

	<div class="flex flex-col gap-1.5 border-t border-rule pt-4">
		<h3 class="font-sans text-base font-semibold text-ink">Ihre Einrichtung soll nicht gelistet sein?</h3>
		<p class="font-serif text-sm text-ink-muted">
			Schreiben Sie uns, wir tragen den Ort aus. Ein Klick öffnet einen vorbereiteten Entwurf.
		</p>
		<a
			href={optOutUrl}
			data-testid="kuehle-orte-opt-out"
			aria-label="Einrichtung aus der Kühle-Orte-Karte austragen lassen"
			class="hover:text-accent-strong focus-visible:ring-accent inline-flex min-h-11 w-fit items-center gap-1.5 rounded font-sans text-sm text-accent underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
		>
			<Mail size={15} aria-hidden="true" />
			Austragung anfragen
			<ExternalLink size={12} aria-hidden="true" />
		</a>
	</div>
</section>
