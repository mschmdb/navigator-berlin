<script lang="ts">
	import { onMount } from 'svelte';

	export interface KapitelNavEntry {
		readonly id: string;
		readonly label: string;
	}

	type Props = {
		chapters: readonly KapitelNavEntry[];
	};

	let { chapters }: Props = $props();

	let activeId = $state<string | null>(null);
	let navEl = $state<HTMLElement | null>(null);

	// Aktiv ist das LETZTE Kapitel, dessen Oberkante die Leselinie (Unterkante
	// der Sticky-Nav + Puffer) passiert hat. Robust bei kurzen Sections, wo
	// mehrere Kapitel gleichzeitig im Viewport stehen; ein Band-Ansatz
	// markierte dort nach einem Anker-Sprung das falsche Kapitel.
	function computeActive(): void {
		const line = (navEl?.getBoundingClientRect().bottom ?? 120) + 32;
		let current = chapters[0]?.id ?? null;
		for (const chapter of chapters) {
			const el = document.getElementById(chapter.id);
			if (el && el.getBoundingClientRect().top <= line) current = chapter.id;
		}
		activeId = current;
	}

	onMount(() => {
		computeActive();
		const observer = new IntersectionObserver(() => computeActive(), {
			rootMargin: '-10% 0px -10% 0px',
			threshold: [0, 0.5, 1]
		});
		for (const chapter of chapters) {
			const el = document.getElementById(chapter.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});
</script>

<nav
	bind:this={navEl}
	aria-label="Kapitel"
	data-testid="kapitel-nav"
	class="sticky top-[var(--header-height,72px)] z-20 flex gap-1 overflow-x-auto border-b border-rule bg-bg/95 px-4 py-2"
>
	{#each chapters as chapter (chapter.id)}
		{@const current = activeId === chapter.id}
		<a
			href={`#${chapter.id}`}
			data-testid={`kapitel-nav-link-${chapter.id}`}
			aria-current={current ? 'true' : undefined}
			onclick={() => (activeId = chapter.id)}
			class="shrink-0 rounded px-2.5 py-1 font-mono text-xs tracking-wide whitespace-nowrap uppercase transition-colors"
			class:bg-ink={current}
			class:text-bg={current}
			class:text-ink-muted={!current}
			class:hover:text-ink={!current}
		>
			{chapter.label}
		</a>
	{/each}
</nav>
