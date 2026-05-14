declare module 'wawoff2' {
	export function decompress(input: Buffer | Uint8Array): Promise<Uint8Array>;
	export function compress(input: Buffer | Uint8Array): Promise<Uint8Array>;
	const wawoff2: {
		decompress: typeof decompress;
		compress: typeof compress;
	};
	export default wawoff2;
}
