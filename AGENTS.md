# AGENTS.md

## Project

Рекламный лендинг ООО «Горизонт» для сложных B2B-грузов из Китая в Россию.

## Read first

1. `PROJECT_STATE.md`.
2. Approved files in `/docs/`.
3. `/references/`.
4. `README.md`.

Priority: `PROJECT_STATE.md` -> профильная approved spec -> approved images -> confirmed materials.

## Do not change

Не менять тексты, структуру, дизайн, stack, формы, CTA, факты и contacts без прямой команды. Не вводить неподтверждённые кейсы, гарантии, маршруты, цифры и преимущества.

## Required implementation workflow

Использовать Skill `$website-implementation-and-qa`.

Обязательная цепочка:

1. `product-design:image-to-code`.
2. `frontend-design`.
3. `design-system-generator`.
4. `responsive-design`.
5. `ui-ux-pro-max`.
6. `web-design-guidelines`.
7. `product-design:audit`.

Quality Skill: `design-taste-frontend`.
Motion: `animejs` only.

Если Skill недоступен, сообщить до реализации и назвать замену.

## Commands

```bash
npm ci
composer install --working-dir=server
npm run dev
npm run dev:api
npm run build
npm run lint
npm run test
npm run test:e2e
```

## Git and deploy

Не выполнять commit, push, PR, deploy, DNS или SSL changes без прямой команды пользователя.

## QA gates

- После hero: `web-design-guidelines`.
- Перед final: `web-design-guidelines` и `product-design:audit`.
- Выполнить весь `docs/acceptance-criteria.md`.
- Success формы только после server confirmation.
- Не передавать PII в analytics или frontend logs.

## Report format

```text
Changed files:
Skills used and role:
Build:
Tests:
Visual QA widths:
Form and analytics checks:
Open issues:
```
