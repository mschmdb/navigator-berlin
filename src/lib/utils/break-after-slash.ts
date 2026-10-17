/**
 * Teilt einen Namen nach jedem Schrägstrich. Der Schrägstrich bleibt am Teil davor,
 * damit der Aufrufer dort eine Umbruchstelle (`<wbr>`) setzen kann. Browser brechen
 * lange Namen wie „Otto-Suhr-Allee/Kantstraße“ sonst nicht am Schrägstrich um.
 */
export function breakAfterSlash(name: string): string[] {
	return name.split(/(?<=\/)/).filter((part) => part.length > 0);
}
