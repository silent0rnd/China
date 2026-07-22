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
let lastFocusedElement = null

function initHeroMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const heroTimeline = anime.timeline({
    easing: 'cubicBezier(.16, 1, .3, 1)',
    autoplay: true,
  })

  heroTimeline
    .add({ targets: '.site-header', opacity: [0, 1], duration: 360 })
    .add({ targets: '.brand, .desktop-nav, .header-actions', opacity: [0, 1], translateY: [-10, 0], delay: anime.stagger(50), duration: 460 }, '-=280')
    .add({ targets: '.eyebrow, h1, .hero__lead', opacity: [0, 1], translateY: [18, 0], delay: anime.stagger(70), duration: 560 }, '-=300')
    .add({ targets: '.hero__actions, .hero__hint, .hero__facts', opacity: [0, 1], translateY: [14, 0], delay: anime.stagger(80), duration: 480 }, '-=360')

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

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  if (isOpen) closeMenu()
  else openMenu()
})

closeMenuButton?.addEventListener('click', () => closeMenu())
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu({ returnFocus: false })))
document.querySelectorAll('[data-lead-open]').forEach((trigger) => trigger.addEventListener('click', () => openLeadDialog(trigger)))
dialogCloseButton?.addEventListener('click', closeLeadDialog)

dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeLeadDialog()
})

dialog?.addEventListener('close', () => {
  lastFocusedElement?.focus()
  lastFocusedElement = null
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
})

initHeroMotion()
