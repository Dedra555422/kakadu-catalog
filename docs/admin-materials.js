/* BLACK VAULT — работа с материалами из Supabase.
   Подключается после admin-roles.js. Добавляет в админку форму создания
   материалов с полями: название, категория, раздел, описание, ссылка,
   и заставляет сайт читать материалы из базы, а не из хардкода. */
(function(){
"use strict";

function cl(){ return window.sb || null; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }

/* ---------- 1. Сайт читает материалы из базы ---------- */
var siteMaterials = null;

async function loadSiteMaterials(){
  var c = cl(); if(!c) return null;
  var r = await c.from("materials").select("*").order("created_at",{ascending:false});
  if(r.error){ console.warn("materials:", r.error.message); return null; }
  siteMaterials = r.data || [];
  return siteMaterials;
}

function sectionOf(m){
  var s = (m.section||"").toLowerCase();
  if(s === "regular" || s === "обычное" || s === "обычное окг") return "regular";
  if(s === "special" || s === "специальное" || s === "специальное окг") return "special";
  return "special";
}

function paintSite(){
  if(!siteMaterials) return;
  var names = {special:"Специальное ОКГ", regular:"Обычное ОКГ"};
  ["special","regular"].forEach(function(sec){
    var grid = document.getElementById("grid-"+sec);
    var empty = document.getElementById("empty-"+sec);
    if(!grid) return;
    var items = siteMaterials.filter(function(m){ return sectionOf(m) === sec; });
    grid.innerHTML = items.map(function(m){
      return '<article class="card" tabindex="0">'
        + '<span class="tag">' + esc(m.category || "Материал") + '</span>'
        + '<h3>' + esc(m.title || "") + '</h3>'
        + '<p>' + esc(m.description || "") + '</p>'
        + '<div class="card-foot"><span>' + names[sec] + '</span>'
        + '<span class="go">' + (m.link ? '<a href="'+esc(m.link)+'" target="_blank" rel="noopener">Открыть →</a>' : 'Открыть →') + '</span></div>'
        + '</article>';
    }).join("");
    if(empty) empty.hidden = items.length > 0;
    var counter = document.querySelector('[data-count="'+sec+'"]');
    if(counter) counter.textContent = items.length;
  });
  var total = document.getElementById("statTotal");
  if(total) total.textContent = siteMaterials.length;
}

window.OKG_SITE_RELOAD = async function(){
  await loadSiteMaterials();
  paintSite();
};

/* ---------- 2. Форма добавления в админке ---------- */
function readForm(){
  var g = function(id){ var el = document.getElementById(id); return el ? el.value : ""; };
  return {
    title: g("matTitle").trim(),
    category: g("matCategory").trim() || "Материал",
    section: g("matSection").indexOf("Обыч") === 0 ? "regular" : "special",
    description: g("matDesc").trim(),
    link: g("matLink").trim() || null
  };
}

async function addMaterial(e){
  if(e) e.preventDefault();
  var c = cl();
  if(!c){ alert("Supabase не подключён"); return false; }
  var roles = window.OKG_ROLES;
  var st = window.OKG_ADMIN && window.OKG_ADMIN.state;
  if(roles && st && !roles.canEditMaterials(st.profile)){ alert("Недостаточно прав"); return false; }

  var payload = readForm();
  if(!payload.title){ alert("Введите название"); return false; }

  var x = await c.from("materials").insert(payload);
  if(x.error){ alert("Ошибка: " + x.error.message); return false; }

  ["matTitle","matCategory","matDesc","matLink"].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value = "";
  });

  if(window.OKG_ADMIN && window.OKG_ADMIN.loadMaterials) await window.OKG_ADMIN.loadMaterials();
  await window.OKG_SITE_RELOAD();
  return false;
}

function init(){
  var f = document.getElementById("matForm");
  if(f && !f.__okgMat){
    f.__okgMat = 1;
    f.addEventListener("submit", addMaterial, true);
    f.addEventListener("click", function(ev){
      var b = ev.target.closest && ev.target.closest('button[type="submit"], button');
      if(b && (b.textContent||"").trim() === "Добавить"){ ev.preventDefault(); addMaterial(); }
    }, true);
  }
  if(window.OKG_ADMIN) window.OKG_ADMIN.addMaterial = addMaterial;
  window.OKG_SITE_RELOAD();
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

window.OKG_MATERIALS = { add: addMaterial, reload: window.OKG_SITE_RELOAD, load: loadSiteMaterials, all: function(){ return siteMaterials; } };
})();
