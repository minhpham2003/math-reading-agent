# Pull request previews

We use GitHub Pages for reviewable design prototypes without merging them to `main`.

## One-time setup

In GitHub **Settings → Pages**, select **Deploy from a branch** and choose the `gh-pages` branch, root folder. The branch is created by the preview workflow after its first successful run. If it doesn't appear, run the workflow once and refresh. Under **Settings → Actions → General → Workflow permissions**, grant **Read and write permissions** to `GITHUB_TOKEN` if necessary.

**Important:** If GitHub Pages currently publishes the main site from `main`, switching it to `gh-pages` changes the published source. This preview setup does not automatically copy existing content from `main`. Before switching, make sure there isn't a published site you need to preserve, or use a separate preview repository instead.

## S02 preview

Pull request #1 should publish at:

https://minhpham2003.github.io/math-reading-agent/previews/pr-1/

The workflow listens for updates to pull requests within this repository touching `prototypes/`. It uploads the current S02 prototype to the `gh-pages` branch under `previews/pr-<number>/`, leaving other preview folders in place.

The preview link will work **only after** GitHub Actions runs successfully and Pages is configured to serve `gh-pages`.

## Limitations

- The workflow currently previews the S02 prototype; future prototypes will require updating its source directory.
- This is static hosting only; session data is saved locally in the visitor's browser.
- Forked pull requests do not receive publishing permissions.
- Previews are public at their URLs. Do not put credentials or private source documents in them.
- A deployment failure may indicate missing Actions write permission or repository Pages restrictions.
