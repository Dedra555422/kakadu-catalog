/* BLACK VAULT — общий клиент Supabase.
   Выставляет window.sb, чтобы admin-roles.js / audit.js / admin-materials.js
   работали с одним и тем же клиентом. Подключать после supabase-js. */
(function(){
  "use strict";
  var SB_URL="https://shbohipthoifdrcpmjtp.supabase.co";
  var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoYm9oaXB0aG9pZmRyY3BtanRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTE5MTUsImV4cCI6MjExMTE4NzkxNX0.UxyoxuAZKviMC76bGA4NdpKzJIxdN9cK_AqLNfofqUo";
  if (window.sb && typeof window.sb.from === "function") return;
  try {
    if (window.supabase && window.supabase.createClient) {
      window.sb = window.supabase.createClient(SB_URL, SB_KEY);
    }
  } catch (e) {
    console.warn("sb-bridge:", e && e.message);
  }
})();
