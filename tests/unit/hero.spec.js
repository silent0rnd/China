import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const page = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const viteConfig = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')
const pagesWorkflow = readFileSync(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')

describe('hero checkpoint', () => {
  it('keeps the approved hero copy and primary CTA', () => {
    expect(page).toContain('Доставка спецтехники, негабаритных грузов и контейнеров из Китая в Россию')
    expect(page).toContain('Получить расчёт перевозки')
  })

  it('uses the approved full-frame desktop and mobile visual without a shade layer', () => {
    expect(page).toContain('hero__reference-visual')
    expect(page).toContain('hero-scene-mobile.png')
    expect(page).not.toContain('hero__shade')
  })

  it('contains an accessible menu control', () => {
    expect(page).toContain('aria-controls="mobile-menu"')
  })

  it('builds relative assets and deploys only the Vite output to GitHub Pages', () => {
    expect(viteConfig).toContain("base: './'")
    expect(pagesWorkflow).toContain('actions/configure-pages@v5')
    expect(pagesWorkflow).toContain('run: npm run build')
    expect(pagesWorkflow).toContain('path: ./dist')
    expect(pagesWorkflow).toContain('actions/deploy-pages@v4')
  })
})
