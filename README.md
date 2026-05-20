# Formatter Web App

A lightweight JSON formatter web app with a full-page split view.

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

## Deploy with npm script

```bash
npm run deploy
```

This command builds the app and publishes `dist/` to the `gh-pages` branch.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository (default branch `main`).
2. In GitHub, go to **Settings > Pages**.
3. For **Build and deployment**, choose **Source: GitHub Actions**.
4. Push to `main` to trigger deployment workflow.
5. Open the generated Pages URL shown in the workflow summary.

## Features

- Full-page two-pane layout (left input, right formatted output)
- Auto format on input change
- Collapsible JSON object/array nodes
- Expand all / Collapse all controls
- Copy formatted output and clear input
- SQL formatter mode focused on T-SQL (MSSQL)
- Multiple SQL format templates (MSSQL Standard, Compact, Reporting, Wide, ANSI Clean)
- Responsive UI for desktop and mobile
