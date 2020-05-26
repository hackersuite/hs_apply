export function getSafeUnicode(character: string): string {
  const unicode = `000${character.charCodeAt(0).toString(16)}`.slice(-4);
  return `\\u${unicode}`;
}
