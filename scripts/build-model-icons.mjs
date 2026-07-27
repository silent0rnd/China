/**
 * Генератор изометрических деталей макета.
 *
 * Каждая иконка — набор коробок в дметрической проекции 2:1. Направление света
 * совпадает с --light-angle в src/styles/main.css, поэтому детали выглядят
 * снятыми в той же сцене, что и hero-макет.
 *
 * Плоская заливка граней — главное, что выдаёт вектор, поэтому каждая грань
 * получает четыре признака объёма:
 *   1. градиент вдоль направления света (светлее к источнику);
 *   2. затемнение к основанию — приближение ambient occlusion;
 *   3. контровой блик по верхним рёбрам, обращённым к лампе;
 *   4. мягкая размытая контактная тень вместо жёсткого эллипса.
 *
 * Запуск: node scripts/build-model-icons.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'public/icons/model')

const SIZE = 128
const ORIGIN_X = SIZE / 2
const ORIGIN_Y = 80
const UNIT = 10.5 // ширина одной модельной единицы в пикселях

/** Грани материала. Свет падает сверху-слева, как на макете. */
const FACE = {
  top: '#5b6774',
  left: '#333d47',
  right: '#1b2229',
}

/** Тёплая подсветка для габаритных огней и ламп. */
const GLOW = '#c9a068'
const SIGNAL = '#a92b27'

/** Дметрическая проекция 2:1. */
const project = (x, y, z) => [
  ORIGIN_X + (x - y) * UNIT,
  ORIGIN_Y + (x + y) * UNIT * 0.5 - z * UNIT,
]

const points = (list) => list.map(([x, y, z]) => project(x, y, z).map((n) => n.toFixed(2)).join(',')).join(' ')

/* --- Работа с цветом: из одного тона выводим светлый и тёмный край грани --- */

const clampByte = (n) => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n))

function shade(hex, factor) {
  const value = parseInt(hex.slice(1), 16)
  const r = clampByte(((value >> 16) & 255) * factor)
  const g = clampByte(((value >> 8) & 255) * factor)
  const b = clampByte((value & 255) * factor)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/**
 * Градиенты граней. Собираются лениво по мере использования цветов,
 * чтобы в defs каждого файла попали только реально нужные.
 */
const gradients = new Map()

/**
 * Перепад внутри грани. Верхняя грань смотрит в лампу, поэтому у неё
 * самый широкий диапазон; боковые уходят в тень к основанию.
 */
const FACE_RANGE = {
  top: [1.34, 0.74],
  left: [1.2, 0.62],
  right: [1.16, 0.58],
}

function gradientFor(hex, kind) {
  const id = `g${kind[0]}${hex.slice(1)}`
  if (!gradients.has(id)) {
    const [light, dark] = FACE_RANGE[kind]
    // Верхняя грань освещается по диагонали, боковые — сверху вниз:
    // так основание детали садится в собственную тень.
    const vector = kind === 'top' ? 'x1="0" y1="0" x2="0.85" y2="1"' : 'x1="0" y1="0" x2="0.25" y2="1"'
    gradients.set(
      id,
      `<linearGradient id="${id}" ${vector}><stop offset="0" stop-color="${shade(hex, light)}"/><stop offset="1" stop-color="${shade(hex, dark)}"/></linearGradient>`,
    )
  }
  return `url(#${id})`
}

const face = (list, fill) => `<polygon points="${points(list)}" fill="${fill}"/>`

/**
 * Коробка от (x, y, z) размером (w, d, h).
 * Рисуются только три видимые грани — правая, левая и верхняя.
 */
function box(x, y, z, w, d, h, tint = FACE) {
  const x2 = x + w
  const y2 = y + d
  const z2 = z + h

  // Самая близкая к лампе вершина верхней грани — угол (x, y).
  // По двум сходящимся в ней рёбрам идёт контровой блик.
  const rim = points([[x2, y, z2], [x, y, z2], [x, y2, z2]])

  return [
    // правая грань (уходит от света)
    face([[x2, y, z], [x2, y2, z], [x2, y2, z2], [x2, y, z2]], gradientFor(tint.right, 'right')),
    // левая грань
    face([[x, y2, z], [x2, y2, z], [x2, y2, z2], [x, y2, z2]], gradientFor(tint.left, 'left')),
    // верхняя грань (ловит свет)
    face([[x, y, z2], [x2, y, z2], [x2, y2, z2], [x, y2, z2]], gradientFor(tint.top, 'top')),
    // контровой блик по верхним рёбрам
    `<polyline points="${rim}" fill="none" stroke="#dfe4ea" stroke-width="0.7" stroke-linejoin="round" opacity="0.26"/>`,
    // затемнение в стыке граней: приближение ambient occlusion
    `<line x1="${project(x2, y, z)[0].toFixed(2)}" y1="${project(x2, y, z)[1].toFixed(2)}" x2="${project(x2, y, z2)[0].toFixed(2)}" y2="${project(x2, y, z2)[1].toFixed(2)}" stroke="#000" stroke-width="0.9" opacity="0.3"/>`,
  ].join('')
}

/** Светящееся пятно с ореолом — фара, лампа, сигнал. */
function lamp(x, y, z, color, radius = 2.4) {
  const [sx, sy] = project(x, y, z)
  const cx = sx.toFixed(2)
  const cy = sy.toFixed(2)
  return (
    `<circle cx="${cx}" cy="${cy}" r="${(radius * 2.4).toFixed(1)}" fill="${color}" opacity="0.13"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}" opacity="0.9"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${(radius * 0.42).toFixed(1)}" fill="#fff" opacity="0.5"/>`
  )
}

/** Мягкая контактная тень под деталью — эллипс на плоскости стола. */
function contactShadow(x, y, rx = 26, ry = 11) {
  const [sx, sy] = project(x, y, 0)
  const scale = UNIT / 7
  // Тень смещена от лампы: источник сверху-слева, значит тень уходит вправо-вниз.
  return `<ellipse cx="${(sx + 2.5).toFixed(2)}" cy="${(sy + 2).toFixed(2)}" rx="${(rx * scale).toFixed(1)}" ry="${(ry * scale).toFixed(1)}" fill="url(#contact)" filter="url(#soften)"/>`
}

const tint = (top, left, right) => ({ top, left, right })
const ACCENT = tint('#8f3330', '#6d2523', '#4a1917')

const ICONS = {
  /* --- Категории грузов --- */

  // Бульдозер. Порядок отрисовки — от дальнего к ближнему (по сумме x+y),
  // иначе отвал уходит под корпус. Силуэт держат высокий отвал спереди
  // и кабина сзади: на 43px читается только он, мелкие детали пропадают.
  bulldozer: () =>
    contactShadow(0, 0, 28, 12) +
    box(-2.4, -1.9, 0, 4.2, 0.85, 1) + // гусеница дальняя
    box(-2, -1, 1, 3.4, 2, 1.15) + // корпус
    box(-1.5, -0.6, 2.15, 1.9, 1.2, 1.7) + // кабина
    box(-2.4, 1.05, 0, 4.2, 0.85, 1) + // гусеница ближняя
    box(1.9, -2.1, 0.15, 0.55, 4.2, 2.5) + // отвал
    box(1.75, -2.1, 0.15, 0.2, 4.2, 0.5) + // нож отвала
    lamp(-0.6, -0.6, 3.85, GLOW, 2),

  // Кран: основание, мачта, стрела, крюк.
  crane: () =>
    contactShadow(0, 0, 24, 10) +
    box(-1.6, -1.6, 0, 3.2, 3.2, 0.6) + // основание
    box(-0.7, -0.7, 0.6, 1.4, 1.4, 4.4) + // мачта
    box(-0.5, -0.5, 5, 4.6, 1, 0.5) + // стрела
    box(-2.4, -0.4, 5, 1.4, 0.8, 0.4) + // противовес
    `<line x1="${project(3.8, 0, 5)[0].toFixed(2)}" y1="${project(3.8, 0, 5)[1].toFixed(2)}" x2="${project(3.8, 0, 1.8)[0].toFixed(2)}" y2="${project(3.8, 0, 1.8)[1].toFixed(2)}" stroke="${FACE.top}" stroke-width="1.1" opacity="0.7"/>` +
    box(3.4, -0.4, 1.1, 0.8, 0.8, 0.7),

  // Промышленное оборудование: станина, портал, труба.
  factory: () =>
    contactShadow(0, 0, 27, 11) +
    box(-2.4, -2.2, 0, 4.8, 4.4, 0.8) + // станина
    box(-2, -1.8, 0.8, 1.4, 3.6, 2.6) + // левая стойка
    box(0.8, -1.8, 0.8, 1.4, 3.6, 2.6) + // правая стойка
    box(-2, -1.8, 3.4, 4.2, 3.6, 0.7) + // портал
    box(-0.5, -0.5, 4.1, 1, 1, 1.9) + // труба
    lamp(-1.3, -1.9, 2.2, SIGNAL, 2),

  // Морской контейнер: корпус с рёбрами и створками.
  'shipping-container': () =>
    contactShadow(0, 0, 29, 12) +
    box(-3.2, -1.5, 0, 6.4, 3, 2.8) +
    // рёбра жёсткости на левой грани
    [-2.2, -1.1, 0, 1.1, 2.2]
      .map((x) => face([[x, 1.5, 0.15], [x + 0.22, 1.5, 0.15], [x + 0.22, 1.5, 2.65], [x, 1.5, 2.65]], '#1f272e'))
      .join('') +
    // створки на торце
    face([[3.2, -1.5, 0.2], [3.2, 0, 0.2], [3.2, 0, 2.6], [3.2, -1.5, 2.6]], '#12181d') +
    face([[3.2, 0, 0.2], [3.2, 1.5, 0.2], [3.2, 1.5, 2.6], [3.2, 0, 2.6]], '#12181d'),

  /* --- Этапы маршрута --- */

  // Планшет с параметрами груза.
  'clipboard-text': () =>
    contactShadow(0, 0, 22, 9) +
    box(-2, -2.6, 0, 4, 5.2, 0.35) +
    box(-1.5, -2, 0.35, 3, 4, 0.12, tint('#525d69', '#333d47', '#212930')) +
    box(-0.6, -2.9, 0.2, 1.2, 0.5, 0.45, ACCENT) +
    [-1.2, -0.3, 0.6, 1.5]
      .map((y) => face([[-1.1, y, 0.48], [1.1, y, 0.48], [1.1, y + 0.22, 0.48], [-1.1, y + 0.22, 0.48]], '#1b222a'))
      .join(''),

  // Телефонная трубка на базе. Трубка поднята над базой и сдвинута,
  // чтобы просвет под ней читался и силуэт не сливался в один блок.
  'phone-call': () =>
    contactShadow(0, 0, 22, 9) +
    box(-2.1, -1.5, 0, 4.2, 3, 0.6) + // база
    box(-1.5, -0.9, 0.6, 0.7, 1.8, 0.5, tint('#2a333c', '#1b2229', '#12171c')) + // ложемент
    box(0.8, -0.9, 0.6, 0.7, 1.8, 0.5, tint('#2a333c', '#1b2229', '#12171c')) +
    box(-1.75, -1.15, 1.5, 1.05, 2.3, 1.15) + // рожок трубки
    box(0.7, -1.15, 1.5, 1.05, 2.3, 1.15) +
    box(-1.4, -0.55, 2.05, 2.8, 1.1, 0.6) + // ручка трубки
    lamp(1.65, -1.15, 2.75, GLOW, 2),

  // Упакованный груз на поддоне.
  package: () =>
    contactShadow(0, 0, 24, 10) +
    box(-2.4, -2.4, 0, 4.8, 4.8, 0.5) + // поддон
    box(-1.9, -1.9, 0.5, 3.8, 3.8, 2.6) + // коробка
    // обвязка
    face([[-0.25, -1.9, 3.1], [0.25, -1.9, 3.1], [0.25, 1.9, 3.1], [-0.25, 1.9, 3.1]], '#5b4a33') +
    face([[-1.9, -0.25, 3.1], [1.9, -0.25, 3.1], [1.9, 0.25, 3.1], [-1.9, 0.25, 3.1]], '#5b4a33'),

  // Тягач с полуприцепом.
  truck: () =>
    contactShadow(0.3, 0, 30, 12) +
    box(-3.4, -1.3, 0.35, 4.2, 2.6, 2.4) + // полуприцеп
    box(1, -1.2, 0.35, 2.2, 2.4, 1.9) + // кабина
    box(0.9, -1.2, 2.25, 1.5, 2.4, 0.5) + // спальник
    box(-3.2, -1.45, 0, 1, 2.9, 0.55) + // колёсная тележка
    box(1.2, -1.45, 0, 1, 2.9, 0.55) +
    lamp(3.2, -0.85, 0.8, GLOW, 2.2) +
    lamp(3.2, 0.85, 0.8, GLOW, 2.2) +
    lamp(-3.4, -0.9, 0.7, SIGNAL, 1.8) +
    lamp(-3.4, 0.9, 0.7, SIGNAL, 1.8),

  // Штамп таможенного оформления.
  stamp: () =>
    contactShadow(0, 0, 22, 9) +
    box(-2.2, -2.2, 0, 4.4, 4.4, 0.3) + // подушка
    box(-1.3, -1.3, 0.3, 2.6, 2.6, 0.7, ACCENT) + // оттиск
    box(-0.9, -0.9, 1, 1.8, 1.8, 0.9) + // основание ручки
    box(-0.45, -0.45, 1.9, 0.9, 0.9, 1.4) + // ручка
    box(-0.9, -0.9, 3.3, 1.8, 1.8, 0.5),

  // Метка конечной точки на плите.
  'map-pin-line': () =>
    contactShadow(0, 0, 22, 9) +
    box(-2.4, -2.4, 0, 4.8, 4.8, 0.35) +
    box(-0.55, -0.55, 0.35, 1.1, 1.1, 2.6) +
    box(-1, -1, 2.95, 2, 2, 1, ACCENT) +
    lamp(0, 0, 4.1, SIGNAL, 2),

  /* --- Способы доставки --- */

  // Железнодорожный вагон на рельсах.
  train: () =>
    contactShadow(0, 0, 30, 12) +
    // рельсы
    face([[-4.4, -1.2, 0.05], [4.4, -1.2, 0.05], [4.4, -0.9, 0.05], [-4.4, -0.9, 0.05]], '#2d353d') +
    face([[-4.4, 0.9, 0.05], [4.4, 0.9, 0.05], [4.4, 1.2, 0.05], [-4.4, 1.2, 0.05]], '#2d353d') +
    box(-3.6, -1.5, 0.15, 1.1, 3, 0.5) + // тележки
    box(2.5, -1.5, 0.15, 1.1, 3, 0.5) +
    box(-3.9, -1.3, 0.65, 7.8, 2.6, 2.3) + // кузов
    box(-3.9, -1.3, 2.95, 7.8, 2.6, 0.3, tint('#4a555f', '#2d363f', '#1b2229')) +
    lamp(3.9, -0.8, 1.6, GLOW, 2.1) +
    lamp(3.9, 0.8, 1.6, GLOW, 2.1),

  // Самолёт на стояночной полосе.
  'airplane-in-flight': () =>
    contactShadow(0, 0, 30, 12) +
    box(-3.8, -0.75, 1.2, 7.6, 1.5, 1.5) + // фюзеляж
    box(-0.9, -3.8, 1.5, 1.6, 7.6, 0.35, tint('#4a555f', '#2d363f', '#1b2229')) + // крыло
    box(-3.6, -1.7, 1.9, 0.9, 3.4, 0.3, tint('#4a555f', '#2d363f', '#1b2229')) + // стабилизатор
    box(-3.5, -0.3, 2.7, 0.8, 0.6, 1.5) + // киль
    box(-0.6, -2.6, 0.6, 1, 0.8, 0.9) + // двигатели
    box(-0.6, 1.8, 0.6, 1, 0.8, 0.9) +
    lamp(3.8, 0, 1.9, GLOW, 2.2) +
    lamp(0, -3.8, 1.75, SIGNAL, 1.8),
}

/**
 * Тело иконки строится первым: по ходу отрисовки регистрируются градиенты
 * граней, и только после этого можно собрать defs.
 */
function render(body) {
  const faceGradients = [...gradients.values()].join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" role="img" aria-hidden="true">
  <defs>
    <radialGradient id="contact">
      <stop offset="0%" stop-color="#000" stop-opacity="0.62"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <filter id="soften" x="-40%" y="-60%" width="180%" height="220%">
      <feGaussianBlur stdDeviation="2.2"/>
    </filter>
    ${faceGradients}
  </defs>
  ${body}
</svg>
`
}

mkdirSync(OUT_DIR, { recursive: true })

for (const [name, build] of Object.entries(ICONS)) {
  gradients.clear()
  const body = build()
  writeFileSync(resolve(OUT_DIR, `${name}.svg`), render(body), 'utf8')
}

console.log(`Собрано деталей: ${Object.keys(ICONS).length} -> public/icons/model/`)
