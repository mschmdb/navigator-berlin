<!--
	Ohne JavaScript zeichnet LayerChart keine Grafik (die Breite wird im Browser gemessen).
	Dann zeigen die Kapitel statt der leeren Grafikfläche ihre Datentabelle.
-->
<svelte:head>
	<noscript>
		<style>
			.place-reveal {
				display: none;
			}
			[data-place-table] {
				position: static;
				width: auto;
				height: auto;
				margin: 0;
				overflow-x: auto;
				clip-path: none;
				clip: auto;
				white-space: normal;
			}
		</style>
	</noscript>
</svelte:head>
