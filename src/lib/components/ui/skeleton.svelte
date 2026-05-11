<script lang="ts">
	type Props = { class?: string };
	let { class: className }: Props = $props();
</script>

<div
	data-testid="skeleton"
	class="block bg-rule motion-safe:animate-pulse {className ?? ''}"
	aria-hidden="true"
></div>
