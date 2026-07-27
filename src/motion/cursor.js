/**
 * Курсорное взаимодействие макета.
 *
 * Один слушатель pointermove на документ, дросселированный через rAF.
 * Пишет CSS-переменные, никакой работы со стилями по элементам:
 *
 *   --mx / --my   позиция курсора внутри детали, 0..1
 *   --lamp        яркость блика, падает с расстоянием до курсора
 *   --pull-x/y    магнитное смещение и наклон детали под курсором
 *   --lens-x/y    позиция линзы осмотра в hero
 *
 * Все эффекты — только transform, opacity и кастомные свойства.
 */

const LAMP_RADIUS = 620 // px, за пределами радиуса блик гаснет
const PULL_MAX = 5 // px, максимальное магнитное смещение
const TILT_MAX = 2.5 // deg, максимальный наклон детали

const PART_SELECTOR = [
  '.model-part',
  '.cargo-card',
  '.cargo-type',
  '.route-step',
  '.delivery-card',
  '.faq-list details',
  '.contact-actions > a',
  '.contact-actions__messengers button',
  '.button',
  '.header-cta',
  // Контейнер секции сам ничего не подсвечивает — ему нужны --mx/--my/--lamp
  // для измерительных меток вокруг курсора.
  '.section__container',
].join(', ')

const MAGNETIC_SELECTOR = '.cargo-type, .route-step, .delivery-card, .button, .header-cta'

const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value)

/**
 * Пересчитывает освещение и магнитный отклик для всех видимых деталей.
 * Прямоугольники берутся из кеша, который обновляется по scroll/resize,
 * чтобы pointermove не вызывал layout.
 */
function createEngine() {
  const parts = [...document.querySelectorAll(PART_SELECTOR)]
  if (!parts.length) return null

  const entries = parts.map((element) => ({
    element,
    magnetic: element.matches(MAGNETIC_SELECTOR),
    rect: null,
    lit: false,
  }))

  const hero = document.querySelector('.hero')

  let pointerX = 0
  let pointerY = 0
  let hasPointer = false
  let frame = 0

  const measure = () => {
    for (const entry of entries) entry.rect = entry.element.getBoundingClientRect()
  }

  const apply = () => {
    frame = 0

    for (const entry of entries) {
      const { element, rect } = entry
      if (!rect) continue

      // Детали вне вьюпорта не трогаем.
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) {
        if (entry.lit) {
          element.style.removeProperty('--lamp')
          element.style.removeProperty('--near')
          element.style.removeProperty('--pull-x')
          element.style.removeProperty('--pull-y')
          element.style.removeProperty('--tilt-x')
          element.style.removeProperty('--tilt-y')
          entry.lit = false
        }
        continue
      }

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = pointerX - centerX
      const dy = pointerY - centerY
      const distance = Math.hypot(dx, dy)

      // Блик гаснет квадратично — вблизи резко ярче, вдали ничего.
      const falloff = clamp01(1 - distance / LAMP_RADIUS)
      const lamp = hasPointer ? falloff * falloff : 0

      const inside =
        hasPointer &&
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom

      element.style.setProperty('--mx', clamp01((pointerX - rect.left) / rect.width).toFixed(3))
      element.style.setProperty('--my', clamp01((pointerY - rect.top) / rect.height).toFixed(3))
      element.style.setProperty('--lamp', lamp.toFixed(3))
      // Отдельный флаг «курсор внутри»: блик виден и издали, а чертёжные
      // метки должны появляться только под самим курсором.
      element.style.setProperty('--near', inside ? '1' : '0')

      if (entry.magnetic) {
        // Притяжение работает только когда курсор внутри детали:
        // иначе соседние карточки дрожат при проходе мыши мимо.
        const nx = inside ? clamp01((pointerX - rect.left) / rect.width) * 2 - 1 : 0
        const ny = inside ? clamp01((pointerY - rect.top) / rect.height) * 2 - 1 : 0

        element.style.setProperty('--pull-x', `${(nx * PULL_MAX).toFixed(2)}px`)
        element.style.setProperty('--pull-y', `${(ny * PULL_MAX).toFixed(2)}px`)
        // Наклон обратный смещению: деталь «прижимается» под пальцем.
        element.style.setProperty('--tilt-x', `${(-ny * TILT_MAX).toFixed(2)}deg`)
        element.style.setProperty('--tilt-y', `${(nx * TILT_MAX).toFixed(2)}deg`)
      }

      entry.lit = true
    }

    // Линза осмотра: координаты курсора внутри hero, в процентах.
    if (hero) {
      const heroRect = hero.getBoundingClientRect()
      if (heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
        hero.style.setProperty('--lens-x', `${(((pointerX - heroRect.left) / heroRect.width) * 100).toFixed(2)}%`)
        hero.style.setProperty('--lens-y', `${(((pointerY - heroRect.top) / heroRect.height) * 100).toFixed(2)}%`)
        hero.style.setProperty('--lens', hasPointer ? '1' : '0')
      }
    }
  }

  const schedule = () => {
    if (frame) return
    frame = window.requestAnimationFrame(apply)
  }

  return {
    measure,
    schedule,
    setPointer(x, y) {
      pointerX = x
      pointerY = y
      hasPointer = true
    },
    clearPointer() {
      hasPointer = false
    },
  }
}

export function initCursorMotion() {
  // Эффекты имеют смысл только для точного указателя и выключены,
  // если пользователь просил уменьшить движение.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const engine = createEngine()
  if (!engine) return

  document.documentElement.classList.add('cursor-ready')
  engine.measure()

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return
      engine.setPointer(event.clientX, event.clientY)
      engine.schedule()
    },
    { passive: true },
  )

  document.addEventListener('pointerleave', () => {
    engine.clearPointer()
    engine.schedule()
  })

  window.addEventListener(
    'scroll',
    () => {
      engine.measure()
      engine.schedule()
    },
    { passive: true },
  )

  let resizeFrame = 0
  window.addEventListener('resize', () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0
      engine.measure()
      engine.schedule()
    })
  })
}
