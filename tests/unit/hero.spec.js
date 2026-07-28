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
    expect(page).toContain('hero-background-desktop-minimal.webp')
    expect(page).toContain('hero-background-mobile.webp')
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
    expect(mainScript).not.toContain('initHeroParallax')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('keeps the compact icon categories and simplified post-hero structure', () => {
    expect(page).toContain('/icons/model/bulldozer.webp')
    expect(page).toContain('/icons/model/shipping-container.webp')
    expect(page).toContain('Маршрут под ключ')
    expect(page).toContain('<h2 id="contacts-title">Контакты</h2>')
    expect(page.indexOf('id="faq"')).toBeLessThan(page.indexOf('id="contacts"'))
    expect(page).not.toContain('id="clearance"')
    expect(page).not.toContain('id="calculation"')
    expect(page).not.toContain('id="final-cta"')
    expect(page).not.toContain('class="terminal-list"')
  })

  it('uses a single cinematic delivery corridor with local transport icons', () => {
    const mainScript = readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
    expect(page).toContain('class="delivery-corridor"')
    expect(page).toContain('class="delivery-track__progress"')
    expect(page).toContain('/icons/model/truck.webp')
    expect(page).toContain('/icons/model/train.webp')
    expect(page).toContain('/icons/model/airplane-in-flight.webp')
    expect(existsSync(new URL('../../public/icons/model/train.webp', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/icons/model/airplane-in-flight.webp', import.meta.url))).toBe(true)
    expect(mainScript).toContain("section.matches('.delivery-section')")
    expect(mainScript).toContain('deliveryTimeline')
  })

  it('drives the route diorama with one scroll-linked truck instead of per-step pulses', () => {
    const routeScript = readFileSync(new URL('../../src/motion/route.js', import.meta.url), 'utf8')
    expect(page).not.toContain('route-step__runner')
    expect(page).toContain('class="route-steps"')
    expect(routeScript).toContain('getPointAtLength')
    // Маска обязана быть в userSpaceOnUse: на одной строке станций дорога —
    // горизонтальная линия с нулевой высотой bbox, и objectBoundingBox её скрывает.
    expect(routeScript).toContain("mask.setAttribute('maskUnits', 'userSpaceOnUse')")
    expect(routeScript).toContain('prefers-reduced-motion: reduce')
  })

  it('offers the cargo fit block without promising terms and prefills the lead form', () => {
    const fitScript = readFileSync(new URL('../../src/motion/cargo-fit.js', import.meta.url), 'utf8')
    const mainScript = readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
    expect(page).toContain('id="fit"')
    expect(page).toContain('data-fit-length')
    expect(page).toContain('data-fit-weight')
    // Статическая разметка должна совпадать с первым состоянием подбора.
    expect(page).toContain('value="5.5" data-fit-length')
    expect(page).toContain('Контейнер 20 футов')
    // Блок не обещает сроков и стоимости.
    expect(page).toContain('подтверждаются логистом после проверки')
    expect(fitScript).not.toMatch(/руб|₽|гарант/i)
    expect(mainScript).toContain('dataset.leadCargo')
    expect(existsSync(new URL('../../public/icons/model/lowbed-platform.webp', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../../public/icons/model/figure.webp', import.meta.url))).toBe(true)
  })

  it('keeps hero lights anchored to the image frame and the table-bump easter egg', () => {
    const styles = readFileSync(new URL('../../src/styles/main.css', import.meta.url), 'utf8')
    const mainScript = readFileSync(new URL('../../src/main.js', import.meta.url), 'utf8')
    expect(page).toContain('hero__glow-frame')
    // Кадр повторяет object-fit: cover, иначе огни уползают с фур.
    expect(styles).toContain('aspect-ratio: 1586 / 992')
    expect(mainScript).toContain('initTableBump')
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
