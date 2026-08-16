let token = sessionStorage.getItem("sp_admin_token");

const $ = id => document.getElementById(id);

function authHeaders(){
  return { "Content-Type":"application/json", "Authorization":"Bearer " + token };
}

function showPanel(){
  $("loginCard").classList.add("hidden");
  $("panel").classList.remove("hidden");
  loadSettings();
}

async function login(){
  $("loginError").textContent = "";
  const password = $("password").value;
  const r = await fetch("/api/admin/login", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({password})
  });
  const j = await r.json();
  if(!j.ok){ $("loginError").textContent = j.error || "Login failed"; return; }
  token = j.token;
  sessionStorage.setItem("sp_admin_token", token);
  showPanel();
}

async function loadSettings(){
  const r = await fetch("/api/admin/settings", {headers:authHeaders()});
  if(r.status === 401){ logoutLocal(); return; }
  const j = await r.json();
  if(!j.ok) return;
  const s = j.settings;
  $("interval").value = s.interval;
  $("channel").value = s.channel || "";
  $("sessionActive").checked = !!s.sessionActive;
  $("sessionStatus").textContent = s.sessionActive ? "ACTIVE" : "STOPPED";
  $("intervalStatus").textContent = s.interval + "s";
  $("channelStatus").textContent = s.channel ? "@" + s.channel : "None";
}

async function save(){
  const body = {
    interval:Number($("interval").value),
    channel:$("channel").value.trim(),
    sessionActive:$("sessionActive").checked
  };
  const r = await fetch("/api/admin/settings", {
    method:"POST", headers:authHeaders(), body:JSON.stringify(body)
  });
  const j = await r.json();
  if(r.status === 401){ logoutLocal(); return; }
  $("saveMsg").textContent = j.ok ? "Settings saved." : (j.error || "Save failed.");
  if(j.ok) loadSettings();
}

async function logout(){
  try{
    await fetch("/api/admin/logout",{method:"POST",headers:authHeaders()});
  }finally{ logoutLocal(); }
}
function logoutLocal(){
  sessionStorage.removeItem("sp_admin_token");
  token = null;
  $("panel").classList.add("hidden");
  $("loginCard").classList.remove("hidden");
}
$("loginBtn").addEventListener("click", login);
$("password").addEventListener("keydown", e => { if(e.key === "Enter") login(); });
$("saveBtn").addEventListener("click", save);
$("logoutBtn").addEventListener("click", logout);

if(token) showPanel();
