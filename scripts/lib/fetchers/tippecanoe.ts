import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const INSTALL_HINT =
	'tippecanoe nicht gefunden. Installiere via `brew install tippecanoe` (macOS) oder `apt install tippecanoe` (Debian/Ubuntu).';

export class TippecanoeMissingError extends Error {
	constructor() {
		super(INSTALL_HINT);
		this.name = 'TippecanoeMissingError';
	}
}

export async function isTippecanoeAvailable(): Promise<boolean> {
	try {
		await execFileAsync('tippecanoe', ['--version']);
		return true;
	} catch {
		return false;
	}
}

export interface TippecanoeOptions {
	/** Min zoom (default 10) */
	minZoom?: number;
	/** Max zoom (default 14) */
	maxZoom?: number;
	/** Logical layer-name im output. Default: aus Output-Filename ableiten. */
	layerName: string;
	/** Properties die behalten werden sollen (--include). Leer = alle. */
	includeProperties?: readonly string[];
	/** Zusätzliche Flags. */
	extraFlags?: readonly string[];
}

// Default-Flags konservativ: keine Feature-Drops, größere Tiles erlaubt.
// `--drop-densest-as-needed` würde dichte Adress-Cluster ausdünnen → unbrauchbar
// für Mietspiegel-Wohnlage. Bei Tile-Größen-Overflow tippecanoe extended Zoom.
const DEFAULT_FLAGS = [
	'--extend-zooms-if-still-dropping',
	'--no-feature-limit',
	'--no-tile-size-limit',
	'--force'
];

export function buildTippecanoeArgs(
	inputPath: string,
	outputPath: string,
	opts: TippecanoeOptions
): string[] {
	const minZoom = opts.minZoom ?? 10;
	const maxZoom = opts.maxZoom ?? 14;
	const args: string[] = [
		'-o',
		outputPath,
		'-z',
		String(maxZoom),
		'-Z',
		String(minZoom),
		'-l',
		opts.layerName,
		...DEFAULT_FLAGS
	];
	for (const prop of opts.includeProperties ?? []) {
		args.push('-y', prop);
	}
	for (const flag of opts.extraFlags ?? []) args.push(flag);
	args.push(inputPath);
	return args;
}

export async function runTippecanoe(
	inputPath: string,
	outputPath: string,
	opts: TippecanoeOptions
): Promise<void> {
	if (!(await isTippecanoeAvailable())) {
		throw new TippecanoeMissingError();
	}
	const args = buildTippecanoeArgs(inputPath, outputPath, opts);
	await new Promise<void>((resolve, reject) => {
		const proc = spawn('tippecanoe', args, { stdio: ['ignore', 'inherit', 'inherit'] });
		proc.on('error', (err) => reject(err));
		proc.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`tippecanoe exited with code ${code}`));
		});
	});
}
