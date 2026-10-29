# The Celestial Scroll & Star Collector (Tsukuyomi Watch module)

Files
- index.html  – page markup (loads styles.css, app.js, exifr from CDN, Shippori Mincho font)
- styles.css  – all styling (dark Sumi-e theme)
- app.js      – all logic: catalog, EXIF photo verification, Honor/ranks, Shared Sky, leaderboard, registration
- celestial-scroll-single-file.html – the same app in one file

Run: open index.html in a browser (or serve the folder with any static server).
Standalone mode stores data in localStorage (one browser = one world).

Merging into your site
1. Copy the body elements (header, #alert, nav, main, #modal, #toast, #auth, #sky) into your page.
2. Include styles.css (scope the global rules body/h1/h2/*/:root under a wrapper if they clash) and app.js.
3. Keep <script src="https://cdn.jsdelivr.net/npm/exifr@7.1.3/dist/full.umd.js"></script> before app.js.

Backend seam: all data goes through the DB object in boot() (app.js). Replace localDB() with an adapter that
implements doc(path).get()/set(obj) and collection(path).get()/onSnapshot(cb), and set UID from your own login.
Paths: players/{uid}, catalogs/{uid}/items/{itemId}, reactions/{uid}, shared/{uid}, photoseen/{hash},
data/users/{uid}/account (private email). Each user should write only their own {uid} documents.

Photo checks (verify flow): EXIF capture date/time, recency, night-time (for sky objects), valid GPS,
real camera make/model (not edited/AI software), camera-style file name, and no duplicate submissions.
