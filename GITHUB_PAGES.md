# Публикация на GitHub Pages

1. Откройте репозиторий на GitHub.
2. В разделе **Settings - Pages** выберите **Source: GitHub Actions**.
3. Через GitHub Desktop закоммитьте и отправьте в ветку `main` или `master` все файлы проекта, включая `.github/workflows/deploy-pages.yml`.
4. Откройте вкладку **Actions** и дождитесь завершения workflow **Deploy GitHub Pages**.
5. Ссылка на сайт появится в **Settings - Pages**.

Workflow сам собирает Vite-проект и публикует только папку `dist`. Исходные `index.html` и `src` напрямую на Pages не публикуются.
