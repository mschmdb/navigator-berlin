<!--
	Story Home-Modernize (#4): kurzer „In drei Schritten"-Orientierungsblock direkt nach dem Hook.
	Sagt einem Erstbesucher auf einen Blick, was ihn erwartet. Reiner Content, Style wie der Rest
	(Serif-Headline, Mono-Labels, Hairline-Raster). Kein „Was…"-Header.
-->
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	const STEPS = [
		{ n: '1', title: m.home_steps_1_title, text: m.home_steps_1_text },
		{ n: '2', title: m.home_steps_2_title, text: m.home_steps_2_text },
		{ n: '3', title: m.home_steps_3_title, text: m.home_steps_3_text }
	] as const;
</script>

<section data-testid="home-steps" class="space-y-6">
	<h2 class="font-serif text-2xl text-ink md:text-3xl">{m.home_steps_heading()}</h2>
	<ol class="grid gap-6 sm:grid-cols-3">
		{#each STEPS as step (step.n)}
			<li class="space-y-2 border-t-2 border-rule pt-3">
				<span class="font-mono text-xs tracking-wider text-accent uppercase"
					>{m.home_steps_label({ n: step.n })}</span
				>
				<p class="font-serif text-lg text-ink">{step.title()}</p>
				<p class="font-serif text-sm leading-relaxed text-ink-muted">{step.text()}</p>
			</li>
		{/each}
	</ol>
</section>
