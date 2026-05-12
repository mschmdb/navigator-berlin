<script lang="ts">
	import { createUiState } from './ui-context.svelte.js';

	const ui = createUiState();

	function openInspector(): void {
		ui.inspectorOpen = true;
	}
</script>

<button data-testid="open-inspector" type="button" onclick={openInspector}>open</button>
<pre data-testid="dump">{JSON.stringify(ui)}</pre>
