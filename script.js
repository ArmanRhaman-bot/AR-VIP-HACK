const $ = (id) => document.getElementById(id);

const colorMap = {
  0: ["VIOLET", "violet"], 1: ["RED", "red"], 2: ["GREEN", "green"],
  3: ["RED", "red"], 4: ["GREEN", "green"], 5: ["VIOLET", "violet"],
  6: ["RED", "red"], 7: ["GREEN", "green"], 8: ["RED", "red"], 9: ["GREEN", "green"]
};

function sizeOf(n){ return Number(n) <= 4 ? "SMALL" : "BIG"; }
function colorOf(n){ return colorMap[Number(n)] || ["UNKNOWN",""]; }

function analyze(list){
  const recent = list.slice(0, 5).map(x => sizeOf(x.number));
  if (!recent.length) return {size:"--", score:0, range:"--"};

  const big = recent.filter(x => x === "BIG").length;
  const small = recent.length - big;

  let size = big > small ? "BIG" : small > big ? "SMALL" : "MIXED";
  let score = Math.round((Math.max(big, small) / recent.length) * 100);

  const nums = list.slice(0, 10).map(x => Number(x.number)).filter(Number.isFinite);
  const range = nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : "--";

  return {size, score, range};
}

function renderHistory(list){
  $("history").innerHTML = list.slice(0, 12).map(x => {
    const n = Number(x.number);
    const [color, cls] = colorOf(n);
    return `<div class="history-row">
      <div><small>${x.issueNumber ?? "--"}</small></div>
      <div class="number">${n}</div>
      <div><b>${sizeOf(n)}</b></div>
      <div class="color-dot"><i class="dot ${cls}"></i>${color}</div>
    </div>`;
  }).join("");
}

async function load(){
  const r = await fetch("/api/history", {cache:"no-store"});
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || "Data unavailable");
  const list = j.list || [];
  if (!list.length) throw new Error("No live results returned.");

  const latest = list[0];
  const a = analyze(list);
  const nextPeriod = String(Number(latest.issueNumber) + 1);

  $("period").textContent = latest.issueNumber ?? "--";
  $("number").textContent = latest.number ?? "--";
  $("color").textContent = colorOf(latest.number)[0];
  $("nextPeriod").textContent = nextPeriod;
  $("nextSize").textContent = a.size;
  $("confidenceValue").textContent = a.score;
  $("range").textContent = a.range;
  $("nextColor").textContent = colorOf(latest.number)[0];
  $("updated").textContent = "Updated " + new Date().toLocaleTimeString();
  $("liveDot").innerHTML = "<span></span> LIVE";
  renderHistory(list);
}

async function safeLoad(){
  try { await load(); }
  catch(e){
    $("liveDot").innerHTML = "<span style='background:#ef4444'></span> OFFLINE";
    $("analysisSize").textContent = "Data unavailable";
    $("updated").textContent = e.message;
  }
}

$("refreshBtn").addEventListener("click", safeLoad);
safeLoad();
setInterval(safeLoad, 15000);
