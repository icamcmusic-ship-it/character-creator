# Workflows

`tests.yml` runs the invariant suite and the browser suite on every pull request and
push to `main`. `deploy.yml` runs both again and publishes to GitHub Pages.

## Two notes on how these are pinned and packaged

**Playwright is pinned.** Both workflows used to `npm install --no-save playwright`
with no version and no lockfile, so the browser the suite ran against changed without
anyone changing this repository — a CI failure could appear on a commit that touched
nothing, and a CI pass could stop meaning what it meant last week. The version now
lives in `package.json` and both workflows install from it.

**The deployment artifact is an allowlist.** It used to be "the repository root, minus
a few paths deleted just before upload", which publishes anything new by default —
including `node_modules/`, which the browser-test step installs into the same checkout
a few steps earlier. The artifact is now assembled by copying in the files the app
actually loads, so a new file is published only when someone adds it here.
