// Edison5 - Full spinning wheel script.js
const usersInput = document.getElementById('usersInput');
const bedsInput  = document.getElementById('bedsInput');
const assignBtn  = document.getElementById('assignBtn');
const resetBtn   = document.getElementById('resetBtn');
const exportBtn  = document.getElementById('exportBtn');
const resultsArea = document.getElementById('resultsArea');
const currentUser = document.getElementById('currentUser');
const animateCheckbox = document.getElementById('animateCheckbox');

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const cx = canvas.width / 2;
const cy = canvas.height / 2;
const radius = Math.min(cx, cy) - 6;

let assignments = [];
let isRunning = false;

function parseLines(text){
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function randomColorForIndex(i, total){
  const hue = Math.round((i / Math.max(1,total)) * 360);
  return `hsl(${hue} 85% 65%)`;
}

function drawWheel(labels, rotation = 0){
  const n = labels.length;
  ctx.clearRect(0,0,canvas.width, canvas.height);
  const angle = (Math.PI * 2) / n;
  for(let i=0;i<n;i++){
    const start = rotation + i * angle;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = randomColorForIndex(i, n);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + angle/2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#052022';
    ctx.font = 'bold 14px system-ui, Arial';
    ctx.fillText(labels[i], radius - 12, 6);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fill();
  ctx.fillStyle = '#052022';
  ctx.font = '600 16px system-ui, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Edison5', cx, cy + 6);
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius - 10);
  ctx.lineTo(cx - 14, cy - radius + 22);
  ctx.lineTo(cx + 14, cy - radius + 22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.stroke();
}

function spinWheelPromise(labels, showAnimation=true){
  return new Promise(resolve => {
    if(!labels.length){resolve(null); return;}
    const chosenIndex = Math.floor(Math.random() * labels.length);
    const n = labels.length;
    const anglePer = 2 * Math.PI / n;
    if(!showAnimation){drawWheel(labels, 0); resolve({label: labels[chosenIndex], index: chosenIndex}); return;}
    const spins = 4 + Math.floor(Math.random()*3);
    const targetRotation = - (chosenIndex + 0.5) * anglePer;
    const start = performance.now();
    const duration = 1600 + Math.random()*800;
    function animate(now){
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const rotation = ease * (spins * 2 * Math.PI + targetRotation);
      drawWheel(labels, rotation);
      if(t < 1){ requestAnimationFrame(animate); }
      else { drawWheel(labels, spins * 2 * Math.PI + targetRotation); setTimeout(()=> resolve({label: labels[chosenIndex], index: chosenIndex}), 250); }
    }
    requestAnimationFrame(animate);
  });
}

function wait(ms){return new Promise(r=>setTimeout(r, ms));}

function addResultRow(user, bed){
  const row = document.createElement('div');
  row.className = 'result-row';
  row.innerHTML = `<div class='user'>${user}</div><div class='bed'>${bed}</div>`;
  resultsArea.appendChild(row);
}

async function assignRooms(){
  if(isRunning) return;
  isRunning = true;
  resultsArea.innerHTML = '';
  assignments = [];
  const users = parseLines(usersInput.value);
  const beds  = parseLines(bedsInput.value);
  if(users.length === 0 || beds.length === 0){alert('Please enter at least one user and one bedroom.'); isRunning=false; return;}
  const pool = beds.slice();
  for(let i=0;i<users.length;i++){
    const user = users[i];
    currentUser.textContent = `Now spinning for: ${user}`;
    drawWheel(pool,0);
    const showAnim = animateCheckbox.checked;
    const result = await spinWheelPromise(pool, showAnim);
    if(result === null){ assignments.push({user, bed:'(none)'}); addResultRow(user,'(none)'); continue;}
    const chosen = result.label;
    pool.splice(result.index,1);
    assignments.push({user, bed:chosen});
    addResultRow(user,chosen);
    if(showAnim) await wait(400);
  }
  currentUser.textContent='Done!';
  isRunning=false;
}

assignBtn.addEventListener('click', assignRooms);
resetBtn.addEventListener('click',()=>{usersInput.value='Alice\nBen\nCarla\nDaniel\nEmma'; bedsInput.value='Room A\nRoom B\nRoom C\nRoom D\nRoom E'; resultsArea.innerHTML=''; assignments=[]; currentUser.textContent='Ready'; drawWheel(parseLines(bedsInput.value));});
exportBtn.addEventListener('click',()=>{if(assignments.length===0){alert('No assignments yet.'); return;} const csv=['User,Bedroom',...assignments.map(a=>`"${a.user.replace(/"/g,'""')}","${a.bed.replace(/"/g,'""')}"`)].join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='edison5-assignments.csv'; a.click(); URL.revokeObjectURL(url);});
drawWheel(parseLines(bedsInput.value));
bedsInput.addEventListener('input',()=>{const labels=parseLines(bedsInput.value); if(labels.length) drawWheel(labels);});
