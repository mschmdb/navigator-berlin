<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { META_LINKS, META_LINK_GROUPS } from './internal/meta-links.js';
	import { AnimatedLogo } from '$lib/components/ui';

	type Props = {
		variant?: 'full' | 'compact';
		langSwitcher?: Snippet;
	};
	let { variant = 'full', langSwitcher }: Props = $props();
</script>

{#if variant === 'compact'}
	<footer
		data-testid="meta-footer"
		class="border-t border-rule/50 bg-bg/55 px-4 py-1.5 font-sans text-xs text-ink-subtle backdrop-blur-sm print:hidden"
	>
		<nav
			aria-label="Meta-Navigation"
			class="mx-auto flex max-w-[1440px] flex-wrap items-center justify-end gap-y-1"
		>
			{#each META_LINKS as link (link.href)}
				<span class="whitespace-nowrap">
					<a href={link.href} class="hover:text-accent">{link.label}</a>
					<span aria-hidden="true" class="px-1.5 text-ink-subtle/50">·</span>
				</span>
			{/each}
			<a href={`mailto:${FEEDBACK_EMAIL}`} class="whitespace-nowrap hover:text-accent">Kontakt</a>
		</nav>
	</footer>
{:else}
	<footer
		data-testid="meta-footer"
		class="mt-16 border-t border-rule py-12 font-sans text-sm text-ink-muted print:hidden"
	>
		<div class="mx-auto max-w-[1440px] px-4">
			<div class="flex flex-col gap-10 md:flex-row md:justify-between">
				<div class="flex max-w-sm flex-col gap-3">
					<a href="/" aria-label="navigator.berlin" class="flex items-center gap-2">
						<AnimatedLogo variant="one-shot" size={36} title="navigator.berlin" />
						<span class="font-serif text-lg text-ink">navigator.berlin</span>
					</a>
					<p class="font-serif text-base leading-relaxed text-ink-muted">
						Berlin, Adresse für Adresse: Lärm, Klima, Grün, Mobilität, Wohnen und Wahlen.
						Jeder Wert mit Quelle und Stand, aus offenen Senats-Daten.
					</p>
				</div>

				<nav
					aria-label="Footer-Navigation"
					class="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3"
				>
					{#each META_LINK_GROUPS as group (group.title)}
						<div class="flex flex-col gap-2.5">
							<h2 class="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
								{group.title}
							</h2>
							<ul class="flex flex-col gap-2">
								{#each group.links as link (link.href)}
									<li>
										<a href={link.href} class="hover:text-accent">{link.label}</a>
									</li>
								{/each}
								{#if group.title === 'Sonstiges'}
									<li>
										<a href={`mailto:${FEEDBACK_EMAIL}`} class="hover:text-accent">Kontakt</a>
									</li>
								{/if}
							</ul>
						</div>
					{/each}
				</nav>
			</div>

			{#if langSwitcher}
				<div
					class="mt-10 flex flex-wrap items-center justify-end gap-4 border-t border-rule pt-6 font-mono text-xs text-ink-subtle"
				>
					{@render langSwitcher()}
				</div>
			{/if}
		</div>
	</footer>
{/if}
