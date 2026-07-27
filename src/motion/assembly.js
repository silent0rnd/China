/**
 * Грамматика появления «сборка макета».
 *
 * Деталь прилетает вдоль изометрической оси, слегка уменьшенная, и встаёт
 * на стол с коротким овершутом. Задержки считаются по положению в
 * пространстве, а не по порядку в DOM, — как если бы детали расставляли рукой.
 *
 * Модуль общий для секций, диорамы маршрута и подбора транспорта.
 */

import anime from 'animejs'

export const ASSEMBLY_EASING = 'cubicBezier(.16, 1, .3, 1)'

/**
 * Изометрический вектор, вдоль которого детали прилетают на стол.
 * Берётся из тех же токенов, что и геометрия макета в CSS.
 */
export function assemblyVector() {
  const styles = window.getComputedStyle(document.documentElement)
  const root = parseFloat(styles.fontSize) || 16
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
 * Задержки по пространственному положению: сборка идёт от левого верхнего
 * угла к правому нижнему.
 */
export function spatialDelay(elements, step = 62, start = 0) {
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
export function clearInline(elements) {
  elements.forEach((element) => {
    element.style.removeProperty('opacity')
    element.style.removeProperty('transform')
  })
}

/** Появление детали: прилёт вдоль изометрической оси с овершутом. */
export function assemble(targets, { step = 62, start = 0, duration = 620, complete } = {}) {
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

/**
 * «По столу стукнули»: детали подпрыгивают и оседают обратно.
 * Используется пасхалкой — механика та же, что у сборки, поэтому живёт здесь.
 */
export function bumpTable(targets, { step = 26 } = {}) {
  const elements = [...targets]
  if (!elements.length) return null

  const delayFor = spatialDelay(elements, step)

  return anime({
    targets: elements,
    translateY: [
      { value: -14, duration: 190, easing: 'easeOutQuad' },
      { value: 0, duration: 620, easing: 'easeOutElastic(1, .42)' },
    ],
    rotate: [
      { value: () => anime.random(-15, 15) / 10, duration: 190 },
      { value: 0, duration: 620, easing: 'easeOutElastic(1, .38)' },
    ],
    delay: (element) => delayFor(element),
    complete: () => clearInline(elements),
  })
}
