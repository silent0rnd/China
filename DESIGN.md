# DESIGN - Горизонт, единый тёмный логистический коридор

## 1. Visual Theme & Atmosphere

Тёмный логистический коридор для B2B-перевозок из Китая в Россию. Hero и последующие секции образуют одну холодную графитовую среду: крупная спокойная типографика, реальные фотографии рабочих перевозок, компактные технические пиктограммы, направленный свет и точечный красный маршрут как знак движения и контроля.

Ключевые признаки: индустриальная точность, асимметричная композиция, тёмная единая тема, статичная выразительность, красный акцент менее 5% площади, mobile как отдельная композиция.

## 2. Color Palette & Roles

| Role | Value | Usage |
|---|---|---|
| Background primary | #07090B | Основной фон |
| Background secondary | #0B0E11 | Плотные зоны |
| Surface | #101419 | Контролы |
| Text primary | #F1F3F4 | Заголовки и CTA |
| Text secondary | #A3A9AF | Пояснения |
| Text muted | #6E757C | Неведущие метки |
| Border | #2A3036 | Контуры |
| Accent | #A92B27 | Маршрут и активные детали |
| Accent hover | #C63A34 | Hover accent CTA |
| CTA light | #ECEEEF | Основной CTA hero |
| CTA text | #090B0D | Текст основного CTA |
| Focus | #D14A43 | Focus-visible |

`#F1F3F4` на `#07090B` и `#090B0D` на `#ECEEEF` проходят WCAG AA для обычного текста.

## 3. Typography Rules

| Role | Font | Size | Weight | Line height | Letter spacing |
|---|---|---:|---:|---:|---:|
| H1 | Golos Text, Arial, sans-serif | clamp(38px, 4.2vw, 76px) | 500 | 1.05 | -0.03em |
| Eyebrow | IBM Plex Mono, Consolas, monospace | 12px | 500 | 1.4 | 0.08em |
| Lead | Golos Text, Arial, sans-serif | 20px | 400 | 1.55 | 0 |
| Body | Golos Text, Arial, sans-serif | 16px | 400 | 1.6 | 0 |
| Button | Golos Text, Arial, sans-serif | 15px | 500 | 1 | 0 |

## 4. Component Stylings

Primary hero CTA: `#ECEEEF` background, `#090B0D` text, 56px height, 6px radius. Secondary CTA: transparent background, `#3A424A` border, `#F1F3F4` text. Hover повышает контраст, focus-visible использует 2px `#D14A43` ring, active сдвигает элемент на 1px вниз.

## 5. Layout Principles

- Main container: `min(1480px, calc(100vw - 96px))`.
- Wide grid: 12 columns, 24px gap; mobile: 4 columns, 12px gap.
- Desktop hero: текст 42-48%, сцена 52-58%, высота не менее 760px.
- Mobile: текст, CTA, факты, отдельная сцена. Боковые поля 20px, на 360px - 16px.

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| 0 | none | Базовый контент |
| 1 | inset 0 1px 0 rgba(255,255,255,.035) | Контуры |
| 2 | 0 18px 48px rgba(0,0,0,.28) | CTA и scene |
| 3 | 0 28px 72px rgba(0,0,0,.38) | Mobile menu |

## 7. Do's and Don'ts

- Использовать только холодные графитовые поверхности и один красный акцент.
- Сохранять асимметрию hero, галереи и ключевых секций.
- Связывать секции текстурой, реальными фотографиями и маршрутной линией.
- Категории грузов показывать компактными плитками с локальными Phosphor Icons без фотографий.
- Шесть этапов маршрута оживлять последовательной anime.js-анимацией и направленными hover-состояниями.
- Не повторять одну карточную сетку в нескольких секциях.
- Не использовать светлые секции, glassmorphism, 3D-объекты, яркие градиенты и стоковые фото.
- Не менять утверждённые copy, CTA, факты и mobile-порядок.

## 8. Responsive Behavior

| Range | Columns | Padding |
|---|---:|---:|
| 320-767 | 4 | 16-20px |
| 768-1023 | 8 | 24px |
| 1024-1439 | 12 | 32px |
| 1440+ | 12 | 48px |

Minimum touch target: 44px. Desktop navigation показывается от 1024px, mobile menu - ниже.

## 9. Agent Prompt Guide

Hero: тёмный `#07090B` фон, H1 Golos Text 500 с `clamp(38px, 4.2vw, 76px)`, направление текста слева и утверждённая логистическая сцена справа. Последующие блоки продолжают ту же индустриальную среду через асимметричные реальные фотографии, компактные пиктограммы категорий, тонкие металлические границы и маршрутную линию. Основной CTA `#ECEEEF` с тёмным текстом, secondary CTA прозрачный с границей `#3A424A`. Красный `#A92B27` используется только в маршрутных точках, hover и focus.
