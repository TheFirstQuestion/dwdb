// English ordinal words for 1–19 and round tens are irregular; compounds
// like "twenty-first" are built algorithmically so no update is needed for
// future Doctors.
const ORDINALS: Record<string, number> = {
	first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
	sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
	eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
	sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19,
	twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50,
	sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90,
};

const TENS_PREFIX: Record<string, number> = {
	twenty: 20, thirty: 30, forty: 40, fifty: 50,
	sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

export function ordinalWordToNumber(word: string): number | null {
	const lower = word.toLowerCase();
	if (ORDINALS[lower] !== undefined) return ORDINALS[lower];
	const dash = lower.indexOf("-");
	if (dash < 0) return null;
	const tens = TENS_PREFIX[lower.slice(0, dash)];
	const ones = ORDINALS[lower.slice(dash + 1)];
	if (tens === undefined || ones === undefined || ones > 9) return null;
	return tens + ones;
}
