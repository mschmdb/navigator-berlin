<!--
	Story 2.11 T3: Beratungs-CTA dezent vor dem Footer (Hebel-#2-Lock
	2026-05-15-PM: Beratungs-Asset für Berliner Stakeholder). Mailto-Link
	statt Formular damit kein PII-Backend nötig wird.
-->
<script lang="ts">
	import { Mail } from '@lucide/svelte';
</script>

<section
	data-testid="home-consulting-cta"
	class="space-y-3 rounded border border-rule bg-bg-soft px-6 py-6"
>
	<h2 class="font-serif text-2xl text-ink">Beratung &amp; Custom-Aggregate</h2>
	<p class="max-w-prose font-serif text-base text-ink-muted">
		Geo- und Open-Data-Projekt für Berliner Stakeholder, Initiativen oder Redaktionen? Wir
		bauen passgenaue Aggregate, Choropleth-Karten und Daten-Workflows ohne Vendor-Lock-in.
	</p>
	<a
		href="mailto:beratung@navigator.berlin?subject=Anfrage%20Beratung"
		class="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-accent hover:text-ink"
	>
		<Mail size={16} aria-hidden="true" />
		beratung@navigator.berlin
	</a>
</section>
