import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const viteConfig = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')
const pagesWorkflow = readFileSync(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
const conflictingPagesWorkflow = new URL('../../.github/workflows/static.yml', import.meta.url)

describe('hero checkpoint', () => {
  it('keeps the approved hero copy and primary CTA', () => {
    expect(page).toContain('Доставка спецтехники, негабаритных грузов и контейнеров из Китая в Россию')
    expect(page).toContain('Получить расчёт перевозки')
  })

  it('uses separate clean desktop and mobile scene assets behind real hero controls', () => {
    expect(page).toContain('hero-background-desktop-minimal.png')
    expect(page).toContain('hero-background-mobile.png')
    expect(page).not.toContain('hero__reference-visual')
    expect(page).not.toContain('hero__semantic-layer')
  })

  it('loads the approved local Golos Text and IBM Plex Mono font files', () => {
    const styles = readFileSync(new URL('../../src/styles/main.css', import.meta.url), 'utf8')
    expect(page).toContain('preload" href="/fonts/golos-text-cyrillic.woff2"')
    expect(styles).toContain("font-family: 'Golos Text'")
    expect(styles).toContain("font-family: 'IBM Plex Mono'")
    expect(existsSync(new URL('../../public/fonts/golos-text-cyrillic.woff2', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/fonts/ibm-plex-mono-500-cyrillic.woff2', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/fonts/OFL-Golos-Text.txt', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/fonts/OFL-IBM-Plex.txt', import.meta.url))).toBe(true)
  })

  it('contains accessible menu and lead-dialog controls', () => {
    expect(page).toContain('aria-controls="mobile-menu"')
    expect(page).toContain('id="lead-dialog"')
    expect(page).toContain('data-lead-open')
    expect(page).toContain('href="tel:+79367772255"')
  })

  it('uses the approved Anime.js motion layer with a reduced-motion fallback', () => {
    const mainScript = readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
    const styles = readFileSync(new URL('../../src/styles/main.css', import.meta.url), 'utf8')
    expect(mainScript).toContain("import anime from 'animejs'")
    expect(mainScript).toContain('prefers-reduced-motion: reduce')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('builds relative assets and deploys only the Vite output to GitHub Pages', () => {
    expect(viteConfig).toContain("base: './'")
    expect(pagesWorkflow).toContain('actions/configure-pages@v5')
    expect(pagesWorkflow).toContain('run: npm run build')
    expect(pagesWorkflow).toContain('path: ./dist')
    expect(pagesWorkflow).toContain('actions/deploy-pages@v4')
    expect(existsSync(conflictingPagesWorkflow)).toBe(false)
  })
})
