/**
 * Сжатие изображений сайта в WebP.
 *
 * Hero-фоны приходят PNG по 2.4 МБ каждый, фотографии грузов — JPEG.
 * Скрипт пережимает их в WebP и при необходимости ограничивает разрешение
 * по фактическому размеру показа, чтобы не возить лишние пиксели.
 *
 * Качество проверяется не на глаз: для каждого файла считается доля
 * пикселей, отличающихся от оригинала заметнее порога различимости.
 *
 * Запуск: node scripts/compress-images.mjs
 */

import { chromium } from '@playwright/test'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = resolve('public/images')

/**
 * Что пережимаем. maxWidth — по фактическому размеру показа с запасом
 * на экраны с двойной плотностью.
 */
const TARGETS = [
  // Hero: фон первого экрана, растягивается на всю ширину вьюпорта.
  { file: 'hero-background-desktop-minimal.png', maxWidth: 2200, quality: 0.9 },
  { file: 'hero-background-mobile.png', maxWidth: 1200, quality: 0.9 },
  // Фотографии грузов: в галерее около 430px, в лайтбоксе до 1250px.
  { file: 'cargo-tracked-vehicle-container.jpg', maxWidth: 1400, quality: 0.84 },
  { file: 'cargo-tracked-vehicle-platform.jpg', maxWidth: 1400, quality: 0.84 },
  { file: 'cargo-mini-excavator-container.jpeg', maxWidth: 1400, quality: 0.84 },
  { file: 'cargo-all-terrain-container.jpg', maxWidth: 1400, quality: 0.84 },
  { file: 'cargo-road-roller-container.jpeg', maxWidth: 1400, quality: 0.84 },
  { file: 'cargo-vehicles-container.jpeg', maxWidth: 1400, quality: 0.84 },
]

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('about:blank')

let before = 0
let after = 0

for (const target of TARGETS) {
  const path = resolve(DIR, target.file)
  const ext = target.file.split('.').pop()
  const source = `data:${MIME[ext]};base64,${readFileSync(path).toString('base64')}`

  const result = await page.evaluate(
    async ({ src, maxWidth, quality }) => {
      const img = new Image()
      img.src = src
      await img.decode()

      const scale = Math.min(1, maxWidth / img.naturalWidth)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)
      const original = ctx.getImageData(0, 0, w, h).data

      const dataUrl = canvas.toDataURL('image/webp', quality)

      // Сравнение с оригиналом в том же разрешении: декодируем результат
      // обратно и считаем долю заметно отличающихся пикселей.
      const check = new Image()
      check.src = dataUrl
      await check.decode()
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(check, 0, 0)
      const encoded = ctx.getImageData(0, 0, w, h).data

      let visible = 0
      let sum = 0
      for (let i = 0; i < original.length; i += 4) {
        const diff = Math.max(
          Math.abs(original[i] - encoded[i]),
          Math.abs(original[i + 1] - encoded[i + 1]),
          Math.abs(original[i + 2] - encoded[i + 2]),
        )
        sum += diff
        // Порог 6 из 255 — ниже него разница не различима на глаз.
        if (diff > 6) visible += 1
      }

      return {
        dataUrl,
        size: `${img.naturalWidth}x${img.naturalHeight}`,
        out: `${w}x${h}`,
        visiblePct: ((visible / (original.length / 4)) * 100).toFixed(2),
        avgDiff: (sum / (original.length / 4)).toFixed(2),
      }
    },
    { src: source, maxWidth: target.maxWidth, quality: target.quality },
  )

  const bytes = Buffer.from(result.dataUrl.split(',')[1], 'base64')
  const outName = target.file.replace(/\.(png|jpe?g)$/, '.webp')
  const originalSize = statSync(path).size
  const wasKb = Math.round(originalSize / 1024)
  const nowKb = Math.round(bytes.length / 1024)

  // Хорошо сжатый JPEG иногда оказывается меньше WebP. Менять формат
  // ради роста веса бессмысленно — оставляем оригинал.
  if (bytes.length >= originalSize) {
    console.log(target.file.padEnd(38), `${result.size}`.padEnd(24), `${wasKb}KB — оригинал меньше, оставлен как есть`)
    before += wasKb
    after += wasKb
    continue
  }

  writeFileSync(resolve(DIR, outName), bytes)
  before += wasKb
  after += nowKb

  console.log(
    outName.padEnd(38),
    `${result.size} -> ${result.out}`.padEnd(24),
    `${wasKb}KB -> ${nowKb}KB`.padEnd(18),
    `заметная разница ${result.visiblePct}%, средняя ${result.avgDiff}`,
  )
}

await browser.close()
console.log(`\nИтого: ${before} KB -> ${after} KB (минус ${Math.round((1 - after / before) * 100)}%)`)
