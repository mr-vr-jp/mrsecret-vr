// ミスター秘密侵入VR 公式マニュアル 共通スクリプト
(function () {
  "use strict";

  // スマホ用メニュー
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LANG = (document.documentElement.lang || "ja").slice(0, 2);
  var TEXT = {
    ja: { close: "閉じる", zoom: "拡大して見る" },
    en: { close: "Close", zoom: "View larger" },
    zh: { close: "关闭", zoom: "放大查看" }
  }[LANG] || { close: "閉じる", zoom: "拡大して見る" };


  // タブ（URLの#でも開ける）。入れ子のタブがあるので、各グループは自分の直下のタブだけを扱う
  var tabGroups = Array.prototype.slice.call(document.querySelectorAll("[data-tabs]"));
  function ownTabs(group) {
    return Array.prototype.filter.call(group.querySelectorAll('[role="tab"]'), function (t) {
      return t.closest("[data-tabs]") === group;
    });
  }
  function selectTab(group, tab, focus) {
    ownTabs(group).forEach(function (t) {
      var on = t === tab;
      var was = t.getAttribute("aria-selected") === "true";
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (!panel) return;
      panel.hidden = !on;
      if (on && !was && !reduce) {
        panel.classList.remove("is-entering");
        void panel.offsetWidth;
        panel.classList.add("is-entering");
      }
    });
    if (focus) tab.focus();
    document.dispatchEvent(new CustomEvent("layoutchange"));
  }
  tabGroups.forEach(function (group) {
    var tabs = ownTabs(group);
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        selectTab(group, tab, false);
        var id = tab.getAttribute("aria-controls");
        if (history.replaceState) history.replaceState(null, "", "#" + id);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (next) { e.preventDefault(); selectTab(group, next, true); }
      });
    });
  });
  // 対象を含むタブ・折りたたみを外側から順に開く
  function reveal(target) {
    var chain = [];
    for (var el = target; el; el = el.parentElement) {
      if (el.getAttribute && el.getAttribute("role") === "tabpanel") chain.unshift(el);
      if (el.tagName === "DETAILS") el.open = true;
    }
    chain.forEach(function (panel) {
      var tab = document.querySelector('[aria-controls="' + panel.id + '"]');
      var group = tab && tab.closest("[data-tabs]");
      if (group && panel.hidden) selectTab(group, tab, false);
    });
  }
  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && document.getElementById(id);
    if (!target) return;
    reveal(target);
    requestAnimationFrame(function () { target.scrollIntoView(); });
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  // 同一ページ内リンクでタブ・折りたたみを開く
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    var target = id && document.getElementById(id);
    if (target) reveal(target);
  });

  // 折りたたみの開閉を滑らかにする
  document.querySelectorAll("details.qa, details.more").forEach(function (d) {
    var summary = d.querySelector("summary");
    var running = null;
    summary.addEventListener("click", function (e) {
      if (reduce || !d.animate) return;
      e.preventDefault();
      if (running) running.cancel();
      var start = d.offsetHeight;
      var opening = !d.open || d.classList.contains("is-closing");
      d.classList.remove("is-closing");
      d.style.overflow = "hidden";
      var end;
      if (opening) {
        d.open = true;
        end = d.offsetHeight;
      } else {
        d.classList.add("is-closing");
        end = summary.offsetHeight + (d.offsetHeight - d.clientHeight);
      }
      running = d.animate({ height: [start + "px", end + "px"] }, { duration: opening ? 320 : 240, easing: "cubic-bezier(.2,.7,.2,1)" });
      running.onfinish = function () {
        running = null;
        if (!opening) { d.open = false; d.classList.remove("is-closing"); }
        d.style.overflow = "";
        document.dispatchEvent(new CustomEvent("layoutchange"));
      };
    });
  });

  // 目次の現在地表示
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll("[data-toc] a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      (byId[id] = byId[id] || []).push(a);
    });
    var sections = Object.keys(byId).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) current = entry.target.id;
      });
      if (!current) return;
      tocLinks.forEach(function (a) { a.classList.remove("is-active"); });
      (byId[current] || []).forEach(function (a) {
        a.classList.add("is-active");
        var bar = a.parentElement;
        if (bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  // 画像の拡大表示（キーボードでも開け、閉じたら元の場所へフォーカスを戻す）
  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.hidden = true;
  box.innerHTML = '<button class="lightbox-close" type="button"></button><img alt="">';
  document.body.appendChild(box);
  var boxImg = box.querySelector("img");
  var boxClose = box.querySelector(".lightbox-close");
  boxClose.setAttribute("aria-label", TEXT.close);
  boxClose.textContent = "\u00d7";
  var opener = null;
  function openBox(img) {
    opener = img;
    boxImg.src = img.getAttribute("data-full") || img.currentSrc || img.src;
    boxImg.alt = img.alt;
    box.setAttribute("aria-label", img.alt || TEXT.zoom);
    box.hidden = false;
    box.classList.add("is-open");
    boxClose.focus();
  }
  function closeBox() {
    if (box.hidden) return;
    box.classList.remove("is-open");
    box.hidden = true;
    boxImg.removeAttribute("src");
    if (opener) opener.focus();
  }
  document.querySelectorAll("img.zoomable").forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    var cap = img.closest("figure") && img.closest("figure").querySelector("figcaption");
    var name = img.alt || (cap ? cap.textContent.trim() : "");
    img.setAttribute("aria-label", (name ? name + " — " : "") + TEXT.zoom);
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBox(img); }
    });
  });
  document.addEventListener("click", function (e) {
    var img = e.target.closest("img.zoomable");
    if (img) { openBox(img); return; }
    if (e.target === box || e.target === boxImg || e.target === boxClose) closeBox();
  });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") closeBox();
    if (e.key === "Tab") { e.preventDefault(); boxClose.focus(); }
  });

  // YouTubeはクリックされてから読み込む
  document.querySelectorAll(".yt[data-id]").forEach(function (el) {
    var btn = el.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + el.getAttribute("data-id") + "?autoplay=1&rel=0";
      iframe.title = el.getAttribute("data-title") || "YouTube";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
    });
  });

  // 画面内に入った動画だけ再生する。動きを減らす設定では自動で動かさず、手で再生できるようにする。
  // 表示した後に設定が変わった時も切り替える
  var videos = document.querySelectorAll("video[data-autoplay]");
  var bgVideos = document.querySelectorAll("video[autoplay]");
  var vio = null;
  function applyMotion(reduceNow) {
    reduce = reduceNow;
    if (vio) { vio.disconnect(); vio = null; }
    if (reduceNow) {
      videos.forEach(function (v) { v.controls = true; v.loop = false; v.pause(); });
      bgVideos.forEach(function (v) { v.pause(); });
    } else {
      videos.forEach(function (v) { v.controls = false; v.loop = true; });
      bgVideos.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
      if ("IntersectionObserver" in window) {
        vio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var v = entry.target;
            if (entry.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
            else v.pause();
          });
        }, { threshold: 0.25 });
        videos.forEach(function (v) { vio.observe(v); });
      }
    }
  }
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  applyMotion(motionQuery.matches);
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", function (e) { applyMotion(e.matches); });

  // 監視カメラの時刻（深夜2時過ぎから進む）
  var camTimes = document.querySelectorAll(".cam-time");
  if (camTimes.length) {
    var camStart = Date.now(), camBase = 2 * 3600 + 13 * 60 + 48;
    var tickCam = function () {
      var t = camBase + Math.floor((Date.now() - camStart) / 1000);
      var txt = [Math.floor(t / 3600) % 24, Math.floor(t / 60) % 60, t % 60].map(function (n) { return (n < 10 ? "0" : "") + n; }).join(":");
      camTimes.forEach(function (el) { el.textContent = txt; });
    };
    tickCam();
    setInterval(function () { if (!reduce) tickCam(); }, 1000);
  }

  // スマホで横にスクロールする図は、端まで見たら右端のぼかしを消す
  document.querySelectorAll(".fig").forEach(function (fig) {
    function upd() {
      var can = fig.scrollWidth > fig.clientWidth + 2;
      fig.classList.toggle("is-scrollable", can);
      fig.classList.toggle("at-end", !can || fig.scrollLeft + fig.clientWidth >= fig.scrollWidth - 4);
    }
    fig.addEventListener("scroll", upd, { passive: true });
    window.addEventListener("resize", upd);
    document.addEventListener("layoutchange", upd);
    upd();
  });

  // 表示時のフェード
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); rio.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { rio.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // トップへ戻る
  var top = document.querySelector(".to-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("is-shown", window.scrollY > 600);
    }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  // 手順の番号と、図の中の同じ番号を連動させる（どちらに触れても両方が光る）。
  // 図がタブの中にあれば、そのタブの手順だけを対象にする
  document.querySelectorAll(".step .fig").forEach(function (fig) {
    var pins = fig.querySelectorAll(".f-pinwrap[data-n]");
    if (!pins.length) return;
    var step = fig.closest(".step");
    var scope = fig.closest('[role="tabpanel"]');
    if (!scope || !step.contains(scope)) scope = step;
    var nums = {};
    pins.forEach(function (p) { nums[p.getAttribute("data-n")] = true; });
    var items = [];
    scope.querySelectorAll("ol.do").forEach(function (ol) {
      if (ol.closest("details")) return;
      var panel = ol.closest('[role="tabpanel"]');
      if (panel && panel !== scope && scope.contains(panel)) return;
      Array.prototype.forEach.call(ol.children, function (li, i) {
        var n = String(i + 1);
        if (!nums[n]) return;
        li.classList.add("has-pin");
        li.setAttribute("data-n", n);
        items.push(li);
      });
    });
    function light(n) {
      items.forEach(function (li) { li.classList.toggle("is-on", li.getAttribute("data-n") === n); });
      pins.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-n") === n); });
    }
    items.concat(Array.prototype.slice.call(pins)).forEach(function (el) {
      el.addEventListener("mouseenter", function () { light(el.getAttribute("data-n")); });
      el.addEventListener("mouseleave", function () { light(null); });
      el.addEventListener("click", function () { light(el.getAttribute("data-n")); });
    });
  });

  // ポータルの凡例と間取り図の番号を連動させる
  document.querySelectorAll(".portal-legend li").forEach(function (li) {
    var fig = li.closest(".split") && li.closest(".split").querySelector(".fig");
    if (!fig) return;
    var ns = Array.prototype.map.call(li.querySelectorAll(".pins i"), function (i) { return i.textContent.trim(); });
    function set(on) {
      li.classList.toggle("is-on", on);
      fig.querySelectorAll(".f-pinwrap").forEach(function (p) { p.classList.toggle("is-on", on && ns.indexOf(p.getAttribute("data-n")) !== -1); });
    }
    li.addEventListener("mouseenter", function () { set(true); });
    li.addEventListener("mouseleave", function () { set(false); });
  });

  // コントローラー図：ボタン名からボタンの位置へ線を引き、触れたボタンを光らせる
  document.querySelectorAll(".ctl").forEach(function (ctl) {
    var views = ctl.querySelectorAll(".ctl-view");
    var locked = null;
    function draw() {
      views.forEach(function (view) {
        var svg = view.querySelector(".ctl-lines");
        var vr = view.getBoundingClientRect();
        svg.setAttribute("viewBox", "0 0 " + vr.width + " " + vr.height);
        var out = "";
        view.querySelectorAll(".ctl-labels button").forEach(function (b) {
          var dot = view.querySelector('.ctl-dot[data-spot="' + b.getAttribute("data-spot") + '"]');
          var d = dot.getBoundingClientRect();
          var L = b.getBoundingClientRect();
          var sx = d.left + d.width / 2 - vr.left, sy = d.top + d.height / 2 - vr.top;
          var path;
          if (L.right <= d.left) {
            var ax = L.right - vr.left + 6, ay = L.top + L.height / 2 - vr.top;
            path = "M" + ax + " " + ay + "H" + Math.max(ax, sx - 30) + "L" + sx + " " + sy;
          } else if (L.left >= d.right) {
            var bx = L.left - vr.left - 6, by = L.top + L.height / 2 - vr.top;
            path = "M" + bx + " " + by + "H" + Math.min(bx, sx + 30) + "L" + sx + " " + sy;
          } else if (L.bottom <= d.top) {
            var cx = L.left + L.width / 2 - vr.left, cy = L.bottom - vr.top + 4;
            path = "M" + cx + " " + cy + "V" + Math.max(cy, sy - 26) + "L" + sx + " " + sy;
          } else {
            var ex = L.left + L.width / 2 - vr.left, ey = L.top - vr.top - 4;
            path = "M" + ex + " " + ey + "V" + Math.min(ey, sy + 26) + "L" + sx + " " + sy;
          }
          out += '<path data-ctl="' + b.getAttribute("data-ctl") + '" d="' + path + '"/>';
        });
        svg.innerHTML = out;
      });
      show(locked);
    }
    function show(key) {
      ctl.querySelectorAll("img.hl").forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("data-hl") === key); });
      ctl.querySelectorAll("[data-ctl]").forEach(function (t) { t.classList.toggle("is-on", t.getAttribute("data-ctl") === key); });
    }
    ctl.querySelectorAll(".ctl-labels button").forEach(function (t) {
      var key = t.getAttribute("data-ctl");
      t.addEventListener("mouseenter", function () { show(key); });
      t.addEventListener("mouseleave", function () { show(locked); });
      t.addEventListener("focus", function () { show(key); });
      t.addEventListener("blur", function () { show(locked); });
      t.addEventListener("click", function () { locked = locked === key ? null : key; show(locked); });
    });
    ctl.querySelectorAll(".ctl-img > img:not(.hl)").forEach(function (img) {
      if (!img.complete) img.addEventListener("load", draw);
    });
    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(ctl);
    window.addEventListener("resize", draw);
    document.addEventListener("layoutchange", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    draw();
  });

  // ビネット効果の見本
  document.querySelectorAll("[data-vignette]").forEach(function (demo) {
    var btn = demo.querySelector(".toggle");
    btn.addEventListener("click", function () {
      var on = demo.classList.toggle("is-on");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  // トラブルガイドの絞り込み
  var filter = document.querySelector("[data-filter-input]");
  if (filter) {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-filter-item]"));
    var empty = document.querySelector("[data-filter-empty]");
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var hit = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !hit;
        if (hit) shown++;
        if (q && hit && item.tagName === "DETAILS") item.open = true;
      });
      document.querySelectorAll("[data-filter-group]").forEach(function (g) {
        g.hidden = !g.querySelector("[data-filter-item]:not([hidden])");
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }
})();
