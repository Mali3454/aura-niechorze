import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';

export function doc(path) {
  expect(existsSync(path), `brak pliku ${path} — czy build się wykonał?`).toBe(true);
  return parseHTML(readFileSync(path, 'utf8')).document;
}

describe('build produkuje stronę polską', () => {
  it('generuje dist/index.html z atrybutem lang="pl"', () => {
    const d = doc('dist/index.html');
    expect(d.documentElement.getAttribute('lang')).toBe('pl');
  });

  it('ma dokładnie jeden nagłówek h1', () => {
    const d = doc('dist/index.html');
    expect(d.querySelectorAll('h1')).toHaveLength(1);
  });

  it('nie odwołuje się do Google Fonts', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
  });
});
