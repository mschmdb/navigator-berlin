<!--
	Gemeinsamer Rahmen für die Kartengruppe im Hero von Kiez- und Bezirksseite.
	Gestalt: Titel, Erklärung, Grafik, Legende und Karten-Button stehen in einer
	Region (Rahmen `rule-strong` für 3:1 gegen den Hintergrund). `figure` mit
	`figcaption` verbindet Titel und Erklärung mit der Grafik. Die Aktion
	(Karten-Button) steht im DOM direkt nach der Erklärung (Tab-Reihenfolge
	Erklärungs-Link, dann Button). Visuell sitzt sie mobil über der Grafik, damit
	der Button im ersten Bildschirm bleibt, und ab `md` unten im Rahmen. Die
	Grafik enthält keine Tab-Stopps, die Umordnung ändert die Fokusfolge nicht.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		readonly title: string;
		readonly description?: Snippet;
		readonly children: Snippet;
		readonly action?: Snippet;
		readonly testid?: string;
	}

	const { title, description, children, action, testid = 'hero-map-card' }: Props = $props();
</script>

<figure
	class="m-0 flex flex-col items-start gap-3 rounded-md border border-rule-strong bg-bg-elevated p-4"
	data-testid={testid}
>
	<figcaption class="order-1 space-y-1">
		<p class="m-0 text-lg text-ink" data-testid="hero-map-card-title">{title}</p>
		{#if description}
			<div class="font-sans text-sm text-ink-muted" data-testid="hero-map-card-description">
				{@render description()}
			</div>
		{/if}
	</figcaption>
	{#if action}
		<div class="order-2 md:order-3">
			{@render action()}
		</div>
	{/if}
	<div class="order-3 w-full md:order-2">
		{@render children()}
	</div>
</figure>
