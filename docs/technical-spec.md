---
status: In review
version: 1.0
prepared_at: 2026-07-22
approved_at: null
supersedes: none
---

# Technical Specification

## 1. Назначение

Техническая спецификация рекламного лендинга ООО «Горизонт» по доставке спецтехники, тяжёлых, негабаритных грузов, промышленного оборудования и контейнеров из Китая в Россию.

Документ определяет архитектуру реализации, формы, backend, аналитику, безопасность, SEO, производительность, адаптивность и порядок работы Codex. Разработка сайта на этом этапе не начинается.

## 2. Источники истины

Приоритет:

1. Актуальный `PROJECT_STATE.md`.
2. `strategy-spec.md`, status `Approved`, version 1.0.
3. `page-spec.md`, status `Approved`, version 1.0.
4. `design-spec.md`, status `Approved`, version 1.0.
5. Утверждённые изображения в `/references/`.
6. Подтверждённые материалы старого лендинга и реальные фотографии грузов.

Контрольные изображения определяют стиль и композицию, но не заменяют утверждённые тексты, поля, контакты и факты.

## 3. Выбранный профиль публикации

**Profile B. Virtual hosting with PHP.**

Применяется виртуальный хостинг с поддержкой PHP. Конкретный провайдер, домен, document root и дата публикации пока не определены.

### Причины выбора

- форма содержит загрузку фото или спецификации;
- обязательна server-side валидация;
- заявка должна считаться успешной только после положительного ответа канала доставки;
- секреты SMTP или другой интеграции нельзя размещать во frontend и Git;
- статический frontend остаётся быстрым и SEO-доступным;
- React и отдельный API не нужны для утверждённой страницы.

## 4. Стек

### Frontend

- Vite;
- semantic HTML5;
- CSS с custom properties;
- модульный JavaScript без React и других UI-фреймворков;
- anime.js как единственная основная motion-библиотека;
- локальные WOFF2-шрифты Manrope и IBM Plex Mono;
- SVG для интерфейсных иконок;
- AVIF/WebP с fallback при необходимости.

### Backend

- PHP 8.2 или новее;
- Composer;
- PHPMailer для SMTP-адаптера;
- JSON API endpoint;
- временная обработка файлов без постоянного хранения на сайте.

### Контроль качества

- ESLint;
- Vitest;
- Playwright;
- ручной visual QA на утверждённых ширинах;
- проверка production build и консоли браузера.

## 5. Архитектура проекта

```text
/
├── docs/
│   ├── strategy-spec.md
│   ├── page-spec.md
│   ├── design-spec.md
│   ├── technical-spec.md
│   ├── analytics-plan.md
│   ├── legal-spec.md
│   ├── privacy-policy.md
│   ├── personal-data-consent.md
│   ├── cookie-policy.md
│   └── acceptance-criteria.md
├── references/
│   ├── approved-desktop-hero.png
│   ├── approved-mobile-hero.png
│   ├── approved-section-example.png
│   ├── approved-key-component-route.png
│   ├── approved-form.png
│   └── cargo-photos/
├── src/
│   ├── main.js
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── sections.css
│   │   └── responsive.css
│   ├── scripts/
│   │   ├── analytics.js
│   │   ├── consent.js
│   │   ├── forms.js
│   │   ├── file-upload.js
│   │   ├── navigation.js
│   │   ├── gallery.js
│   │   └── motion.js
│   └── assets/
├── public/
│   ├── images/
│   ├── fonts/
│   ├── icons/
│   ├── favicon/
│   ├── robots.txt
│   └── sitemap.xml
├── server/
│   ├── submit.php
│   ├── health.php
│   ├── config.example.php
│   ├── composer.json
│   ├── composer.lock
│   ├── .htaccess
│   └── src/
│       ├── Bootstrap.php
│       ├── RequestValidator.php
│       ├── FileValidator.php
│       ├── ConsentRecord.php
│       ├── SubmissionService.php
│       ├── DeliveryAdapterInterface.php
│       └── SmtpDeliveryAdapter.php
├── scripts/
│   └── copy-server.mjs
├── tests/
│   ├── unit/
│   └── e2e/
├── index.html
├── privacy-policy/index.html
├── personal-data-consent/index.html
├── cookie-policy/index.html
├── 404.html
├── vite.config.js
├── eslint.config.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
├── AGENTS.md
└── PROJECT_STATE.md
```

`server/config.local.php` создаётся только в окружении и исключается из Git. Доступ к `server/src`, `server/vendor`, конфигурации и служебным файлам блокируется сервером.

## 6. Frontend-компоненты

Обязательные компоненты:

- header desktop и mobile;
- полноэкранное mobile menu;
- hero desktop и mobile;
- галерея реальных грузов и lightbox;
- карточки категорий груза;
- шесть маршрутных этапов;
- карточки способов доставки;
- панели схем оформления;
- список факторов стоимости;
- двухэтапная форма расчёта;
- короткая форма связи с логистом;
- file upload;
- экран успеха и экран ошибки;
- контакты и терминалы;
- FAQ accordion;
- финальный CTA;
- footer;
- cookie banner и окно настроек cookie.

Компоненты не должны менять структуру и тексты `page-spec.md`.

## 7. Формы

### 7.1. Основная форма

- form ID: `cargo_calculation`;
- формат: два этапа;
- endpoint: `POST /server/submit.php` или итоговый публичный путь `/api/submit.php` после сборки;
- Content-Type: `multipart/form-data`;
- success: только после подтверждённой доставки заявки серверным адаптером.

#### Этап 1. Груз и маршрут

| Поле | Имя | Обязательное | Frontend | Server-side |
|---|---|---:|---|---|
| Тип груза | `cargo_type` | да | trim, 2-160 символов | trim, длина, безопасная строка |
| Вес, кг | `weight_kg` | нет | число больше 0 | decimal, диапазон 0-100000000 |
| Объём, м³ | `volume_m3` | нет | число больше 0 | decimal, диапазон 0-1000000 |
| Габариты | `dimensions` | нет | до 120 символов | длина, безопасная строка |
| Забор в Китае | `pickup_china` | да | 2-240 символов | trim, длина |
| Доставка в России | `delivery_russia` | да | 2-240 символов | trim, длина |
| Способ перевозки | `transport_mode` | нет | allowlist | allowlist: unknown, rail, auto, air |
| Схема оформления | `clearance_scheme` | нет | allowlist | allowlist: consultation, official, cargo |
| Фото или спецификация | `attachment` | нет | формат и размер | MIME, расширение, размер, безопасное имя |
| Комментарий | `comment` | нет | до 2000 символов | длина, очистка управляющих символов |

#### Этап 2. Контакт

| Поле | Имя | Обязательное | Frontend | Server-side |
|---|---|---:|---|---|
| Имя | `name` | да | 2-100 символов | trim, длина |
| Телефон или мессенджер | `contact` | да | 5-160 символов | trim, длина, запрет служебных заголовков |
| Способ связи | `contact_method` | нет | allowlist | phone, whatsapp, telegram, wechat |
| Согласие | `personal_data_consent` | да | checkbox | значение `1`, version и timestamp |

### 7.2. Короткая форма

- form ID: `logist_request`;
- поля: `name`, `contact`, `cargo_summary`, `attachment`, `personal_data_consent`;
- endpoint и правила success совпадают с основной формой;
- точная стоимость не обещается.

### 7.3. Файлы

- один файл на одну отправку;
- допустимые расширения: JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX;
- максимальный размер: 15 MB;
- MIME проверяется сервером через `fileinfo`;
- имя файла нормализуется;
- файл хранится только во временном каталоге на время обработки;
- после успешной или ошибочной доставки временный файл удаляется;
- выполнение загруженных файлов исключается;
- архивы, скрипты, HTML, SVG и исполняемые форматы запрещены.

### 7.4. Anti-spam и защита от дублей

- скрытое honeypot-поле;
- минимальное время заполнения 3 секунды;
- подписанный одноразовый submission token со сроком 30 минут;
- idempotency key на попытку отправки;
- повторная обработка одного key запрещена в течение 30 минут;
- ограничение длины всех полей;
- внешняя CAPTCHA не применяется без отдельного утверждения;
- IP и user-agent не сохраняются в постоянный журнал до отдельного юридического решения.

### 7.5. Состояния

- idle;
- client validation error;
- uploading;
- submitting;
- server validation error;
- delivery error;
- success.

Во время отправки кнопка блокируется. Повторное нажатие не создаёт вторую заявку.

### 7.6. Ответ API

Успех:

```json
{
  "ok": true,
  "submission_id": "generated-server-id"
}
```

Ошибка валидации:

```json
{
  "ok": false,
  "code": "validation_error",
  "fields": {
    "cargo_type": "Заполните это поле."
  }
}
```

Ошибка доставки:

```json
{
  "ok": false,
  "code": "delivery_failed"
}
```

Если получатель и канал доставки не настроены, endpoint возвращает `503 integration_not_configured` и не показывает пользователю ложный success.

## 8. Получатели и интеграции

### На этапе review

- основной получатель: not configured;
- резервный получатель: not configured;
- SMTP-провайдер: not configured;
- CRM: not applicable;
- Telegram-доставка формы: disabled;
- постоянное хранение заявок на сервере: disabled.

### После настройки

Минимальный production-вариант:

```text
frontend
-> PHP endpoint
-> server-side validation
-> SMTP adapter
-> подтверждённая отправка
-> JSON success
-> form_success goal
```

Telegram может быть добавлен как резервный адаптер только после утверждения получателя, bot token и состава передаваемых данных.

## 9. Аналитика

- система: Яндекс.Метрика;
- номер счётчика: not configured;
- домен счётчика: not configured;
- загрузка: только после согласия на analytics cookie;
- единый модуль: `trackGoal(goalName, params)`;
- персональные данные в Метрику не передаются;
- success-цель вызывается только после `ok: true` от сервера;
- ошибки блокировщика аналитики не ломают интерфейс;
- подробности определены в `analytics-plan.md`.

## 10. Cookie consent

Консервативная модель:

- необходимые функции доступны сразу;
- Яндекс.Метрика и необязательные идентификаторы не загружаются до согласия;
- кнопки: «Принять все», «Отклонить необязательные», «Настроить»;
- footer содержит ссылку «Настройки cookie»;
- сохраняются версия политики, категории и timestamp;
- изменение решения доступно в любой момент;
- отказ не блокирует форму, звонок и просмотр сайта.

## 11. SEO

Обязательно:

- утверждённые title, description и H1 из `page-spec.md`;
- canonical после утверждения production-домена;
- `robots.txt`;
- `sitemap.xml`;
- Open Graph title, description и image;
- favicon и apple touch icon;
- семантическая иерархия H1-H3;
- один H1;
- HTTPS;
- отдельная 404;
- индексация юридических страниц по итоговому решению;
- карта redirect до замены существующего сайта.

Пока production-домен не выбран, canonical, sitemap host и redirect map имеют статус `not configured` и не должны публиковаться с фиктивным адресом.

## 12. Производительность

### Бюджеты

- initial HTML: до 80 KB без gzip;
- critical CSS: до 35 KB без gzip;
- весь CSS: до 90 KB gzip;
- собственный JS плюс anime.js: до 140 KB gzip;
- desktop hero: до 650 KB в основном современном формате;
- mobile hero: до 420 KB;
- изображения галереи: до 280 KB каждое при типовом отображении;
- локальные шрифты: не более четырёх WOFF2-файлов, суммарно до 360 KB;
- сторонние runtime-библиотеки кроме anime.js: запрещены без обоснования.

### Правила

- отдельные desktop и mobile hero assets;
- `srcset` и `sizes`;
- AVIF/WebP с fallback при необходимости;
- `loading="lazy"` для некритичных изображений;
- hero image не lazy;
- preload только hero и критичного начертания Manrope;
- width/height или aspect-ratio у медиа;
- анимации только transform и opacity, где возможно;
- `prefers-reduced-motion` обязателен;
- отсутствие ошибок консоли.

Целевые показатели после фактического измерения:

- LCP не хуже 2.5 s на проверяемом production-профиле;
- INP не хуже 200 ms;
- CLS не выше 0.1.

Это критерии проверки, а не обещание до измерения.

## 13. Безопасность

- server-side validation для всех полей;
- allowlist для select/radio;
- запрет email header injection;
- HTML не интерпретируется в заявке;
- секреты отсутствуют во frontend, Git и browser logs;
- `config.local.php` в `.gitignore`;
- доступ к конфигурации и vendor закрыт сервером;
- HTTPS обязателен в production;
- same-origin отправка формы;
- CORS не открывается на `*`;
- безопасные заголовки: CSP после проверки интеграций, Referrer-Policy, X-Content-Type-Options, Permissions-Policy;
- внешние ссылки с `target="_blank"` используют `rel="noopener noreferrer"`;
- dependency audit перед релизом;
- PHP display_errors выключен в production;
- PII отсутствует во frontend console и аналитике.

## 14. Accessibility

- WCAG AA как уровень проверки интерфейса;
- контраст по `design-spec.md`;
- skip link;
- keyboard navigation;
- visible focus;
- доступные labels;
- ошибки через `aria-describedby`;
- live region для success/error;
- focus trap и возврат фокуса в menu, modal и lightbox;
- no autoplay media with sound;
- zoom не блокируется;
- touch target минимум 44 x 44 px;
- meaningful alt только по видимому содержанию.

## 15. Responsive ranges

- mobile: до 767 px;
- tablet: 768-1023 px;
- desktop: 1024-1439 px;
- wide: от 1440 px.

QA-ширины: 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 px.

QA-высоты: 667, 740, 800, 900, 1080 px.

Эти значения не превращаются в отдельные CSS-breakpoints.

## 16. Motion

Основная технология: `animejs`.

Разрешено:

- спокойное проявление маршрутной линии;
- reveal секций через opacity и translateY;
- минимальный parallax hero на desktop;
- состояния menu и lightbox.

Запрещено:

- GSAP ScrollTrigger;
- Three.js;
- Rive;
- Lottie;
- тяжёлые scroll-шоу;
- зависимость смысла от анимации.

Сначала создаётся полностью рабочая статическая версия.

## 17. Codex Skills

### Обязательная цепочка

1. `product-design:image-to-code` - перенос desktop/mobile hero и контрольных блоков.
2. `frontend-design` - компоненты и секции.
3. `design-system-generator` - перенос утверждённых токенов, без переизобретения системы.
4. `responsive-design` - отдельные mobile/tablet/desktop композиции.
5. `ui-ux-pro-max` - формы, меню, lightbox и состояния.
6. `web-design-guidelines` - visual и accessibility QA после hero и после сборки.
7. `product-design:audit` - итоговое сравнение с контрольными изображениями.

### Quality Skill

- основной: `design-taste-frontend`;
- дополнительный для UX-компонентов: `ui-ux-pro-max`.

### Motion Skill

- `animejs`.

### Запреты

- `product-design:ideate` не используется;
- `theme-factory` не используется;
- `product-design:url-to-code`, `website-rebuild` и `local-business-rebuild` не подменяют утверждённый дизайн;
- недоступный обязательный Skill должен быть отмечен до реализации с указанием ближайшей замены.

## 18. Ограничения до production

Production-публикация и реальная приёмка формы запрещены до определения:

- production-домена;
- хостинга и document root;
- номера Яндекс.Метрики;
- основного и резервного получателя формы;
- SMTP или другого подтверждённого канала;
- юридического и почтового адреса оператора;
- окончательной редакции юридических документов.

## 19. Критерии реализации

- структура и тексты совпадают с `page-spec.md`;
- визуальная система совпадает с `design-spec.md` и контрольными изображениями;
- frontend работает без JavaScript для основного контента;
- формы не показывают success без server confirmation;
- файлы проходят двойную проверку;
- аналитика не получает PII;
- cookie choice соблюдается;
- production build воспроизводим;
- acceptance checklist выполнен полностью.
