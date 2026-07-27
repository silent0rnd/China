/**
 * Живая диорама маршрута.
 *
 * Дорога строится по фактическим позициям станций, а не по захардкоженным
 * координатам: на 6 колонках это прямая, на 3 — змейка через два ряда,
 * на мобильном — вертикаль. Одна логика покрывает все брейкпоинты.
 *
 * Фура едет по этому пути под управлением прокрутки: позиция берётся из
 * прогресса секции через вьюпорт, точка на пути — из getPointAtLength().
 * Пройденные станции получают .is-lit.
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Скругление углов змейки: половина расстояния между рядами, но не больше. */
const CORNER = 26

/**
 * Строит команду пути со скруглёнными углами.
 * Прямые участки соединяются короткими дугами, иначе на змейке
 * получаются острые углы, которых на модельной разводке не бывает.
 */
function roundedPath(pts) {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`

  let d = `M ${pts[0].x} ${pts[0].y}`

  for (let i = 1; i < pts.length - 1; i += 1) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const next = pts[i + 1]

    const inLen = Math.hypot(curr.x - prev.x, curr.y - prev.y)
    const outLen = Math.hypot(next.x - curr.x, next.y - curr.y)
    const r = Math.min(CORNER, inLen / 2, outLen / 2)

    if (r < 1) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const inX = curr.x - ((curr.x - prev.x) / inLen) * r
    const inY = curr.y - ((curr.y - prev.y) / inLen) * r
    const outX = curr.x + ((next.x - curr.x) / outLen) * r
    const outY = curr.y + ((next.y - curr.y) / outLen) * r

    d += ` L ${inX.toFixed(1)} ${inY.toFixed(1)} Q ${curr.x} ${curr.y} ${outX.toFixed(1)} ${outY.toFixed(1)}`
  }

  const last = pts[pts.length - 1]
  return `${d} L ${last.x} ${last.y}`
}

export function initRouteDiorama() {
  const section = document.querySelector('.route-section')
  const list = document.querySelector('.route-steps')
  const steps = [...document.querySelectorAll('.route-step')]
  if (!section || !list || steps.length < 2) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('class', 'route-road')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('preserveAspectRatio', 'none')

  // Полотно и осевая разметка — два слоя одной дороги. Прочерчивание
  // сделано маской, а не dash-массивом самих линий: иначе пришлось бы
  // выбирать между эффектом появления и пунктиром разметки.
  const defs = document.createElementNS(SVG_NS, 'defs')
  const mask = document.createElementNS(SVG_NS, 'mask')
  mask.setAttribute('id', 'route-reveal')
  // userSpaceOnUse обязателен: на шести колонках дорога — строго горизонтальная
  // линия с нулевой высотой bbox, и маска в objectBoundingBox схлопывается,
  // скрывая всю дорогу целиком.
  mask.setAttribute('maskUnits', 'userSpaceOnUse')
  const reveal = document.createElementNS(SVG_NS, 'path')
  reveal.setAttribute('class', 'route-road__reveal')
  mask.append(reveal)
  defs.append(mask)

  const group = document.createElementNS(SVG_NS, 'g')
  group.setAttribute('mask', 'url(#route-reveal)')
  // Обочина тёмная, полотно чуть светлее, поверх — осевая разметка.
  const kerb = document.createElementNS(SVG_NS, 'path')
  kerb.setAttribute('class', 'route-road__kerb')
  const bed = document.createElementNS(SVG_NS, 'path')
  bed.setAttribute('class', 'route-road__bed')
  const dashes = document.createElementNS(SVG_NS, 'path')
  dashes.setAttribute('class', 'route-road__dashes')
  group.append(kerb, bed, dashes)
  svg.append(defs, group)

  const truck = document.createElement('img')
  truck.className = 'route-truck'
  truck.src = '/icons/model/truck.svg'
  truck.alt = ''
  truck.setAttribute('aria-hidden', 'true')
  truck.width = 128
  truck.height = 128

  list.prepend(svg)
  list.append(truck)

  let path = null
  let pathLength = 0
  let stationAt = []
  let rowBreaks = []
  let frame = 0

  /** Пересобирает дорогу по текущим позициям фонарей станций. */
  function measure() {
    const listRect = list.getBoundingClientRect()
    if (!listRect.width || !listRect.height) return

    svg.setAttribute('viewBox', `0 0 ${listRect.width} ${listRect.height}`)
    mask.setAttribute('x', '0')
    mask.setAttribute('y', '0')
    mask.setAttribute('width', `${listRect.width}`)
    mask.setAttribute('height', `${listRect.height}`)

    // Фонарь станции задан в CSS псевдоэлементом, поэтому берём его
    // геометрию из тех же величин: отступ слева и сверху внутри плиты.
    const stations = steps.map((step) => {
      const rect = step.getBoundingClientRect()
      const styles = window.getComputedStyle(step, '::before')
      const left = parseFloat(styles.left) || 0
      const top = parseFloat(styles.top) || 0
      const size = parseFloat(styles.width) || 8

      return {
        x: Math.round(rect.left - listRect.left + left + size / 2),
        y: Math.round(rect.top - listRect.top + top + size / 2),
      }
    })

    // Станции группируются в ряды. Соединять ряды видимой линией нельзя:
    // любая такая линия пересекает карточки насквозь. Поэтому дорога
    // рисуется отдельным участком на каждый ряд — одним path с несколькими
    // подпутями. Фура на стыке уезжает за край и появляется слева,
    // как на модельной раскладке, где перегон уходит под стол.
    // Признак переноса — возврат влево, а не смена y. На мобильном станции
    // стоят одна под другой с тем же x: это одна вертикальная дорога,
    // а не шесть отдельных участков.
    const rows = []
    stations.forEach((point, index) => {
      const previous = stations[index - 1]
      if (!previous || point.x < previous.x - 4) rows.push([])
      rows[rows.length - 1].push({ ...point, station: index })
    })

    const d = rows.map((row) => roundedPath(row)).join(' ')
    kerb.setAttribute('d', d)
    bed.setAttribute('d', d)
    dashes.setAttribute('d', d)
    reveal.setAttribute('d', d)

    path = bed
    pathLength = path.getTotalLength()

    // Длины вдоль пути. Подпути в SVG идут подряд, поэтому dash-offset маски
    // проходит их последовательно, а getPointAtLength на стыке прыгает —
    // это и есть нужный «уехала и появилась».
    const accumulated = []
    rowBreaks = []
    let acc = 0
    rows.forEach((row, rowIndex) => {
      row.forEach((point, index) => {
        if (index > 0) acc += Math.hypot(point.x - row[index - 1].x, point.y - row[index - 1].y)
        accumulated[point.station] = acc
      })
      if (rowIndex < rows.length - 1) rowBreaks.push(acc)
    })

    const total = acc || 1
    const scale = pathLength / total
    stationAt = accumulated.map((value) => value * scale)
    rowBreaks = rowBreaks.map((value) => value * scale)

    reveal.style.strokeDasharray = `${pathLength}`
  }

  /** Прогресс прокрутки секции через вьюпорт, 0..1. */
  function scrollProgress() {
    const rect = section.getBoundingClientRect()
    const viewport = window.innerHeight
    // Отсчёт начинается, когда секция вошла на треть экрана, и заканчивается,
    // когда её низ подходит к низу экрана: фура проезжает ровно за то время,
    // пока пользователь смотрит на секцию.
    const start = viewport * 0.72
    const end = -rect.height + viewport * 0.55
    const span = start - end || 1
    return Math.min(1, Math.max(0, (start - rect.top) / span))
  }

  function apply() {
    frame = 0
    if (!path || !pathLength) return

    const progress = reduced.matches ? 1 : scrollProgress()
    const travelled = pathLength * progress

    // Дорога открывается маской ровно до места, где сейчас фура.
    reveal.style.strokeDashoffset = `${pathLength - travelled}`

    const point = path.getPointAtLength(travelled)
    // Направление движения — для разворота фуры на обратном участке змейки.
    const ahead = path.getPointAtLength(Math.min(pathLength, travelled + 8))
    const backwards = ahead.x < point.x - 0.5

    truck.style.transform = `translate3d(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px, 0) translate(-50%, -62%) scaleX(${backwards ? -1 : 1})`

    // На стыке рядов фура гаснет и зажигается уже в начале следующего ряда:
    // перегон между рядами по легенде уходит под стол.
    const nearBreak = rowBreaks.some((at) => Math.abs(travelled - at) < 26)
    truck.style.opacity = progress > 0.004 && !nearBreak ? '1' : '0'

    steps.forEach((step, index) => {
      step.classList.toggle('is-lit', travelled >= stationAt[index] - 2)
    })
  }

  function schedule() {
    if (frame) return
    frame = window.requestAnimationFrame(apply)
  }

  measure()
  apply()

  window.addEventListener('scroll', schedule, { passive: true })

  let resizeFrame = 0
  window.addEventListener('resize', () => {
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0
      measure()
      apply()
    })
  })

  // Шрифты и ленивые картинки меняют высоту плит уже после первого замера.
  window.addEventListener('load', () => {
    measure()
    apply()
  })
}
