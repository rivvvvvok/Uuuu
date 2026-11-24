/* sw.js - unicos service worker
   1) 离线缓存：先联网取最新文件（每次向服务器确认是否有更新），取不到（没网）再用缓存
   2) 通知：页面通过 registration.showNotification 弹通知，点通知会回到 App
   新增文件时，把文件名加进下面的 PRECACHE 就行 */
var CACHE = "unicos-v3";
var PRECACHE = ["./", "index.html", "style.css", "base.js", "prompts.js", "people.js", "settings.js", "chat.js", "spaces.js", "library.js", "system.js", "chat-extras.js", "char.js", "manifest.json", "icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(PRECACHE.map(function (u) { return c.add(new Request(u, { cache: "reload" })).catch(function () {}); }));
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
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    function useCache() { return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); }); }
    // 网络慢（超过 1.2 秒）就先用缓存，别让界面干等；网络回来后仍会更新缓存
    var timer = setTimeout(function () { useCache().then(function (h) { if (!done && h) { done = true; resolve(h); } }); }, 1200);
    fetch(req, { cache: "no-cache" }).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      if (!done) { done = true; useCache().then(resolve); }
    });
  }));
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
