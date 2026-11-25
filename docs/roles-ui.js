/* BLACK VAULT — выпадающие списки ролей в админке. Подключать ПОСЛЕ admin-roles.js. */
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
function isHead(p){ return roleOf(p)==="head"; }
function canRoles(p){ var r=roleOf(p); return r==="tech"||r==="head"; }
function canUsers(p){ var r=roleOf(p); return r==="tech"||r==="head"||r==="deputy"; }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function toast(t){ if(typeof window.toast==="function"){ try{ window.toast(t); return; }catch(e){} } console.log(t); }
var S={profile:null,users:[],ready:false};

function roleSelect(u){
  var cur=roleOf(u), me=S.profile, opts="";
  ORDER.forEach(function(r){
    if(r==="tech" && !isTech(me)) return;
    if(r==="head" && !(isTech(me)||isHead(me))) return;
    opts+='<option value="'+r+'"'+(r===cur?" selected":"")+">"+LABELS[r]+"</option>";
  });
  return '<select class="role-select" data-role-for="'+esc(u.id)+'">'+opts+"</select>";
}

function renderUsers(){
  var box=document.getElementById("adminUsers");
  if(!box || !S.ready) return;
  if(!canUsers(S.profile)){ box.innerHTML='<div class="admin-empty">Нет доступа</div>'; return; }
  if(!S.users.length){ box.innerHTML='<div class="admin-empty">Пользователей нет</div>'; return; }
  box.innerHTML=S.users.map(function(u){
    var editable=canRoles(S.profile) && (isTech(S.profile)||roleOf(u)!=="tech");
    var actions=(editable?roleSelect(u):"")
      + (u.status!=="approved" ? '<button data-approve="'+esc(u.id)+'">Одобрить</button>' : "")
      + (u.status==="approved" ? '<button class="btn-ghost" data-block="'+esc(u.id)+'">Заблокировать</button>' : "");
    return '<div class="admin-row"><div><strong>'+esc(u.nickname||u.email||"—")+"</strong>"
      +'<div class="muted">'+esc(u.email||"")+" · "+esc(LABELS[roleOf(u)])+" · "+esc(u.status||"pending")+'</div></div>'
      +'<div class="admin-actions">'+actions+'</div></div>';
  }).join("");
  box.querySelectorAll("[data-role-for]").forEach(function(s){
    s.onchange=function(){ setRole(s.dataset.roleFor, s.value, s); };
  });
  box.querySelectorAll("[data-approve]").forEach(function(b){
    b.onclick=function(){ setStatus(b.dataset.approve,"approved"); };
  });
  box.querySelectorAll("[data-block]").forEach(function(b){
    b.onclick=function(){ setStatus(b.dataset.block,"blocked"); };
  });
}

async function setRole(id, role, sel){
  var c=cl(); if(!c) return toast("Нет связи с базой");
  if(sel) sel.disabled=true;
  var r=await c.from("profiles").update({role:role}).eq("id",id);
  if(sel) sel.disabled=false;
  if(r.error){ toast("Ошибка: "+r.error.message); return; }
  var u=S.users.find(function(x){return x.id===id;}); if(u) u.role=role;
  toast("Роль обновлена: "+LABELS[role]);
}

async function setStatus(id, status){
  var c=cl(); if(!c) return toast("Нет связи с базой");
  var r=await c.from("profiles").update({status:status}).eq("id",id);
  if(r.error){ toast("Ошибка: "+r.error.message); return; }
  var u=S.users.find(function(x){return x.id===id;}); if(u) u.status=status;
  toast(status==="approved"?"Пользователь одобрен":"Пользователь заблокирован");
  renderUsers();
}

async function loadMe(){
  var c=cl(); if(!c) return null;
  try{
    var s=await c.auth.getSession();
    var uid=s && s.data && s.data.session && s.data.session.user && s.data.session.user.id;
    if(uid){
      var p=await c.from("profiles").select("*").eq("id",uid).maybeSingle();
      if(p.data) return p.data;
    }
    var g=await c.auth.getUser();
    var gid=g && g.data && g.data.user && g.data.user.id;
    if(gid){
      var p2=await c.from("profiles").select("*").eq("id",gid).maybeSingle();
      if(p2.data) return p2.data;
    }
  }catch(e){ console.warn("loadMe:",e.message); }
  return null;
}

async function loadUsers(){
  var c=cl(); if(!c) return [];
  var r=await c.from("profiles").select("*").order("created_at",{ascending:true});
  if(r.error){ console.warn("users:",r.error.message); return []; }
  return r.data||[];
}

async function refresh(){
  S.profile=await loadMe();
  S.users=await loadUsers();
  S.ready=true;
  renderUsers();
}

function bind(){
  var box=document.getElementById("adminUsers");
  if(!box) return;
  refresh();
  var t=null;
  var mo=new MutationObserver(function(){
    if(!S.ready) return;
    clearTimeout(t);
    t=setTimeout(function(){
      var sel=box.querySelector(".role-select");
      if(!sel) renderUsers();
    },300);
  });
  mo.observe(box,{childList:true});
  var btn=document.getElementById("adminRefresh");
  if(btn) btn.onclick=refresh;
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){ setTimeout(bind,800); });
else setTimeout(bind,800);
window.OKG_ROLES={refresh:refresh,setRole:setRole};
})();
