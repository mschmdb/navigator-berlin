<script lang="ts">
	import { Accordion } from 'bits-ui';
	import { resolve } from '$app/paths';
	import type { WahlPortalQuelle } from '$lib/utils/wahl-portal-quellen.js';

	type Props = {
		quellen: readonly WahlPortalQuelle[];
	};

	let { quellen }: Props = $props();
</script>

<Accordion.Root type="single" class="border-y border-rule" data-testid="portal-quellen">
	<Accordion.Item value="quellen" class="py-1">
		<Accordion.Header>
			<Accordion.Trigger
				data-testid="portal-quellen-trigger"
				class="flex w-full items-center justify-between gap-4 py-3 text-left font-sans text-base font-semibold text-ink hover:text-accent"
			>
				Quellen & Methodik
			</Accordion.Trigger>
		</Accordion.Header>
		<Accordion.Content
			data-testid="portal-quellen-content"
			class="flex flex-col gap-3 pb-4 font-serif text-base leading-relaxed text-ink-muted"
		>
			{#if quellen.length > 0}
				<ul class="flex flex-col gap-1.5" data-testid="portal-quellen-list">
					{#each quellen as quelle (quelle.name + quelle.license)}
						<li data-testid={`portal-quellen-item-${quelle.name}`}>
							{quelle.name} · Lizenz {quelle.license}
						</li>
					{/each}
				</ul>
			{:else}
				<p data-testid="portal-quellen-empty">
					Quellen werden mit dem nächsten Build freigeschaltet.
				</p>
			{/if}
			<p class="font-mono text-xs text-ink-muted">
				<a
					href={resolve('/methodik/wahldaten')}
					data-testid="portal-quellen-methodik-link"
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					/methodik/wahldaten
				</a>
				·
				<a
					href={resolve('/lizenzen')}
					data-testid="portal-quellen-lizenzen-link"
					class="hover:text-accent-strong text-accent underline underline-offset-2"
				>
					/lizenzen
				</a>
			</p>
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
