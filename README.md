# Portfolio — quick deploy & preview

This repository contains a static portfolio site. Use the instructions below to preview locally or deploy to GitHub Pages.

Preview locally (recommended instead of double-clicking index.html):

- Using Python (Windows PowerShell):

```powershell
# open a terminal in the `portfolio` folder
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

- Using VS Code: install Live Server extension and click "Go Live".

Deploy to GitHub Pages (automatic):

1. Push your changes to the `main` branch.
2. The included GitHub Actions workflow will build and deploy the repository root to GitHub Pages automatically.
3. Allow a minute for the Pages build to finish after push. Visit https://migueldgzmn.github.io/dgmzn-ncp3106/.

If you want the site served from a repository subpath, confirm the Pages `Custom domain` and `Enforce HTTPS` settings in the repo Settings → Pages.

If you see missing assets after hosting, open DevTools → Network and look for 404s; copy missing filenames into an issue/PR and I will fix paths.
