# vendor/

`underglass.js` is a prebuilt, minified classic script with React, React DOM and
[`@underglass/react`](https://github.com/RaananW/underglass). It sets one global,
`window.Underglass`, with exactly the functions `demo.html` uses (see `entry.js`).
It's a classic script, not a module, because the wrapped demo page runs demo
scripts in order and hands them the shadow root through `window.__demoRoot`.
Nothing is loaded from a CDN.

What's inside, with licenses (full texts in `LICENSES.txt`):

| Package | License |
| --- | --- |
| `react`, `react-dom`, `scheduler` | MIT |
| `@underglass/react`, `@underglass/core` | Apache-2.0 |
| `@babylonjs/lite` (imported by `@underglass/core` for its 3D materials) | Apache-2.0 |

## Rebuilding

From an empty folder, with Node 22+:

```sh
npm install --save-exact react@19.3.1 react-dom@19.3.1 @underglass/react@0.2.1 esbuild@0.28.2
cp path/to/vendor/entry.js .
npx esbuild entry.js --bundle --minify --format=iife --target=es2022 \
  --define:process.env.NODE_ENV='"production"' --legal-comments=eof \
  --banner:js="$(cat path/to/vendor/banner.txt)" --outfile=underglass.js
```

Then copy `underglass.js` back here and regenerate `LICENSES.txt` from the
installed packages' `LICENSE` (and `@babylonjs/lite`'s `NOTICE.txt`) if a
version changed.
