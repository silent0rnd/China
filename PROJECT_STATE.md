# Project State

## Метаданные
- version: 1.4
- updated_at: 2026-07-22

## Текущий этап
Статическая часть лендинга реализована. Выполняется пользовательская визуальная корректировка блоков после hero.

## Утверждённые документы
- strategy-spec.md, version 1.0
- page-spec.md, version 1.0
- design-spec.md, version 1.0

## Технические документы на проверке
- technical-spec.md, version 1.0, status In review
- analytics-plan.md, version 1.0, status In review
- acceptance-criteria.md, version 1.0, status In review
- README.md
- AGENTS.md

## Документы, требующие юридической проверки
- legal-spec.md, version 1.0
- privacy-policy.md, version 1.0
- personal-data-consent.md, version 1.0
- cookie-policy.md, version 1.0

## Утверждённые визуальные материалы
- desktop hero: `references/approved-desktop-hero.png`
- mobile hero: `references/approved-mobile-hero.png`
- section example: `references/approved-section-example.png`
- key component, маршрутный этап: `references/approved-key-component-route.png`
- form: `references/approved-form.png`

## Источник истины
Авторитетны актуальный `PROJECT_STATE.md`, утверждённые спецификации и утверждённые контрольные изображения. Тексты, структура и факты определяются `strategy-spec.md` и `page-spec.md`. Контрольные изображения определяют стиль и композицию, но не являются источником неподтверждённых текстов, контактов, цифр или обещаний.

## Принятые решения
- Проект: рекламный лендинг для Яндекс.Директа.
- Архитектура: доказательства -> процесс -> расчёт.
- Визуальная концепция: «Тёмный логистический коридор».
- Профиль публикации: Profile B, virtual hosting with PHP.
- Стек: Vite + semantic HTML + CSS + modular JavaScript + PHP 8.2+.
- Frontend framework: not applicable, React не используется.
- Backend: PHP endpoint с server-side validation.
- Delivery adapter: SMTP через PHPMailer после настройки.
- Hosting: not configured.
- Domain: not configured.
- Forms: `cargo_calculation` и `logist_request`.
- File upload: один файл, JPG/JPEG/PNG/PDF/DOC/DOCX/XLS/XLSX, до 15 MB.
- Permanent form storage on site: disabled.
- Form success: только после подтверждённой доставки сервером.
- Form recipients: not configured.
- Analytics: Яндекс.Метрика, counter not configured.
- Analytics loading: после analytics consent.
- Cookie model: conservative opt-in.
- UTM model: first-touch в текущей browser session.
- PII in analytics: prohibited.
- Skill: `$website-implementation-and-qa`.
- Обязательные design Skills: frontend-design, product-design:image-to-code, responsive-design, web-design-guidelines, product-design:audit.
- Design system Skill: design-system-generator.
- Выбранный quality Skill: design-taste-frontend.
- UX quality Skill: ui-ux-pro-max.
- Выбранный motion Skill: animejs.
- Legal documents: Draft for legal review.

## Актуальные пользовательские решения от 2026-07-22
- Блок категорий грузов компактный, без фотографий, с единой серией технических иконок.
- Заголовок процесса: «Маршрут под ключ».
- Шесть этапов процесса сохраняются, получают anime.js-анимацию и hover-состояния.
- Блоки «Официальное оформление или карго-схема», «Что нужно для предварительного расчёта перевозки» и финальный CTA удалены.
- В блоке контактов остаются только заголовок «Контакты», два телефона, email и кнопки WhatsApp, Telegram и WeChat.
- Терминалы и дополнительные тексты из блока контактов удалены.
- FAQ расположен перед блоком контактов.
- При прокрутке шапка остаётся полупрозрачной, без жёсткой рамки и прямоугольных боковых границ.
- Галерея реальных грузов использует masonry-композицию без пересечений карточек и учитывает разные пропорции фотографий.
- Параллакс hero отключён, фоновая сцена остаётся статичной.

## Что запрещено менять
- Формат рекламного лендинга для Яндекс.Директа.
- Фокус на спецтехнике, тяжёлых и негабаритных грузах, промышленном оборудовании и контейнерах.
- Архитектуру «доказательства -> процесс -> расчёт».
- Основной CTA и вторичный CTA.
- Холодную серо-графитовую концепцию и approved hero.
- Утверждённые тексты, факты, контакты и реквизиты, кроме явно изменённых решений выше.
- Нельзя вводить React или другой framework без нового решения.
- Нельзя менять anime.js на другую motion-технологию без утверждения.
- Нельзя показывать form success до подтверждения server delivery.
- Нельзя хранить secrets во frontend и Git.
- Нельзя передавать PII в Яндекс.Метрику.
- Нельзя публиковать юридические drafts как проверенные документы.
- Нельзя выполнять commit, push, PR, deploy или DNS changes без прямой команды.

## Открытые вопросы
- Production domain.
- Hosting provider и document root.
- Yandex Metrica counter ID и Webvisor.
- Основной получатель формы.
- Резервный канал.
- SMTP provider и credentials.
- Юридический адрес ООО «Горизонт».
- Почтовый адрес ООО «Горизонт».
- Срок хранения обращений у получателя.
- Окончательная legal review.
- Redirect map при замене старого сайта.

Эти вопросы отложены пользователем и не блокируют формальную проверку архитектуры. Они блокируют production-публикацию.

## Git baseline
- required before implementation
- recommended commit: `chore: initialize approved website specification`

## Следующий этап
1. Единая формальная проверка технического пакета.
2. После утверждения: изменить технические документы на status `Approved`.
3. Юридические документы оставить `Draft for legal review`.
4. Создать Git baseline.
5. Передать проект в Codex для реализации.
