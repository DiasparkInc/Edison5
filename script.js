{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // Edison5 - script.js\
// Simple wheel spinner that assigns unique bedrooms to users with animation.\
\
const usersInput = document.getElementById('usersInput');\
const bedsInput  = document.getElementById('bedsInput');\
const assignBtn  = document.getElementById('assignBtn');\
const resetBtn   = document.getElementById('resetBtn');\
const exportBtn  = document.getElementById('exportBtn');\
const resultsArea = document.getElementById('resultsArea');\
const currentUser = document.getElementById('currentUser');\
const animateCheckbox = document.getElementById('animateCheckbox');\
\
const canvas = document.getElementById('wheel');\
const ctx = canvas.getContext('2d');\
const cx = canvas.width / 2;\
const cy = canvas.height / 2;\
const radius = Math.min(cx, cy) - 6;\
\
// default sample data\
usersInput.value = "Alice\\nBen\\nCarla\\nDaniel\\nEmma";\
bedsInput.value  = "Room A\\nRoom B\\nRoom C\\nRoom D\\nRoom E";\
\
let assignments = [];\
let isRunning = false;\
\
function parseLines(text)\{\
  return text.split('\\n').map(s => s.trim()).filter(Boolean);\
\}\
\
function randomColorForIndex(i, total)\{\
  // generate colorful pastel hues\
  const hue = Math.round((i / Math.max(1,total)) * 360);\
  return `hsl($\{hue\} 85% 65%)`;\
\}\
\
// draw wheel with given segments (labels: array)\
function drawWheel(labels, rotation = 0)\{\
  const n = labels.length;\
  ctx.clearRect(0,0,canvas.width, canvas.height);\
\
  // background circle glow\
  const g = ctx.createRadialGradient(cx, cy, radius*0.2, cx, cy, radius*1.2);\
  g.addColorStop(0, 'rgba(255,255,255,0.03)');\
  g.addColorStop(1, 'rgba(0,0,0,0.1)');\
  ctx.fillStyle = g;\
  ctx.beginPath();\
  ctx.arc(cx, cy, radius+6, 0, Math.PI*2);\
  ctx.fill();\
\
  const angle = (Math.PI * 2) / n;\
  for(let i=0;i<n;i++)\{\
    const start = rotation + i * angle;\
    const end = start + angle;\
    ctx.beginPath();\
    ctx.moveTo(cx, cy);\
    ctx.arc(cx, cy, radius, start, end);\
    ctx.closePath();\
    ctx.fillStyle = randomColorForIndex(i, n);\
    ctx.fill();\
    // separator\
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';\
    ctx.lineWidth = 1;\
    ctx.stroke();\
\
    // label\
    ctx.save();\
    ctx.translate(cx, cy);\
    ctx.rotate(start + angle/2);\
    ctx.textAlign = 'right';\
    ctx.fillStyle = '#052022';\
    ctx.font = 'bold 14px system-ui, Arial';\
    ctx.fillText(labels[i], radius - 12, 6);\
    ctx.restore();\
  \}\
\
  // center circle\
  ctx.beginPath();\
  ctx.arc(cx, cy, 54, 0, Math.PI*2);\
  ctx.fillStyle = 'rgba(255,255,255,0.96)';\
  ctx.fill();\
  ctx.fillStyle = '#052022';\
  ctx.font = '600 16px system-ui, Arial';\
  ctx.textAlign = 'center';\
  ctx.fillText('Edison5', cx, cy + 6);\
\
  // pointer\
  ctx.beginPath();\
  ctx.moveTo(cx, cy - radius - 10);\
  ctx.lineTo(cx - 14, cy - radius + 22);\
  ctx.lineTo(cx + 14, cy - radius + 22);\
  ctx.closePath();\
  ctx.fillStyle = 'rgba(255,255,255,0.95)';\
  ctx.fill();\
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';\
  ctx.stroke();\
\}\
\
function spinWheelPromise(labels, showAnimation=true)\{\
  return new Promise(resolve => \{\
    if(!labels.length)\{\
      resolve(null);\
      return;\
    \}\
    // pick random index\
    const chosenIndex = Math.floor(Math.random() * labels.length);\
    const n = labels.length;\
    const anglePer = 2 * Math.PI / n;\
\
    if(!showAnimation)\{\
      drawWheel(labels, 0);\
      resolve(\{label: labels[chosenIndex], index: chosenIndex\});\
      return;\
    \}\
\
    // animation: spin multiple turns then land on chosenIndex\
    const spins = 4 + Math.floor(Math.random()*3); // 4..6 spins\
    const targetRotation = - (chosenIndex + 0.5) * anglePer; // center the chosen label at top pointer\
    const start = performance.now();\
    const duration = 1600 + Math.random()*800; // 1.6s - 2.4s\
    const initial = 0;\
    function animate(now)\{\
      const t = Math.min(1, (now - start) / duration);\
      // ease out cubic\
      const ease = 1 - Math.pow(1 - t, 3);\
      const rotation = initial + ease * (spins * 2 * Math.PI + targetRotation);\
      drawWheel(labels, rotation);\
      if(t < 1)\{\
        requestAnimationFrame(animate);\
      \} else \{\
        // final nudge to exactly align\
        drawWheel(labels, spins * 2 * Math.PI + targetRotation);\
        setTimeout(()=> resolve(\{label: labels[chosenIndex], index: chosenIndex\}), 250);\
      \}\
    \}\
    requestAnimationFrame(animate);\
  \});\
\}\
\
async function assignRooms()\{\
  if(isRunning) return;\
  isRunning = true;\
  resultsArea.innerHTML = '';\
  assignments = [];\
\
  const users = parseLines(usersInput.value);\
  const beds  = parseLines(bedsInput.value);\
\
  if(users.length === 0 || beds.length === 0)\{\
    alert('Please enter at least one user and one bedroom.');\
    isRunning = false;\
    return;\
  \}\
  if(beds.length < users.length)\{\
    const ok = confirm('There are fewer bedrooms than users. Some users will remain unassigned. Continue?');\
    if(!ok)\{ isRunning = false; return; \}\
  \}\
\
  // copy of bedrooms to remove assigned ones\
  const pool = beds.slice();\
\
  for(let i=0; i<users.length; i++)\{\
    const user = users[i];\
    currentUser.textContent = `Now spinning for: $\{user\}`;\
    // draw current wheel\
    drawWheel(pool, 0);\
\
    // choose\
    const showAnim = animateCheckbox.checked;\
    const result = await spinWheelPromise(pool, showAnim);\
\
    if(result === null)\{\
      // no more bedrooms\
      assignments.push(\{user, bed: '(none)'\});\
      addResultRow(user, '(none)');\
      continue;\
    \}\
    const chosen = result.label;\
    // remove chosen from pool\
    pool.splice(result.index, 1);\
    assignments.push(\{user, bed: chosen\});\
    addResultRow(user, chosen);\
    // small pause between spins when animated\
    if(showAnim) await wait(400);\
  \}\
\
  currentUser.textContent = 'Done!';\
  isRunning = false;\
\}\
\
function addResultRow(user, bed)\{\
  const row = document.createElement('div');\
  row.className = 'result-row';\
  row.innerHTML = `<div class="user">$\{escapeHtml(user)\}</div><div class="bed">$\{escapeHtml(bed)\}</div>`;\
  resultsArea.appendChild(row);\
\}\
\
function wait(ms)\{return new Promise(r=>setTimeout(r, ms));\}\
\
function escapeHtml(s)\{ return s.replace(/[&<>"']/g, c => (\{'&':'&amp;','<':'&lt;', '>':'&gt;','"':'&quot;',"'":'&#39;'\}[c]));\}\
\
assignBtn.addEventListener('click', assignRooms);\
resetBtn.addEventListener('click', ()=>\{\
  usersInput.value = "Alice\\nBen\\nCarla\\nDaniel\\nEmma";\
  bedsInput.value  = "Room A\\nRoom B\\nRoom C\\nRoom D\\nRoom E";\
  resultsArea.innerHTML = '';\
  assignments = [];\
  currentUser.textContent = 'Ready';\
  drawWheel(parseLines(bedsInput.value));\
\});\
exportBtn.addEventListener('click', ()=>\{\
  if(assignments.length === 0)\{\
    alert('No assignments yet. Please assign first.');\
    return;\
  \}\
  const csv = ['User,Bedroom', ...assignments.map(a => `"$\{a.user.replace(/"/g,'""')\}","$\{a.bed.replace(/"/g,'""')\}"`) ].join('\\n');\
  const blob = new Blob([csv], \{type:'text/csv'\});\
  const url = URL.createObjectURL(blob);\
  const a = document.createElement('a');\
  a.href = url;\
  a.download = 'edison5-assignments.csv';\
  a.click();\
  URL.revokeObjectURL(url);\
\});\
\
// initial draw\
drawWheel(parseLines(bedsInput.value));\
\
// keep wheel updated when bedrooms text changes\
bedsInput.addEventListener('input', ()=> \{\
  const labels = parseLines(bedsInput.value);\
  if(labels.length) drawWheel(labels);\
\});\
}