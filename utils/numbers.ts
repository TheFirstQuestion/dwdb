interface NumberWords {
	noun: string;
	positional: string;
}

const numbersToWords: Record<number, NumberWords> = {
	0: { noun: "zero", positional: "zeroth" },
	1: { noun: "one", positional: "first" },
	2: { noun: "two", positional: "second" },
	3: { noun: "three", positional: "third" },
	4: { noun: "four", positional: "fourth" },
	5: { noun: "five", positional: "fifth" },
	6: { noun: "six", positional: "sixth" },
	7: { noun: "seven", positional: "seventh" },
	8: { noun: "eight", positional: "eighth" },
	9: { noun: "nine", positional: "ninth" },
	10: { noun: "ten", positional: "tenth" },
	11: { noun: "eleven", positional: "eleventh" },
	12: { noun: "twelve", positional: "twelfth" },
	13: { noun: "thirteen", positional: "thirteenth" },
	14: { noun: "fourteen", positional: "fourteenth" },
	15: { noun: "fifteen", positional: "fifteenth" },
	16: { noun: "sixteen", positional: "sixteenth" },
	17: { noun: "seventeen", positional: "seventeenth" },
	18: { noun: "eighteen", positional: "eighteenth" },
	19: { noun: "nineteen", positional: "nineteenth" },
	20: { noun: "twenty", positional: "twentieth" },
};

// Doctor numbers are small today, but this table needs a new row whenever a Doctor's number exceeds it (e.g. a new incarnation past Twentieth) -- throwing here makes that obvious instead of silently mislabeling the page.
export function ordinalWord(n: number): string {
	const words = numbersToWords[n];
	if (!words) {
		throw new Error(
			`No ordinal word defined for ${n}; add an entry to numbersToWords in utils/numbers.ts`
		);
	}
	return words.positional;
}

// Inverted from numbersToWords' positional forms (1-20) so the two tables can't drift apart, plus the round tens above twenty that numbersToWords  doesn't cover. Compounds like "twenty-first" are built algorithmically below so no update is needed for future Doctors.
const ORDINALS: Record<string, number> = {
	...Object.fromEntries(
		Object.entries(numbersToWords)
			.filter(([n]) => Number(n) >= 1)
			.map(([n, { positional }]) => [positional, Number(n)])
	),
	thirtieth: 30,
	fortieth: 40,
	fiftieth: 50,
	sixtieth: 60,
	seventieth: 70,
	eightieth: 80,
	ninetieth: 90,
};

const TENS_PREFIX: Record<string, number> = {
	twenty: 20,
	thirty: 30,
	forty: 40,
	fifty: 50,
	sixty: 60,
	seventy: 70,
	eighty: 80,
	ninety: 90,
};

export function ordinalWordToNumber(word: string): number | null {
	const lower = word.toLowerCase();
	if (ORDINALS[lower] !== undefined) {
		return ORDINALS[lower];
	}

	const dash = lower.indexOf("-");
	if (dash < 0) {
		return null;
	}

	const tens = TENS_PREFIX[lower.slice(0, dash)];
	const ones = ORDINALS[lower.slice(dash + 1)];

	if (tens === undefined || ones === undefined || ones > 9) {
		return null;
	}

	return tens + ones;
}
