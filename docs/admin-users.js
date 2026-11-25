/* BLACK VAULT — управление ролями пользователей. Подключается ПОСЛЕ admin-roles.js и admin-materials.js. */
(function(){
"use strict";
var SB_URL="https://shbohipthoifdrcpmjtp.supabase.co";
var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm9oaXB0aG9pZmRyY3BtanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTE5MTUsImV4cCI6MjExMTE4NzkxNX0.UxyoxuAZKviMC76bGA4NdpKzJIxdN9cK_AqLNfofqUo";
var client=null;
function cl(){
  if(client) return client;
  if(window.sb && typeof window.sb.from==="function") return (client=window.sb);
  try{ if(window.supabase && window.supabase.createClient){ client=window.supabase.createClient(SB_URL,SB_KEY); return client; } }catch(e){ console.warn("supabase:",e.message); }
  return null;
}
var LABELS={tech:"Технический администратор",head:"Глава ОКГ",deputy:"Зам. главы ОКГ",staff:"Сотрудник ОКГ",user:"Пользователь"};
var ORDER=["tech","head","deputy","staff","user"];
function roleOf(p){ var r=(p&&p.role)||"user"; if(r==="admin") r="head"; return LABELS[r]?r:"user"; }
function isTech(p){ return roleOf(p)==="tech"; }
function canRoles(p){ var r=roleOf(p); return r==="tech"||r==="head"; }
function canUsers(p){ var r=roleOf(p); return r==="tech"||r==="head"||r==="deputy"; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function toast(t){ if(typeof window.toast==="function"){ try{ window.toast(t); return; }catch(e){} } console.log(t); }
var S={profile:null,users:[]};

function roleSelect(u){
  var cur=roleOf(u), me=S.profile, opts="";
  ORDER.forEach(function(r){
    if(r==="tech" && !isTech(me)) return;
    if(r==="head" && !(isTech(me)||roleOf(me)==="head")) return;
    opts+='<option value="'+r+'"'+(r===cur?" selected":"")+">"+LABELS[r]+"</option>";
  });
  return '<select class="role-select" data-role-for="'+esc(u.id)+'">'+opts+"</select>";
}

function renderUsers(){
  var box=document.getElementById("adminUsers");
  if(!box) return;
  if(!canUsers(S.profile)){ box.innerHTML='<div class="admin-empty">Нет доступа</div>'; return; }
  if(!S.users.length){ box.innerHTML='<div class="admin-empty">Пользователей нет</div>'; return; }
  box.innerHTML=S.users.map(function(u){
    var editable=canRoles(S.profile) && (isTech(S.profile)||roleOf(u)!=="tech");
    var actions=(editable?roleSelect(u):"")
      + (u.status!=="approved" ? '<button data-approve="'+esc(u.id)+'">Одобрить</button>' : "")
      + (u.status==="approved" ? '<button class="btn-ghost" data-block="'+esc(u.id)+'">Заблокировать</button>' : "");
    return '<div class="admin-row"><div><strong>'+esc(u.nickname||u.email||"—")+'</strong>'
      +'<div class="muted">'+esc(u.email||"")+" · "+esc(LABELS[roleOf(u)])+" · "+esc(u.status||"pending")+'</div></div>'
      +'<div class="admin-actions">'+actions+'</div></div>';
  }).join("");
  box.querySelectorAll("[data-role-for]").forEach(function(sel){
    sel.onchange=function(){ setRole(sel.dataset.roleFor, sel.value, sel); };
  });
  box.querySelectorAll("[data-approve]").forEach(function(b){
    b.onclick=function(){ setStatus(b.dataset.approve,"approved"); };
  });
  box.querySelectorAll("[data-block]").forEach(function(b){
    b.onclick=function(){ setStatus(b.dataset.block,"blocked"); };
  });
}

async function loadUsers(){
  var c=cl(); if(!c) return;
  var r=await c.from("profiles").select("*").order("created_at",{ascending:true});
  if(r.error){ console.warn("profiles:",r.error.message); return; }
  S.users=r.data||[];
  renderUsers();
}

async function loadMe(){
  var c=cl(); if(!c) return null;
  var u=await c.auth.getUser();
  var usr=u&&u.data&&u.data.user;
  if(!usr) return null;
  var r=await c.from("profiles").select("*").eq("id",usr.id).maybeSingle();
  if(r.error){ console.warn("profile:",r.error.message); return null; }
  S.profile=r.data||null;
  if(window.OKG_ADMIN && window.OKG_ADMIN.state) window.OKG_ADMIN.state.profile=S.profile;
  return S.profile;
}

async function setRole(id, role, sel){
  var c=cl(); if(!c){ toast("Supabase не подключён"); return; }
  if(!canRoles(S.profile)){ toast("Недостаточно прав"); if(sel) sel.value=roleOf(S.users.find(function(x){return x.id===id;})); return; }
  if(role==="tech" && !isTech(S.profile)){ toast("Только техно-админ назначает эту роль"); if(sel) sel.value=roleOf(S.users.find(function(x){return x.id===id;})); return; }
  var x=await c.from("profiles").update({role:role}).eq("id",id);
  if(x.error){ toast("Ошибка: "+x.error.message); return; }
  var u=S.users.find(function(v){ return v.id===id; });
  if(u) u.role=role;
  renderUsers();
  toast("Роль изменена: "+LABELS[role]);
}

async function setStatus(id, status){
  var c=cl(); if(!c) return;
  if(!canUsers(S.profile)){ toast("Недостаточно прав"); return; }
  var x=await c.from("profiles").update({status:status}).eq("id",id);
  if(x.error){ toast("Ошибка: "+x.error.message); return; }
  var u=S.users.find(function(v){ return v.id===id; });
  if(u) u.status=status;
  renderUsers();
  toast(status==="approved"?"Доступ выдан":"Доступ забран");
}

async function refresh(){
  await loadMe();
  await loadUsers();
}

function bind(){
  if(window.__okgUsers) return;
  window.__okgUsers=1;
  document.addEventListener("click", function(e){
    var b=e.target.closest && e.target.closest("[data-open-admin]");
    if(b){ setTimeout(refresh, 700); }
  }, true);
  var iv=setInterval(function(){
    var box=document.getElementById("adminUsers");
    if(box && !box.dataset.okgBound){
      box.dataset.okgBound="1";
      clearInterval(iv);
      refresh();
    }
  }, 500);
  setTimeout(function(){
    var box=document.getElementById("adminUsers");
    if(box && !box.dataset.okgBound){ box.dataset.okgBound="1"; refresh(); }
  }, 2500);
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", bind);
else bind();

window.OKG_USERS={refresh:refresh, loadUsers:loadUsers, setRole:setRole, setStatus:setStatus, state:S, labels:LABELS, order:ORDER};
})();
