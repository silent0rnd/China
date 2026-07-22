import './styles/main.css'

const menuButton = document.querySelector('.menu-toggle')
const mobileMenu = document.querySelector('.mobile-menu')
const closeButton = document.querySelector('[data-menu-close]')

function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false')
  mobileMenu?.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('menu-open')
  menuButton?.focus()
}

function openMenu() {
  menuButton?.setAttribute('aria-expanded', 'true')
  mobileMenu?.setAttribute('aria-hidden', 'false')
  document.body.classList.add('menu-open')
  closeButton?.focus()
}

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true'
  if (isOpen) closeMenu()
  else openMenu()
})

closeButton?.addEventListener('click', closeMenu)
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu))
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileMenu?.getAttribute('aria-hidden') === 'false') closeMenu()
})

