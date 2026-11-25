/* BLACK VAULT - role dropdowns in admin panel. Load AFTER admin-roles.js. */
(function(){
"use strict";
var LT=String.fromCharCode(60), GT=String.fromCharCode(62);
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
function esc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function toast(t){ if(typeof window.toast==="function"){ try{ window.toast(t); return; }catch(e){} } console.log(t); }
var S={profile:null,users:[],ready:false};

function roleSelect(u){
  var cur=roleOf(u), me=S.profile, opts="";
  ORDER.forEach(function(r){
    if(r==="tech" && !isTech(me)) return;
    if(r==="head" && !(isTech(me)||isHead(me))) return;
    opts+=LT+"option value=\""+r+"\""+(r===cur?" selected":"")+GT+LABELS[r]+LT+"/option"+GT;
  });
  return LT+"select class=\"role-select\" data-role-for=\""+esc(u.id)+"\""+GT+opts+LT+"/select"+GT;
}

function renderUsers(){
  var box=document.getElementById("adminUsers");
  if(!box || !S.ready) return;
  if(!canUsers(S.profile)){ box.innerHTML=LT+"div class=\"admin-empty\""+GT+"Нет доступа"+LT+"/div"+GT; return; }
  if(!S.users.length){ box.innerHTML=LT+"div class=\"admin-empty\""+GT+"Пользователей нет"+LT+"/div"+GT; return; }
  box.innerHTML=S.users.map(function(u){
    var editable=canRoles(S.profile) && (isTech(S.profile)||roleOf(u)!=="tech");
    var actions=(editable?roleSelect(u):"")
      + (u.status!=="approved" ? LT+"button data-approve=\""+esc(u.id)+"\""+GT+"Одобрить"+LT+"/button"+GT : "")
      + (u.status==="approved" ? LT+"button class=\"btn-ghost\" data-block=\""+esc(u.id)+"\""+GT+"Заблокировать"+LT+"/button"+GT : "");
    return LT+"div class=\"admin-row\""+GT+LT+"div"+GT+LT+"strong"+GT+esc(u.nickname||u.email||"—")+LT+"/strong"+GT
      + LT+"div class=\"muted\""+GT+esc(u.email||"")+" · "+esc(LABELS[roleOf(u)])+" · "+esc(u.status||"pending")+LT+"/div"+GT+LT+"/div"+GT
      + LT+"div class=\"admin-actions\""+GT+actions+LT+"/div"+GT+LT+"/div"+GT;
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
      if(!box.querySelector(".role-select")) renderUsers();
    },300);
  });
  mo.observe(box,{childList:true});
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){ setTimeout(bind,900); });
else setTimeout(bind,900);
window.OKG_ROLES={refresh:refresh,setRole:setRole};
})();
