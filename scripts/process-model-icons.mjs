/**
 * Обработка сгенерированных деталей макета.
 *
 * Исходники приходят разного размера и с разным полем вокруг объекта.
 * Скрипт приводит их к одному виду:
 *   1. обрезает по фактическим границам непрозрачных пикселей;
 *   2. вписывает объект в квадрат так, чтобы у всех была одинаковая
 *      зрительная величина и одинаковое поле;
 *   3. сохраняет в WebP — растровые иконки иначе весят десятки мегабайт.
 *
 * Исходники лежат в references/icons-source/ и в сборку не попадают.
 *
 * Запуск: node scripts/process-model-icons.mjs
 */

import { chromium } from '@playwright/test'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_DIR = resolve('references/icons-source')
const OUT_DIR = resolve('public/icons/model')

const CANVAS = 512
/**
 * Нормализация по площади, а не по большей стороне.
 *
 * По большей стороне широкий объект (бульдозер, трал) получает полную ширину
 * при малой высоте, а высокий (кран, планшет) — полную высоту. Зрительный вес
 * при этом расходится в разы, и в карточках иконки выглядят разного масштаба.
 * Приведение по корню из площади уравнивает именно воспринимаемую величину.
 *
 * FILL — сторона квадрата равной площади, LIMIT — предел по любой стороне,
 * чтобы вытянутые детали не упирались в край холста.
 */
const FILL = 0.74
const LIMIT = 0.97
/** Поле под объектом. Объект прижат к низу, а не центрирован по вертикали:
 *  только так у всех деталей совпадает линия земли, когда в вёрстке они
 *  выравниваются по нижнему краю. */
const GROUND_PAD = 0.06
const QUALITY = 0.86

const files = readdirSync(SRC_DIR).filter((f) => f.endsWith('.png'))
if (!files.length) {
  console.log('Исходных PNG не найдено — обрабатывать нечего.')
  process.exit(0)
}

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('about:blank')

const report = []

for (const file of files) {
  const result = await page.evaluate(
    async ({ source, canvasSize, fill, limit, quality, groundPad }) => {
      const img = new Image()
      img.src = source
      await img.decode()

      const probe = document.createElement('canvas')
      probe.width = img.naturalWidth
      probe.height = img.naturalHeight
      const pctx = probe.getContext('2d', { willReadFrequently: true })
      pctx.drawImage(img, 0, 0)
      const data = pctx.getImageData(0, 0, probe.width, probe.height).data

      // Границы объекта по альфе. Порог 10, чтобы мягкая тень попала в кадр,
      // но шум по краям не растягивал рамку.
      let minX = probe.width
      let minY = probe.height
      let maxX = -1
      let maxY = -1
      for (let y = 0; y < probe.height; y += 1) {
        for (let x = 0; x < probe.width; x += 1) {
          if (data[(y * probe.width + x) * 4 + 3] > 10) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }
      if (maxX < 0) return null

      const cropW = maxX - minX + 1
      const cropH = maxY - minY + 1

      // Сторона квадрата равной площади приводится к canvasSize * fill,
      // затем результат ограничивается по длинной стороне.
      const areaScale = (canvasSize * fill) / Math.sqrt(cropW * cropH)
      const scale = Math.min(
        areaScale,
        (canvasSize * limit) / cropW,
        (canvasSize * limit) / cropH,
      )
      const drawW = cropW * scale
      const drawH = cropH * scale

      const out = document.createElement('canvas')
      out.width = canvasSize
      out.height = canvasSize
      const octx = out.getContext('2d')
      octx.imageSmoothingQuality = 'high'
      octx.drawImage(
        img,
        minX, minY, cropW, cropH,
        (canvasSize - drawW) / 2, canvasSize - canvasSize * groundPad - drawH, drawW, drawH,
      )

      return {
        dataUrl: out.toDataURL('image/webp', quality),
        size: `${probe.width}x${probe.height}`,
        content: `${cropW}x${cropH}`,
        drawn: `${Math.round(drawW)}x${Math.round(drawH)}`,
        // Пропорция объекта нужна для калибровки масштаба в блоке подбора.
        ratio: (cropW / cropH).toFixed(2),
      }
    },
    {
      // Исходник передаётся data-URL: так скрипту не нужен запущенный сервер,
      // а canvas не упирается в запрет чтения пикселей из file://.
      source: `data:image/png;base64,${readFileSync(resolve(SRC_DIR, file)).toString('base64')}`,
      canvasSize: CANVAS,
      fill: FILL,
      limit: LIMIT,
      quality: QUALITY,
      groundPad: GROUND_PAD,
    },
  )

  if (!result) {
    console.log(`ПРОПУЩЕН ${file}: непрозрачных пикселей не найдено`)
    continue
  }

  const base = file.replace(/\.png$/, '')
  const bytes = Buffer.from(result.dataUrl.split(',')[1], 'base64')
  writeFileSync(resolve(OUT_DIR, `${base}.webp`), bytes)

  report.push({ base, ...result, kb: Math.round(bytes.length / 1024) })
}

await browser.close()

const total = report.reduce((sum, row) => sum + row.kb, 0)
for (const row of report) {
  console.log(row.base.padEnd(24), row.size.padEnd(11), '->', row.drawn.padEnd(10), 'w/h', row.ratio.padEnd(6), row.kb + 'KB')
}
console.log(`\nГотово: ${report.length} иконок, суммарно ${total} KB -> public/icons/model/`)
