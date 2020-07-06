export function getEnvOptional(source: Record<string, string | undefined>, name: string): string|undefined {
	return source[name];
}

export function getEnvOrDefault(source: Record<string, string | undefined>, name: string, defaultValue: string) {
	return getEnvOptional(source, name) ?? defaultValue;
}

export function getEnv(source: Record<string, string | undefined>, name: string) {
	const value = getEnvOptional(source, name);
	if (!value) throw new Error(`Property ${name} is missing from source.`);
	return value;
}

export function intoNumber(str: string): number {
	if (isNaN(Number(str))) throw new Error(`Value '${str}' is not a number.`);
	return Number(str);
}
