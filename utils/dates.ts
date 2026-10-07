export function parseDate(d: string | undefined) {
	if (d == null) {
		return;
	} else {
		return new Date(d);
	}
}
