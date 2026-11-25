/* BLACK VAULT — материалы: форма добавления + отрисовка сайта из БД.
   Подключается ПОСЛЕДНИМ. Перекрывает обработчики из auth2.js и admin-roles.js. */
(function(){
"use strict";

var SB_URL = "https://shbohipthoifdrcpmjtp.supabase.co";
var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm9oaXB0aG9pZmRyY3BtanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTE5MTUsImV4cCI6MjExMTE4NzkxNX0.UxyoxuAZKviMC76bGA4NdpKzJIxdN9cK_AqLNfofqUo";
var client = null;

/* sb в auth2.js объявлен через let и не попадает в window — создаём свой клиент */
function cl(){
  if(client) return client;
  if(window.sb) return (client = window.sb);
  try{
    if(window.supabase && window.supabase.createClient){
      client = window.supabase.createClient(SB_URL, SB_KEY);
      return client;
    }
  }catch(e){ console.warn("supabase client:", e.message); }
  return null;
}

function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function toast(t){ if(typeof window.toast === "function"){ try{ window.toast(t); return; }catch(e){} } console.log(t); }

var siteMaterials = null;

function normSection(v){
  var s = String(v||"").toLowerCase();
  if(s.indexOf("обыч") === 0 || s === "regular" || s === "general") return "regular";
  return "special";
}

async function loadSiteMaterials(){
  var c = cl(); if(!c) return null;
  var r = await c.from("materials").select("*").order("created_at",{ascending:false});
  if(r.error){ console.warn("materials:", r.error.message); return null; }
  siteMaterials = r.data || [];
  return siteMaterials;
}

function paintSite(){
  if(!siteMaterials || !siteMaterials.length) return;
  var names = {special:"Специальное ОКГ", regular:"Обычное ОКГ"};
  ["special","regular"].forEach(function(sec){
    var grid = document.getElementById("grid-"+sec);
    var empty = document.getElementById("empty-"+sec);
    if(!grid) return;
    var items = siteMaterials.filter(function(m){ return normSection(m.section) === sec; });
    grid.innerHTML = items.map(function(m){
      var link = m.link ? '<a href="'+esc(m.link)+'" target="_blank" rel="noopener">Открыть →</a>' : 'Открыть →';
      return '<article class="card" tabindex="0">'
        + '<span class="tag">' + esc(m.category || "Материал") + '</span>'
        + '<h3>' + esc(m.title || "") + '</h3>'
        + '<p>' + esc(m.description || "") + '</p>'
        + '<div class="card-foot"><span>' + names[sec] + '</span>'
        + '<span class="go">' + link + '</span></div>'
        + '</article>';
    }).join("");
    if(empty) empty.hidden = items.length > 0;
    var counter = document.querySelector('[data-count="'+sec+'"]');
    if(counter) counter.textContent = items.length;
  });
  var total = document.getElementById("statTotal");
  if(total) total.textContent = siteMaterials.length;
}

window.refreshMaterials = async function(){
  await loadSiteMaterials();
  paintSite();
};
window.OKG_SITE_RELOAD = window.refreshMaterials;

function readForm(){
  var g = function(id){ var el = document.getElementById(id); return el ? el.value : ""; };
  return {
    title: g("matTitle").trim(),
    category: g("matCategory").trim() || "Материал",
    section: normSection(g("matSection")),
    description: g("matDesc").trim(),
    link: g("matLink").trim() || null
  };
}

async function addMaterial(e){
  if(e){ e.preventDefault(); e.stopPropagation(); }
  var c = cl();
  if(!c){ toast("Supabase не подключён"); return false; }

  var payload = readForm();
  if(!payload.title){ toast("Введите название"); return false; }

  var x = await c.from("materials").insert(payload);
  if(x.error){ toast("Ошибка: " + x.error.message); return false; }

  var f = document.getElementById("matForm");
  if(f) f.reset();

  if(window.OKG_ADMIN && window.OKG_ADMIN.loadMaterials){
    try { await window.OKG_ADMIN.loadMaterials(); } catch(err){}
  }
  await window.refreshMaterials();
  toast("Материал добавлен");
  return false;
}

async function delMaterial(id){
  var c = cl(); if(!c) return;
  if(!confirm("Удалить материал?")) return;
  var x = await c.from("materials").delete().eq("id", id);
  if(x.error){ toast("Ошибка: " + x.error.message); return; }
  if(window.OKG_ADMIN && window.OKG_ADMIN.loadMaterials){
    try { await window.OKG_ADMIN.loadMaterials(); } catch(err){}
  }
  await window.refreshMaterials();
  toast("Материал удалён");
}

function bind(){
  var f = document.getElementById("matForm");
  if(f && !f.__okgBound){
    f.__okgBound = 1;
    f.addEventListener("submit", addMaterial, true);
    f.addEventListener("click", function(ev){
      var b = ev.target.closest && ev.target.closest('button[type="submit"]');
      if(b){ ev.preventDefault(); ev.stopPropagation(); addMaterial(); }
    }, true);
  }
  if(window.OKG_ADMIN){
    window.OKG_ADMIN.addMaterial = addMaterial;
    window.OKG_ADMIN.deleteMaterial = delMaterial;
  }
  window.addMaterial = addMaterial;
  window.deleteMaterial = delMaterial;

  document.addEventListener("click", function(ev){
    var b = ev.target.closest && ev.target.closest("[data-delmat]");
    if(b){ ev.preventDefault(); ev.stopPropagation(); delMaterial(b.dataset.delmat); }
  }, true);

  window.refreshMaterials();
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
else bind();
setTimeout(bind, 800);

window.OKG_MATERIALS = { add: addMaterial, del: delMaterial, reload: window.refreshMaterials, load: loadSiteMaterials, all: function(){ return siteMaterials; } };
})();
