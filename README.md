# Formatter Web App

A lightweight web app with two tools:
- JSON formatter and minifier
- SQL formatter with dialect selection

Built with Vite + Vanilla JavaScript and ready for GitHub Pages.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push this project to a GitHub repository (default branch `main`).
2. In GitHub, go to **Settings > Pages**.
3. For **Build and deployment**, choose **Source: GitHub Actions**.
4. Push to `main` to trigger deployment workflow.
5. Open the generated Pages URL shown in the workflow summary.

## Features

- JSON pretty-print (2 spaces)
- JSON minify
- SQL formatting (`sql-formatter`)
- Copy/Clear actions
- Responsive UI for desktop and mobile
