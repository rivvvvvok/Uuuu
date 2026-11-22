/* sw.js - unicos service worker
   1) 离线缓存：先联网取最新文件，取不到（没网）再用缓存，所以更新不会被旧缓存卡住
   2) 通知：页面通过 registration.showNotification 弹通知，点通知会回到 App
   以后拆成多个文件时，把新文件名加进 PRECACHE 就行 */
var CACHE = "unicos-v1";
var PRECACHE = ["./", "index.html", "manifest.json", "icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 表情包外链、AI 接口等一律不管
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./");
    })
  );
});
