import './styles/main.css'
import anime from 'animejs'

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
const heroBackground = document.querySelector('.hero__background img')
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
let lastFocusedElement = null
let lastLightboxFocusedElement = null
let parallaxFrame = null

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

function initSectionMotion() {
  if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) return

  document.documentElement.classList.add('motion-ready')
  const sections = document.querySelectorAll('.section')
  const observer = new window.IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      const section = entry.target
      const container = section.querySelector(':scope > .section__container')
      section.classList.add('is-revealed')

      if (container) {
        anime({
          targets: container,
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 520,
          easing: 'cubicBezier(.16, 1, .3, 1)',
        })
      }

      const detailTargets = section.matches('.cargo-section')
        ? section.querySelectorAll('.cargo-card')
        : section.matches('.cargo-types')
          ? section.querySelectorAll('.cargo-type')
          : []

      if (detailTargets.length) {
        anime({
          targets: detailTargets,
          opacity: [0, 1],
          translateY: [18, 0],
          delay: anime.stagger(55),
          duration: 560,
          easing: 'cubicBezier(.16, 1, .3, 1)',
          complete: () => detailTargets.forEach((target) => {
            target.style.removeProperty('opacity')
            target.style.removeProperty('transform')
          }),
        })
      }

      if (section.matches('.cargo-types')) {
        anime({
          targets: section.querySelectorAll('.cargo-type__icon'),
          opacity: [0, 1],
          scale: [0.72, 1],
          rotate: [-4, 0],
          delay: anime.stagger(70, { start: 160 }),
          duration: 620,
          easing: 'cubicBezier(.16, 1, .3, 1)',
          complete: (animation) => animation.animatables.forEach(({ target }) => {
            target.style.removeProperty('opacity')
            target.style.removeProperty('transform')
          }),
        })
      }

      if (section.matches('.route-section')) {
        const routeSteps = section.querySelectorAll('.route-step')
        const routeTimeline = anime.timeline({ easing: 'cubicBezier(.16, 1, .3, 1)' })

        routeTimeline
          .add({
            targets: routeSteps,
            opacity: [0, 1],
            translateY: [34, 0],
            delay: anime.stagger(95),
            duration: 760,
            complete: () => routeSteps.forEach((target) => {
              target.style.removeProperty('opacity')
              target.style.removeProperty('transform')
            }),
          })
          .add({
            targets: section.querySelectorAll('.route-step__icon'),
            opacity: [0, 1],
            translateY: [12, 0],
            scale: [0.68, 1],
            delay: anime.stagger(70),
            duration: 560,
            complete: (animation) => animation.animatables.forEach(({ target }) => {
              target.style.removeProperty('opacity')
              target.style.removeProperty('transform')
            }),
          }, '-=670')
      }

      observer.unobserve(section)
    })
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 })

  sections.forEach((section) => observer.observe(section))
}

function initHeroParallax() {
  if (reducedMotionQuery.matches || !heroBackground || !window.matchMedia('(min-width: 64rem)').matches) return

  window.addEventListener('pointermove', (event) => {
    if (parallaxFrame) return
    parallaxFrame = window.requestAnimationFrame(() => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 12
      const y = ((event.clientY / window.innerHeight) - 0.5) * 8
      anime.set(heroBackground, { translateX: x, translateY: y })
      parallaxFrame = null
    })
  }, { passive: true })
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
initHeroParallax()
initHeaderState()
initFaqBehavior()
