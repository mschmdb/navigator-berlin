<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { FEEDBACK_EMAIL } from '$lib/utils/contact.js';
	import { META_LINKS } from './internal/meta-links.js';

	type Props = {
		open: boolean;
		onClose: () => void;
		langSwitcher?: Snippet;
	};

	let { open, onClose, langSwitcher }: Props = $props();
	let drawerEl: HTMLElement | null = $state(null);
	let prevActive: Element | null = null;

	$effect(() => {
		if (!open) return;
		prevActive = typeof document !== 'undefined' ? document.activeElement : null;
		queueMicrotask(() => {
			const firstLink = drawerEl?.querySelector('a, button') as HTMLElement | null;
			firstLink?.focus();
		});
	});

	onMount(() => {
		function onKey(e: KeyboardEvent): void {
			if (e.key === 'Escape' && open) {
				e.preventDefault();
				onClose();
				if (prevActive instanceof HTMLElement) prevActive.focus();
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div
		role="presentation"
		data-testid="mobile-meta-drawer-backdrop"
		class="fixed inset-0 z-50 bg-black/40"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={() => {}}
	>
		<aside
			bind:this={drawerEl}
			role="dialog"
			aria-modal="true"
			aria-label="Menü"
			data-testid="mobile-meta-drawer"
			class="fixed inset-y-0 right-0 flex w-[min(88vw,360px)] flex-col bg-bg-elevated shadow-2xl"
		>
			<header class="flex items-center justify-between border-b border-rule px-5 py-4">
				<h2 class="font-serif text-lg text-ink">Menü</h2>
				<button
					type="button"
					data-testid="mobile-meta-drawer-close"
					onclick={onClose}
					aria-label="Menü schließen"
					class="rounded-sm p-1 text-ink-muted hover:text-ink"
				>
					<X size={20} aria-hidden="true" />
				</button>
			</header>

			<nav aria-label="Meta-Navigation" class="flex-1 overflow-y-auto px-2 py-3">
				<ul class="flex flex-col">
					{#each META_LINKS as link (link.href)}
						<li>
							<a
								href={link.href}
								onclick={onClose}
								class="block rounded-sm px-3 py-3 text-base text-ink hover:bg-rule/40"
							>
								{link.label}
							</a>
						</li>
					{/each}
					<li>
						<a
							href={`mailto:${FEEDBACK_EMAIL}`}
							onclick={onClose}
							class="block rounded-sm px-3 py-3 text-base text-ink hover:bg-rule/40"
						>
							Kontakt
						</a>
					</li>
				</ul>
			</nav>

			{#if langSwitcher}
				<div class="border-t border-rule px-5 py-4">{@render langSwitcher()}</div>
			{/if}
		</aside>
	</div>
{/if}
