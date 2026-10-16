# Calculator

A responsive calculator built with plain HTML, CSS, and JavaScript. It supports
basic arithmetic, parentheses, percentages, memory buttons, and keyboard input.

## Run locally

Open `index.html` in a web browser.

## Deploy with GitHub Pages

1. Create a GitHub repository and publish these project files to it.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to the `main` or `master` branch, or run **Deploy calculator to GitHub
   Pages** from the **Actions** tab.
5. After the workflow succeeds, open **Settings → Pages** to find the website URL.

The workflow in `.github/workflows/deploy.yml` deploys the static site
automatically whenever changes are pushed to `main` or `master`.
