/**
 * Подбор схемы перевозки.
 *
 * Два ползунка меняют деталь на макете: чем крупнее груз, тем крупнее
 * транспорт рядом с фигуркой постоянного размера — именно она даёт
 * физическое ощущение масштаба.
 *
 * Блок ничего не обещает. Пороги построены на габаритах стандартных
 * ISO-контейнеров — это публичный физический факт, а не обязательство
 * компании. Итог подаётся как ориентир, окончательную схему подтверждает
 * логист после проверки груза и маршрута.
 */

import anime from 'animejs'
import { ASSEMBLY_EASING, assemblyVector } from './assembly.js'

/**
 * Схемы перевозки от меньшей к большей. Первая подходящая выигрывает.
 *
 * ВНИМАНИЕ: пороги требуют подтверждения логистами заказчика.
 * Взяты по внутренним габаритам стандартных контейнеров:
 * 20 футов — около 5.9 м, 40 футов — около 12.0 м.
 */
const SCHEMES = [
  {
    id: 'groupage',
    maxLength: 1.5,
    maxWeight: 0.5,
    icon: '/icons/model/package.svg',
    name: 'Сборный груз',
    note: 'Небольшие партии отправляются в составе сборного груза.',
  },
  {
    id: 'air',
    maxLength: 3,
    maxWeight: 1.5,
    icon: '/icons/model/airplane-in-flight.svg',
    name: 'Авиаперевозка',
    note: 'Доступна для компактных и лёгких грузов, подходящих по условиям перевозки.',
  },
  {
    id: 'container-20',
    maxLength: 5.9,
    maxWeight: 21,
    icon: '/icons/model/shipping-container.svg',
    name: 'Контейнер 20 футов',
    note: 'Груз размещается в стандартном контейнере, доступны железная дорога и автоперевозка.',
  },
  {
    id: 'container-40',
    maxLength: 12,
    maxWeight: 26,
    icon: '/icons/model/shipping-container.svg',
    name: 'Контейнер 40 футов',
    note: 'Длинномерный груз в контейнере увеличенной длины, с доставкой до терминала или адреса.',
  },
  {
    id: 'oversize',
    maxLength: Infinity,
    maxWeight: Infinity,
    icon: '/icons/model/lowbed-platform.svg',
    name: 'Негабаритная перевозка',
    note: 'Для таких параметров маршрут, транспорт и разрешения подбираются индивидуально.',
  },
]

const pick = (length, weight) =>
  SCHEMES.find((scheme) => length <= scheme.maxLength && weight <= scheme.maxWeight) ?? SCHEMES[SCHEMES.length - 1]

const format = (value, unit) => `${value.toFixed(1).replace('.', ',')} ${unit}`

export function initCargoFit() {
  const section = document.querySelector('.fit-section')
  if (!section) return

  const lengthInput = section.querySelector('[data-fit-length]')
  const weightInput = section.querySelector('[data-fit-weight]')
  const lengthOut = section.querySelector('[data-fit-length-out]')
  const weightOut = section.querySelector('[data-fit-weight-out]')
  const transport = section.querySelector('[data-fit-transport]')
  const mount = section.querySelector('[data-fit-mount]')
  const figure = section.querySelector('.fit-scene__figure')
  const name = section.querySelector('[data-fit-name]')
  const note = section.querySelector('[data-fit-note]')
  const submit = section.querySelector('[data-fit-submit]')
  if (!lengthInput || !weightInput || !transport) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let current = null

  /** Смена детали идёт той же грамматикой, что и появление секций. */
  function swapTransport(scheme) {
    const apply = () => { transport.src = scheme.icon }

    if (reduced.matches) {
      apply()
      return
    }

    const vector = assemblyVector()
    anime({
      targets: transport,
      opacity: [1, 0],
      translateX: [0, vector.x],
      translateY: [0, vector.y],
      duration: 190,
      easing: 'easeInQuad',
      complete: () => {
        apply()
        anime({
          targets: transport,
          opacity: [0, 1],
          translateX: [-vector.x, 0],
          translateY: [-vector.y, 0],
          duration: 460,
          easing: ASSEMBLY_EASING,
        })
      },
    })
  }

  function update() {
    const length = Number(lengthInput.value)
    const weight = Number(weightInput.value)

    lengthOut.textContent = format(length, 'м')
    weightOut.textContent = format(weight, 'т')
    lengthInput.setAttribute('aria-valuetext', format(length, 'метра'))
    weightInput.setAttribute('aria-valuetext', format(weight, 'тонны'))

    // Масштаб меняется непрерывно, а не ступенями по схемам: иначе
    // движение ползунка внутри одной схемы ничего не делает на макете.
    const span = Number(lengthInput.max) - Number(lengthInput.min)
    const ratio = (length - Number(lengthInput.min)) / (span || 1)
    const scale = 0.52 + ratio * 0.92
    mount?.style.setProperty('--fit-scale', scale.toFixed(3))

    // Фигурка отходит вслед за правым краем растущего транспорта, иначе
    // на максимуме он на неё наезжает. Множители выведены из геометрии
    // сцены: mount сдвинут на -72% и масштабируется от центра низа.
    figure?.style.setProperty('--fit-figure-x', `${((scale * 0.5 - 0.63) * 100).toFixed(1)}%`)

    const scheme = pick(length, weight)

    if (scheme.id !== current) {
      current = scheme.id
      name.textContent = scheme.name
      note.textContent = scheme.note
      swapTransport(scheme)
    }

    // Кнопка переиспользует существующий диалог: описание груза уходит
    // в форму заранее заполненным, чтобы игра работала на заявку.
    submit.dataset.leadCargo =
      `Груз примерно ${format(length, 'м')} и ${format(weight, 'т')}. ` +
      `Предварительно подходит: ${scheme.name.toLowerCase()}. Прошу уточнить схему и стоимость.`
  }

  lengthInput.addEventListener('input', update)
  weightInput.addEventListener('input', update)
  update()
}
