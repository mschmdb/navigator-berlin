import { execFile } from 'node:child_process';

const INSTALL_HINT =
	'7zz nicht gefunden. Installiere via `brew install sevenzip` (macOS) oder `apt install 7zip` (Debian/Ubuntu).';

export class SevenZipMissingError extends Error {
	constructor() {
		super(INSTALL_HINT);
		this.name = 'SevenZipMissingError';
	}
}

type Run = (cmd: string, args: readonly string[]) => Promise<Buffer>;

/** Destatis-CSV hat bundesweit ~170 MB, daher grosser Puffer. */
const MAX_BUFFER = 512 * 1024 * 1024;

const runExecFile: Run = (cmd, args) =>
	new Promise((resolve, reject) => {
		execFile(cmd, [...args], { encoding: 'buffer', maxBuffer: MAX_BUFFER }, (err, stdout) =>
			err ? reject(err) : resolve(stdout)
		);
	});

/** Entpackt Dateien aus einem 7-Zip-Archiv nach stdout (`7zz e -so`). */
export async function extractFrom7z(
	archivePath: string,
	pattern: string,
	run: Run = runExecFile
): Promise<Buffer> {
	let out: Buffer;
	try {
		out = await run('7zz', ['e', '-so', archivePath, pattern]);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw new SevenZipMissingError();
		throw err;
	}
	if (out.length === 0) {
		throw new Error(`7zz: keine Datei zu Muster "${pattern}" in ${archivePath} gefunden`);
	}
	return out;
}
