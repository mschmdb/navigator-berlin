/**
 * Kit 3 ersetzt `prerender.origin` durch `paths.origin`. adapter-node 6 übernimmt
 * `paths.origin` aber auch als festen Origin jeder Laufzeit-Anfrage. Dann sieht
 * `reroute` für hitze., kaelte. und stories.navigator.berlin nur noch den
 * Haupt-Host, und die Subdomains rendern die Startseite.
 *
 * Der Wrapper reicht dem Adapter einen Builder ohne `paths.origin` weiter. Der
 * Prerender nutzt den Origin weiter, zur Laufzeit leitet adapter-node ihn wie
 * unter Kit 2 aus Host-Header oder `ORIGIN` ab.
 *
 * Reines JS, damit `vite.config.ts` das Modul ohne Umweg lädt.
 *
 * @param {import('@sveltejs/kit').Adapter} adapter
 * @returns {import('@sveltejs/kit').Adapter}
 */
export function withRequestOrigin(adapter) {
	return {
		...adapter,
		adapt(builder) {
			const config = {
				...builder.config,
				paths: { ...builder.config.paths, origin: undefined }
			};
			const proxy = new Proxy(builder, {
				get(target, prop) {
					if (prop === 'config') return config;
					const value = Reflect.get(target, prop, target);
					return typeof value === 'function' ? value.bind(target) : value;
				}
			});
			return adapter.adapt(proxy);
		}
	};
}
