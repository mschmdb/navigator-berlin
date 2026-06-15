<!--
	Sichtbare Brotkrumen-Navigation (WCAG: nav-Landmark + aria-current).
	Item-Shape identisch zu buildBreadcrumbList() (jsonld-breadcrumb.ts),
	damit Seiten die Items einmal berechnen und JSON-LD + visuelle Krumen
	aus derselben Quelle speisen.
-->
<script lang="ts">
	interface BreadcrumbItem {
		readonly name: string;
		readonly path: string;
	}

	interface Props {
		readonly items: readonly BreadcrumbItem[];
	}

	const { items }: Props = $props();
</script>

{#if items.length > 0}
	<nav data-testid="breadcrumb" aria-label="Brotkrumen" class="font-sans text-sm">
		<ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-subtle">
			{#each items as item, idx (item.path)}
				<li class="flex items-center gap-x-2">
					{#if idx < items.length - 1}
						<a
							href={item.path}
							class="text-accent underline underline-offset-2 hover:text-accent-strong"
						>
							{item.name}
						</a>
						<span aria-hidden="true">·</span>
					{:else}
						<span aria-current="page" class="text-ink-muted">{item.name}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>
{/if}
