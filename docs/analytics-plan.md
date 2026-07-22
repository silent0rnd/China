---
status: In review
version: 1.0
prepared_at: 2026-07-22
approved_at: null
supersedes: none
---

# Analytics Plan

## 1. Система

- платформа: Яндекс.Метрика;
- counter ID: not configured;
- production domain: not configured;
- Webvisor: решение принимается при настройке счётчика и юридической проверке;
- загрузка счётчика: только после согласия категории analytics;
- fallback при блокировке: сайт и формы продолжают работать.

На старых сайтах обнаружены разные счётчики. Ни один из них не переносится автоматически без отдельного подтверждения.

## 2. Единый analytics module

```js
trackGoal(goalName, params = {})
```

Модуль должен:

- проверять, разрешена ли analytics-категория;
- проверять наличие `window.ym` и утверждённого counter ID;
- отбрасывать запрещённые параметры;
- защищать событие от дублей;
- не выбрасывать ошибку наружу;
- логировать события только в development;
- поддерживать очередь только в памяти до загрузки счётчика;
- очищать очередь при отказе от analytics.

Пример безопасного поведения:

```js
trackGoal('form_success_cargo_calculation', {
  form_id: 'cargo_calculation',
  placement: 'calculation_section',
  page_type: 'landing'
})
```

## 3. Form IDs

- `cargo_calculation` - основная двухэтапная форма;
- `logist_request` - короткая форма связи с логистом.

## 4. Карта целей

### Основная форма

| Цель | Когда вызывается | Дедупликация |
|---|---|---|
| `form_open_cargo_calculation` | форма впервые попала в viewport или открыта по CTA | один раз за просмотр страницы |
| `form_start_cargo_calculation` | первое содержательное изменение поля | один раз за попытку |
| `form_step_1_cargo_calculation` | этап 1 успешно прошёл client validation | один раз за попытку |
| `form_success_cargo_calculation` | сервер вернул `ok: true` | по `submission_id` |
| `form_error_cargo_calculation` | серверная или delivery-ошибка | не чаще одного раза на attempt и error code |

### Короткая форма

| Цель | Когда вызывается | Дедупликация |
|---|---|---|
| `form_open_logist_request` | форма открыта | один раз за просмотр |
| `form_start_logist_request` | пользователь начал ввод | один раз за попытку |
| `form_success_logist_request` | сервер вернул `ok: true` | по `submission_id` |
| `form_error_logist_request` | серверная или delivery-ошибка | по attempt и error code |

### CTA и контакты

- `cta_calculation_hero`;
- `cta_calculation_section`;
- `cta_logist_hero`;
- `cta_logist_final`;
- `click_phone_header`;
- `click_phone_footer`;
- `click_email`;
- `click_whatsapp`;
- `click_telegram`;
- `click_wechat`;
- `open_cargo_photo`;
- `open_cookie_settings`.

Для одинакового действия в разных местах предпочтительно использовать одну цель и параметр `placement`, если это не ухудшает отчётность. Окончательная конфигурация целей фиксируется при создании счётчика.

## 5. Разрешённые параметры

- `form_id`;
- `placement`;
- `page_type`;
- `cta_type`;
- `step_id`;
- `transport_category`;
- `clearance_category`;
- `error_code`;
- `consent_version`;
- `viewport_group`.

Значения проходят allowlist и не содержат свободный пользовательский текст.

## 6. Запрещённые данные

В Метрику и frontend analytics logs нельзя передавать:

- имя;
- телефон;
- контакт мессенджера;
- email;
- адрес забора или доставки;
- комментарий;
- название или описание груза из свободного поля;
- имя файла;
- содержимое файла;
- полные ответы формы;
- `submission_id`, если он может быть связан с заявкой вне аналитики.

## 7. Защита от дублей

- события open и start хранятся в `Set` текущего page view;
- step event хранится по ключу `attempt_id + step_id`;
- success хранится по серверному одноразовому событийному token, отдельному от идентификатора заявки;
- повторный возврат на первый этап не повторяет step goal;
- двойной click не создаёт вторую success-цель;
- повторная загрузка страницы создаёт новый page view, но не повторяет success предыдущей заявки.

## 8. Cookie dependency

### До выбора пользователя

- analytics script не загружается;
- analytics cookies не создаются сайтом намеренно;
- события не отправляются;
- форма и контакты работают полностью.

### После «Принять все» или включения analytics

- загружается утверждённый счётчик;
- отправляются только события после согласия;
- исторические действия до согласия не восстанавливаются, кроме текущего CTA, непосредственно вызвавшего согласие, если это явно реализовано и проверено.

### После отказа

- счётчик не загружается;
- очередь очищается;
- настройки можно изменить через footer.

## 9. UTM-модель

Модель: **first-touch в пределах текущего browser session**.

Собираются только безопасные поля:

- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- `utm_content`;
- `utm_term`;
- `yclid`;
- landing path;
- referrer host.

Правила:

- первое непустое значение в текущей сессии не перезаписывается;
- до analytics consent значения сохраняются только в памяти страницы;
- после consent допускается `sessionStorage`;
- при отправке формы без analytics consent передаются только параметры, присутствующие в текущем URL, и referrer host;
- значения передаются в backend вместе с заявкой, но не выводятся пользователю и не содержат PII;
- полные URL с пользовательскими query parameters не отправляются в Метрику.

## 10. Development logging

В development разрешено логировать:

```text
[analytics] goal=form_start_cargo_calculation params={form_id, placement}
```

Запрещено логировать значения полей, контакты, адреса и имена файлов.

В production analytics debug logs выключены.

## 11. Тестирование

### До подключения счётчика

- `trackGoal` безопасно завершается при отсутствии ID;
- сайт не показывает ошибок консоли;
- consent блокирует загрузку внешнего script;
- reject сохраняет выбор;
- footer повторно открывает настройки.

### После подключения счётчика

- проверить загрузку только после consent;
- проверить каждую цель в debug-режиме Метрики;
- проверить отсутствие PII в запросах;
- проверить success только после server success;
- проверить дедупликацию двойного click;
- проверить blocked analytics через расширение-блокировщик;
- проверить формы при полном отказе от cookie.

## 12. Открытые настройки

- counter ID;
- production domain;
- Webvisor on/off;
- срок хранения consent cookie;
- окончательные goal IDs в интерфейсе Метрики;
- правила связки с рекламными кампаниями.
