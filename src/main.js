import './styles/main.css'
import anime from 'animejs'
import { initCursorMotion } from './motion/cursor.js'

const menuButton = document.querySelector('.menu-toggle')
const mobileMenu = document.querySelector('.mobile-menu')
const closeMenuButton = document.querySelector('[data-menu-close]')
const dialog = document.querySelector('#lead-dialog')
const dialogTitle = document.querySelector('#lead-dialog-title')
const dialogCloseButton = document.querySelector('[data-lead-close]')
const leadForm = document.querySelector('[data-lead-form]')
const leadStatus = document.querySelector('[data-lead-status]')
const lightbox = document.querySelector('#cargo-lightbox')
const lightboxImage = document.querySelector('[data-lightbox-image]')
const lightboxCaption = document.querySelector('[data-lightbox-caption]')
const lightboxCloseButton = document.querySelector('[data-lightbox-close]')
const header = document.querySelector('[data-header]')
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let lastFocusedElement = null
let lastLightboxFocusedElement = null

function initHeroMotion() {
  if (reducedMotionQuery.matches) return

  const heroTimeline = anime.timeline({
    easing: 'cubicBezier(.16, 1, .3, 1)',
    autoplay: true,
  })

  heroTimeline
    .add({ targets: '.site-header', opacity: [0, 1], duration: 360 })
    .add({ targets: '.brand, .desktop-nav, .header-actions', opacity: [0, 1], translateY: [-10, 0], delay: anime.stagger(50), duration: 460 }, '-=280')
    .add({ targets: '.eyebrow, h1, .hero__lead', opacity: [0, 1], translateY: [18, 0], delay: anime.stagger(70), duration: 560 }, '-=300')
    .add({ targets: '.hero__actions, .hero__hint, .hero__facts', opacity: [0, 1], translateY: [14, 0], delay: anime.stagger(80), duration: 480 }, '-=360')

  anime({
    targets: '.hero__atmosphere',
    opacity: [0.82, 1],
    translateX: [-6, 6],
    duration: 16000,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  })
}

const ASSEMBLY_EASING = 'cubicBezier(.16, 1, .3, 1)'

/**
 * Изометрический вектор, вдоль которого детали «прилетают» на стол.
 * Берётся из тех же токенов, что и геометрия макета в CSS.
 */
function assemblyVector() {
  const styles = window.getComputedStyle(document.documentElement)
  const root = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
  const toPx = (value, fallback) => {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed * root : fallback
  }

  return {
    x: toPx(styles.getPropertyValue('--iso-vector-x'), 26),
    y: toPx(styles.getPropertyValue('--iso-vector-y'), 15),
  }
}

/**
 * Задержки по пространственному положению, а не по порядку в DOM:
 * сборка идёт от левого верхнего угла к правому нижнему, как если бы
 * детали расставляли рукой.
 */
function spatialDelay(elements, step = 62, start = 0) {
  const ranking = new Map()

  ;[...elements]
    .map((element) => {
      const rect = element.getBoundingClientRect()
      return { element, score: rect.top * 1.6 + rect.left }
    })
    .sort((a, b) => a.score - b.score)
    .forEach(({ element }, index) => ranking.set(element, start + index * step))

  return (element) => ranking.get(element) ?? start
}

/** Убирает инлайн-стили, чтобы дальше работали CSS-состояния. */
function clearInline(elements) {
  elements.forEach((element) => {
    element.style.removeProperty('opacity')
    element.style.removeProperty('transform')
  })
}

/**
 * Общая грамматика появления: деталь прилетает вдоль изометрической оси,
 * слегка уменьшенная, и встаёт на стол с коротким овершутом.
 */
function assemble(targets, { step = 62, start = 0, duration = 620, complete } = {}) {
  const elements = [...targets]
  if (!elements.length) return null

  const vector = assemblyVector()
  const delayFor = spatialDelay(elements, step, start)

  return anime({
    targets: elements,
    opacity: [0, 1],
    translateX: [-vector.x, 0],
    translateY: [-vector.y, 0],
    scale: [0.965, 1],
    delay: (element) => delayFor(element),
    duration,
    easing: ASSEMBLY_EASING,
    complete: () => {
      clearInline(elements)
      complete?.()
    },
  })
}

function initSectionMotion() {
  if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) return

  document.documentElement.classList.add('motion-ready')
  const sections = document.querySelectorAll('.section')
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      const section = entry.target
      const container = section.querySelector(':scope > .section__container')
      const isDeliverySection = section.matches('.delivery-section')
      const deliveryTrack = isDeliverySection ? section.querySelector('.delivery-track__progress') : null
      const deliveryNodes = isDeliverySection ? section.querySelectorAll('.delivery-card__node') : []
      const deliveryDetails = isDeliverySection ? section.querySelectorAll('.delivery-card__visual, .delivery-card__body') : []
      const deliveryAxis = window.matchMedia('(max-width: 47.99rem)').matches ? 'scaleY' : 'scaleX'

      if (deliveryTrack) anime.set(deliveryTrack, { [deliveryAxis]: 0 })
      if (deliveryNodes.length) anime.set(deliveryNodes, { opacity: 0, scale: 0.58 })
      if (deliveryDetails.length) anime.set(deliveryDetails, { opacity: 0, translateY: 16 })

      // Проход света по секции — связывает все блоки в одно событие.
      section.classList.add('is-revealed')

      if (container) {
        anime({
          targets: container,
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 520,
          easing: ASSEMBLY_EASING,
        })
      }

      // Отпечатки ложатся на стол, доворачиваясь к своему углу наклона.
      if (section.matches('.cargo-section')) {
        const prints = [...section.querySelectorAll('.cargo-card')]
        const vector = assemblyVector()
        const delayFor = spatialDelay(prints, 58)

        anime({
          targets: prints,
          opacity: [0, 1],
          translateX: [-vector.x, 0],
          translateY: [-vector.y, 0],
          scale: [0.96, 1],
          // Финальный угол — тот, что задан в CSS через --print-tilt,
          // иначе после снятия инлайн-стилей отпечаток дёрнется.
          rotate: (element) => {
            const tilt = parseFloat(window.getComputedStyle(element).getPropertyValue('--print-tilt')) || 0
            return [tilt - 3.5, tilt]
          },
          delay: (element) => delayFor(element),
          duration: 680,
          easing: ASSEMBLY_EASING,
          complete: () => clearInline(prints),
        })
      }

      if (section.matches('.cargo-types')) {
        assemble(section.querySelectorAll('.cargo-type'), { step: 66 })
        // Деталь опускается на свою площадку чуть позже плиты.
        const pads = [...section.querySelectorAll('.cargo-type__icon img')]
        anime({
          targets: pads,
          opacity: [0, 1],
          translateY: [-14, 0],
          scale: [0.78, 1],
          delay: anime.stagger(66, { start: 220 }),
          duration: 560,
          easing: ASSEMBLY_EASING,
          complete: () => clearInline(pads),
        })
      }

      // Станции маршрута встают по очереди — так же, как их проезжает фура.
      if (section.matches('.route-section')) {
        const stations = [...section.querySelectorAll('.route-step')]
        assemble(stations, { step: 92, duration: 720 })

        const icons = [...section.querySelectorAll('.route-step__icon')]
        anime({
          targets: icons,
          opacity: [0, 1],
          translateY: [-12, 0],
          scale: [0.74, 1],
          delay: anime.stagger(92, { start: 180 }),
          duration: 560,
          easing: ASSEMBLY_EASING,
          complete: () => clearInline(icons),
        })
      }

      if (isDeliverySection) {
        const deliveryTimeline = anime.timeline({ easing: ASSEMBLY_EASING })

        deliveryTimeline
          .add({
            targets: deliveryTrack,
            [deliveryAxis]: [0, 1],
            duration: 980,
            complete: () => deliveryTrack?.style.removeProperty('transform'),
          })
          .add({
            targets: deliveryNodes,
            opacity: [0, 1],
            scale: [0.58, 1],
            delay: anime.stagger(130),
            duration: 420,
            complete: () => clearInline([...deliveryNodes]),
          }, '-=720')
          .add({
            targets: deliveryDetails,
            opacity: [0, 1],
            translateY: [16, 0],
            delay: anime.stagger(85),
            duration: 620,
            complete: () => clearInline([...deliveryDetails]),
          }, '-=480')
      }

      // Ящики FAQ выезжают из панели.
      if (section.matches('.faq-section')) {
        assemble(section.querySelectorAll('.faq-list details'), { step: 38, duration: 520 })
      }

      // Шильдики контактов ложатся на панель.
      if (section.matches('.contacts-section')) {
        assemble(section.querySelectorAll('.contact-actions > a'), { step: 70, duration: 580 })
      }

      observer.unobserve(section)
    })
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 })

  sections.forEach((section) => observer.observe(section))
}

function initHeaderState() {
  if (!header) return

  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 48)
  updateHeader()
  window.addEventListener('scroll', updateHeader, { passive: true })
}

function initFaqBehavior() {
  const items = document.querySelectorAll('.faq-list details')
  if (window.matchMedia('(max-width: 47.99rem)').matches) {
    const openedItems = [...items].filter((item) => item.open)
    openedItems.slice(1).forEach((item) => { item.open = false })
  }

  items.forEach((item) => item.addEventListener('toggle', () => {
    if (!item.open || !window.matchMedia('(max-width: 47.99rem)').matches) return
    items.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false
    })
  }))
}

function trapMenuFocus(event) {
  if (event.key !== 'Tab' || mobileMenu?.getAttribute('aria-hidden') !== 'false') return
  const focusable = [...mobileMenu.querySelectorAll('a[href], button:not([disabled])')]
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function closeMenu({ returnFocus = true } = {}) {
  menuButton?.setAttribute('aria-expanded', 'false')
  mobileMenu?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('menu-open')
  if (returnFocus) menuButton?.focus()
}

function openMenu() {
  menuButton?.setAttribute('aria-expanded', 'true')
  mobileMenu?.setAttribute('aria-hidden', 'false')
  document.body.classList.add('menu-open')
  closeMenuButton?.focus()
}

function openLeadDialog(trigger) {
  if (!dialog) return
  closeMenu({ returnFocus: false })
  lastFocusedElement = trigger
  dialogTitle.textContent = trigger.dataset.leadTitle || 'Получить расчёт перевозки'
  leadForm?.reset()
  if (leadStatus) leadStatus.textContent = ''
  dialog.showModal()
  dialog.querySelector('input')?.focus()
}

function closeLeadDialog() {
  if (!dialog?.open) return
  dialog.close()
}

function openLightbox(trigger) {
  if (!lightbox || !lightboxImage || !lightboxCaption) return
  lastLightboxFocusedElement = trigger
  lightboxImage.src = trigger.dataset.lightboxSrc || ''
  lightboxImage.alt = trigger.dataset.lightboxAlt || ''
  lightboxCaption.textContent = trigger.dataset.lightboxAlt || ''
  lightbox.showModal()
  lightboxCloseButton?.focus()
}

function closeLightbox() {
  if (!lightbox?.open) return
  lightbox.close()
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  if (isOpen) closeMenu()
  else openMenu()
})

closeMenuButton?.addEventListener('click', () => closeMenu())
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu({ returnFocus: false })))
document.querySelectorAll('[data-lead-open]').forEach((trigger) => trigger.addEventListener('click', () => openLeadDialog(trigger)))
dialogCloseButton?.addEventListener('click', closeLeadDialog)
document.querySelectorAll('[data-lightbox-src]').forEach((trigger) => trigger.addEventListener('click', () => openLightbox(trigger)))
lightboxCloseButton?.addEventListener('click', closeLightbox)

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeLeadDialog()
})

dialog?.addEventListener('close', () => {
  lastFocusedElement?.focus()
  lastFocusedElement = null
})

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox()
})

lightbox?.addEventListener('close', () => {
  lightboxImage?.removeAttribute('src')
  lightboxImage?.removeAttribute('alt')
  lightboxCaption.textContent = ''
  lastLightboxFocusedElement?.focus()
  lastLightboxFocusedElement = null
})

leadForm?.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!leadForm.checkValidity()) {
    leadForm.reportValidity()
    return
  }
  leadStatus.textContent = 'Серверная отправка будет подключена на отдельном этапе. Заявка пока не отправлена.'
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu?.getAttribute('aria-hidden') === 'false') closeMenu()
  trapMenuFocus(event)
})

initHeroMotion()
initSectionMotion()
initHeaderState()
initFaqBehavior()
initCursorMotion()
