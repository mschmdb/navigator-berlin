<!--
	Story Home-Modernize (#4): kurzer „In drei Schritten"-Orientierungsblock direkt nach dem Hook.
	Sagt einem Erstbesucher auf einen Blick, was ihn erwartet. Reiner Content, Style wie der Rest
	(Serif-Headline, Mono-Labels, Hairline-Raster). Kein „Was…"-Header.
-->
<script lang="ts">
	const STEPS = [
		{
			n: '1',
			title: 'Adresse oder Kiez wählen',
			text: 'Gib eine Berliner Adresse ein oder klick einen Kiez auf der Karte an.'
		},
		{
			n: '2',
			title: 'Kiez-Score & Dimensionen',
			text: 'Ein Kiez-Score von 0 bis 100 aus fünf Dimensionen. Kultur und Kriminalität kommen als Kontext dazu.'
		},
		{
			n: '3',
			title: 'Layer vergleichen',
			text: 'Schalt einzelne Daten-Schichten auf die Karte und vergleich Adressen, Kieze und Bezirke direkt.'
		}
	] as const;
</script>

<section data-testid="home-steps" class="space-y-6">
	<h2 class="font-serif text-2xl text-ink md:text-3xl">In drei Schritten</h2>
	<ol class="grid gap-6 sm:grid-cols-3">
		{#each STEPS as step (step.n)}
			<li class="space-y-2 border-t-2 border-rule pt-3">
				<span class="font-mono text-xs tracking-wider text-accent uppercase">Schritt {step.n}</span>
				<p class="font-serif text-lg text-ink">{step.title}</p>
				<p class="font-serif text-sm leading-relaxed text-ink-muted">{step.text}</p>
			</li>
		{/each}
	</ol>
</section>
