# Gorizont China Cargo Landing

## 1. Назначение

Рекламный лендинг ООО «Горизонт» для Яндекс.Директа. Приоритет: спецтехника, тяжёлые и негабаритные грузы, промышленное оборудование и отдельные контейнеры из Китая в Россию.

## 2. Стек

- Vite;
- HTML5;
- CSS;
- JavaScript modules;
- anime.js;
- PHP 8.2+;
- Composer и PHPMailer;
- ESLint, Vitest, Playwright.

React не используется.

## 3. Окружение

- Node.js 22.x;
- npm 10+;
- PHP 8.2+ с extensions `fileinfo`, `json`, `mbstring`, `openssl`;
- Composer 2.x;
- Git 2.40+.

## 4. Источники истины

Перед работой прочитать:

1. `PROJECT_STATE.md`;
2. `/docs/strategy-spec.md`;
3. `/docs/page-spec.md`;
4. `/docs/design-spec.md`;
5. `/docs/technical-spec.md`;
6. `/docs/acceptance-criteria.md`;
7. `/references/`.

## 5. Структура

Основная структура определена в `technical-spec.md`.

- `/src/` - frontend source;
- `/public/` - static assets;
- `/server/` - PHP endpoint и backend classes;
- `/docs/` - утверждённая документация;
- `/references/` - утверждённые изображения;
- `/tests/` - unit и e2e tests;
- `/dist/` - production build, не редактировать вручную.

## 6. Установка

```bash
npm ci
composer install --working-dir=server
npx playwright install chromium
```

Если lock-файлы ещё не созданы на первом запуске Codex:

```bash
npm install
composer install --working-dir=server
npx playwright install chromium
```

После создания lock-файлов использовать только `npm ci` для воспроизводимой установки.

## 7. Локальный запуск

Терминал 1:

```bash
npm run dev:api
```

Терминал 2:

```bash
npm run dev
```

Vite должен проксировать `/api` на `http://127.0.0.1:8080` и переписывать `/api/submit.php` в `/submit.php`.

## 8. Команды package.json

Codex должен создать следующие scripts без переименования:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "php -S 127.0.0.1:8080 -t server",
    "build": "vite build && node scripts/copy-server.mjs",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run test && npm run build && npm run test:e2e"
  }
}
```

## 9. Production build

```bash
composer install --working-dir=server --no-dev --optimize-autoloader
npm ci
npm run build
```

Проверка build:

```bash
npm run preview
```

Полная локальная проверка:

```bash
npm run check
```

## 10. Backend configuration

Скопировать:

```bash
cp server/config.example.php server/config.local.php
```

На Windows PowerShell:

```powershell
Copy-Item server\config.example.php server\config.local.php
```

`server/config.local.php` должен быть в `.gitignore`.

Поля конфигурации:

```php
return [
    'environment' => 'production',
    'app_url' => '',
    'smtp_host' => '',
    'smtp_port' => 587,
    'smtp_encryption' => 'tls',
    'smtp_username' => '',
    'smtp_password' => '',
    'mail_from' => '',
    'mail_from_name' => 'Горизонт',
    'mail_to' => [],
    'mail_reply_to' => '',
    'max_upload_bytes' => 15728640,
    'consent_version' => '1.0'
];
```

Секретные значения не добавлять в repository, frontend, screenshots, issues или chat reports.

Пока `mail_to` и SMTP не настроены, endpoint обязан отвечать `integration_not_configured`.

## 11. Analytics configuration

Counter ID и production-домен: not configured.

Настройка производится только после отдельного решения. До этого analytics module работает в безопасном no-op режиме.

PII в Метрику не передаётся.

## 12. Формы

Endpoint после build:

```text
/api/submit.php
```

Формы:

- `cargo_calculation`;
- `logist_request`.

Success отображается только при `ok: true`.

Файлы:

- один файл;
- JPG, JPEG, PNG, PDF, DOC, DOCX, XLS, XLSX;
- до 15 MB;
- временное хранение;
- удаление после обработки.

## 13. Профиль публикации

Profile B: virtual hosting with PHP.

Конкретные hosting, domain и document root: not configured. Публикация заблокирована до их утверждения.

После утверждения инфраструктуры production package формируется из содержимого `/dist/`.

Windows package:

```powershell
Compress-Archive -Path dist\* -DestinationPath gorizont-release.zip -Force
```

Linux/macOS package:

```bash
tar -czf gorizont-release.tar.gz -C dist .
```

## 14. Порядок загрузки build

Пока hosting не выбран, server upload command: not applicable.

Обязательная последовательность после выбора:

1. Создать backup текущего document root.
2. Сохранить текущие DNS, SSL и redirect settings.
3. Загрузить содержимое `/dist/` в утверждённый document root.
4. Создать `config.local.php` вручную на сервере.
5. Проверить запрет прямого доступа к config, vendor и src.
6. Проверить HTTPS.
7. Выполнить smoke test без реальных персональных данных.
8. Отправить утверждённую test-заявку с тестовым вложением.
9. Проверить server success, письмо и отсутствие дубля.
10. Только затем включить рекламный трафик.

## 15. DNS и SSL

- DNS changes: not applicable until domain is approved.
- SSL setup: not applicable until hosting and domain are approved.
- Production требует HTTPS до включения формы и аналитики.

## 16. Backup

До замены существующего сайта сохранить:

- полный архив текущего document root;
- экспорт базы данных старого WordPress, если он заменяется;
- текущие `.htaccess`, redirects и PHP settings;
- DNS records;
- SSL settings;
- копию последнего рабочего release.

Server backup commands: not applicable until hosting paths and access method are approved.

Локальный архив документации и references:

```powershell
Compress-Archive -Path docs,references,README.md,AGENTS.md,PROJECT_STATE.md -DestinationPath approved-spec-backup.zip -Force
```

## 17. Rollback

Rollback считается подготовленным только после определения hosting.

Обязательный сценарий:

1. Остановить рекламный трафик.
2. Восстановить предыдущий document root из backup.
3. Восстановить базу WordPress, если она была заменена.
4. Восстановить redirects и server configuration.
5. Проверить главную страницу, формы старого сайта и SSL.
6. Зафиксировать причину отката.

Server rollback command: not applicable until hosting is selected.

## 18. Проверка после публикации

- production URL;
- HTTPS и mixed content;
- header и hero desktop/mobile;
- формы, server validation и attachment;
- success только после доставки;
- телефоны и мессенджеры;
- cookie reject и accept;
- analytics после consent;
- robots, sitemap, canonical и Open Graph;
- 404 и redirects;
- консоль и network errors;
- QA widths из acceptance criteria;
- фактические LCP, INP и CLS.

## 19. Git baseline

Перед первой реализацией:

```bash
git init
git add .
git commit -m "chore: initialize approved website specification"
```

Если repository уже существует, рабочее дерево должно быть чистым. Codex не выполняет commit, push, PR или deploy без прямой команды.

## 20. Известные ограничения

- domain not configured;
- hosting not configured;
- Yandex Metrica counter not configured;
- form recipients not configured;
- legal and postal addresses not provided;
- legal documents remain Draft for legal review;
- tracking mechanism of cargo is not detailed;
- photos are evidence of work, not confirmed cases.
