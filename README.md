# Avro Writer

> Minimalistic application to write Bangla with Avro

This project uses the **`Avro JavaScript Library`** from **`Avro-Pad`** to show suggestions. **`Avro`** is wrapped in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) to make the app even more faster.

### Production build of this project is hosted on Github Pages of this repository
[https://ibrahim-13.github.io/avro-writer/](https://ibrahim-13.github.io/avro-writer/)

**This application works off-line and you can also install to use it as an application**

**You can find help for installing PWA on your device from here - [https://support.google.com/chrome/answer/9658361?&hl=en](https://support.google.com/chrome/answer/9658361?&hl=en)**

### Keyboard Key Bindings
Key|Action
---|---
<kbd>CTRL</kbd> + <kbd>.</kbd>|Toggle language between **Bangla** and **English**
<kbd>&larr;</kbd>|Traverse suggestion list tot the left
<kbd>&rarr;</kbd>|Traverse suggestion list tot the right
<kbd>ENTER</kbd>|Apply highlighted suggestion
<kbd>ESC</kbd>|Clear suggestions

---

## Changing the Base URL

The app is designed to be deployable under any sub-path. The base path is set in **two places** and both must be kept in sync when changing it.

### 1. `index.html` — `<base>` tag

The `<base>` tag makes all relative asset URLs (`style.css`, `app.js`, images, etc.) resolve correctly relative to the deployment path. It also affects how the browser resolves URLs in `<link>`, `<script>`, and `<a>` tags.

```html
<base href="/avro-writer/" />
```

MDN reference: [https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/base](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/base)

### 2. `app.js` — `BASE_URL` constant

The `<base>` tag does not affect JavaScript. `BASE_URL` is used to construct the URLs for the [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) and the [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) registration, both of which are resolved by the JS runtime rather than the browser's HTML parser.

```js
var BASE_URL = '/avro-writer';
```

### Example: deploying to `/my-app/`

`index.html`:
```html
<base href="/my-app/" />
```

`app.js`:
```js
var BASE_URL = '/my-app';
```

### Example: deploying to the root `/`

`index.html`:
```html
<base href="/" />
```

`app.js`:
```js
var BASE_URL = '';
```

---

## Service Worker (`service-worker.js`)

### `CACHE_NAME`

```js
const CACHE_NAME = 'avro-writer-v1';
```

`CACHE_NAME` is the versioned key for the browser's [Cache Storage](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage). On activation, the service worker deletes every cache whose name does not match `CACHE_NAME`. This is how stale caches from previous deployments are cleaned up.

**Bump `CACHE_NAME` whenever you deploy a new version of the app.** If you don't, returning visitors may keep receiving cached files from the old deployment even after the service worker updates. A common convention is a suffix like `-v2`, `-v3`, or a build timestamp.

### `PRECACHE_ASSETS`

```js
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './app.js',
  // ...
];
```

This list is fetched and stored in the cache during the service worker `install` event, before the app has received any user traffic. It is what makes the app work fully offline from the first load.

**Keep this list in sync with the actual files in the deployment.** If you add, remove, or rename a file, update `PRECACHE_ASSETS` accordingly. A missing file will cause `cache.addAll()` to reject, which aborts the install and leaves the old service worker in place.

### Caching strategy

The service worker uses a **cache-first** strategy: every GET request is served from the cache if present, falling back to the network and caching the response for future use. This is appropriate for a static app where assets change only on deliberate deployments. It is not suitable for endpoints that return live data.

---

## Libraries Used
Name|URL
---|---
React|[https://reactjs.org/](https://reactjs.org/)
**Comlink**|[https://github.com/GoogleChromeLabs/comlink](https://github.com/GoogleChromeLabs/comlink)
**Key.css**|[http://michaelhue.com/keyscss](http://michaelhue.com/keyscss)

---

## Credits for Avro

Name|URL
---|---
Avro Pad|[https://avro.im/](https://avro.im/)
Avro Pad GitHub Repo|[https://github.com/omicronlab/avro-pad/](https://github.com/omicronlab/avro-pad/)