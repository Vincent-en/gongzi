/* 离线缓存：让它在手机上没网也能打开（在线版） */
var CACHE = "wage-pub-v6";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  // 网页本体（HTML）强制绕过浏览器自带的 HTTP 缓存再取一次。
  // 原因：GitHub Pages 给每个文件都发了 Cache-Control: max-age=600，
  // 不绕过的话，改完上传后手机上最多 10 分钟还是旧页面。
  var accept = e.request.headers.get("accept") || "";
  var isDoc = e.request.mode === "navigate" || accept.indexOf("text/html") > -1;
  e.respondWith(
    fetch(e.request, isDoc ? { cache: "reload" } : undefined).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match("./index.html");
      });
    })
  );
});
