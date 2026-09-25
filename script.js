// ---- State ----
// items: no persistence by design — everything resets on page reload.
let items = [];
let itemType = 'exam';   // 'exam' | 'project' — which intake form is active
let knowledge = 3;       // currently selected knowledge level (1-5) for the exam form

// ---- DOM refs ----
const tabExam = document.getElementById('tabExam');
const tabProject = document.getElementById('tabProject');
const examFields = document.getElementById('examFields');
const projectFields = document.getElementById('projectFields');
const nameLabel = document.getElementById('nameLabel');
const daysLabel = document.getElementById('daysLabel');
const nameInput = document.getElementById('nameInput');
const daysInput = document.getElementById('daysInput');
const knowBtns = document.getElementById('knowBtns');
const completeSlider = document.getElementById('completeSlider');
const completeVal = document.getElementById('completeVal');
const timeSlider = document.getElementById('timeSlider');
const prepSlider = document.getElementById('prepSlider');
const timeVal = document.getElementById('timeVal');
const prepVal = document.getElementById('prepVal');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const emptyMsg = document.getElementById('emptyMsg');

// ---- Knowledge level buttons (exam form) ----
function setActiveKnow(v){
  knowledge = v;
  [...knowBtns.children].forEach(b => {
    const on = +b.dataset.v === v;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
}
setActiveKnow(3);
knowBtns.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') setActiveKnow(+e.target.dataset.v);
});

// ---- Exam / Project tab toggle ----
tabExam.addEventListener('click', () => {
  itemType = 'exam';
  tabExam.classList.add('active'); tabExam.setAttribute('aria-pressed', 'true');
  tabProject.classList.remove('active'); tabProject.setAttribute('aria-pressed', 'false');
  examFields.style.display = 'block';
  projectFields.style.display = 'none';
  daysLabel.textContent = 'Days until exam — 0 = today/overdue';
});
tabProject.addEventListener('click', () => {
  itemType = 'project';
  tabProject.classList.add('active'); tabProject.setAttribute('aria-pressed', 'true');
  tabExam.classList.remove('active'); tabExam.setAttribute('aria-pressed', 'false');
  examFields.style.display = 'none';
  projectFields.style.display = 'block';
  daysLabel.textContent = 'Days until deadline — 0 = today/overdue';
});

// ---- % complete slider (project form) ----
completeSlider.addEventListener('input', () => {
  completeVal.textContent = completeSlider.value + '%';
});

// ---- Weighting sliders ----
// The two sliders are linked: they always sum to 100%.
// Dragging one automatically pushes the other to (100 - value).
function syncSliders(changed){
  let t = +timeSlider.value, p = +prepSlider.value;
  if (changed === 'time') { p = 100 - t; prepSlider.value = p; }
  else                    { t = 100 - p; timeSlider.value = t; }
  timeVal.textContent = timeSlider.value + '%';
  prepVal.textContent = prepSlider.value + '%';
  render();
}
timeSlider.addEventListener('input', () => syncSliders('time'));
prepSlider.addEventListener('input', () => syncSliders('prep'));

// ---- Add item ----
addBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  const days = Math.max(0, parseInt(daysInput.value) || 0);
  if (!name) { nameInput.focus(); return; }

  if (itemType === 'exam') {
    items.push({ id: cryptoRandomId(), type: 'exam', name, days, readiness: knowledge });
  } else {
    const pct = +completeSlider.value;
    // Map 0–100% complete onto the same 1–5 readiness scale exams use,
    // so both item types feed the same urgency formula below.
    const readiness = 1 + (pct / 100) * 4;
    items.push({ id: cryptoRandomId(), type: 'project', name, days, readiness, pct });
  }
  nameInput.value = '';
  render();
});
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });
daysInput.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

function cryptoRandomId(){
  return (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random());
}

// ---- Urgency formula ----
// urgency = timeWeight × timeScore + prepWeight × prepScore   (0–100)
//
// timeScore: rises as the deadline approaches.
//   - 0 days left (or overdue) → timeScore = 1 (max), never divides by zero
//   - otherwise → 1 / daysLeft, capped at 1 so a 1-day deadline is already max
//
// prepScore: rises as readiness falls.
//   - readiness runs 1 (barely started) to 5 (fully ready/known)
//   - prepScore = (5 - readiness) / 4, so 1→1 (max urgency) and 5→0 (none)
//
// timeWeight + prepWeight always sum to 1 (the two linked sliders, /100 each).
function urgency(item){
  const t = +timeSlider.value / 100;
  const p = +prepSlider.value / 100;
  const timeScore = item.days <= 0 ? 1 : Math.min(1, 1 / item.days);
  const prepScore = (5 - item.readiness) / 4;
  return Math.round((t * timeScore + p * prepScore) * 100);
}

function tier(score){ return score >= 66 ? 'high' : score >= 33 ? 'mid' : 'low'; }
function tierWord(t){ return t === 'high' ? 'Now' : t === 'mid' ? 'Soon' : 'Later'; }

function escapeHtml(s){
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ---- Render (with FLIP re-sort animation) ----
function render(){
  // FLIP step 1: record each existing card's current position ("First").
  const oldPos = {};
  [...list.children].forEach(el => {
    oldPos[el.dataset.id] = el.getBoundingClientRect().top;
  });

  const sorted = [...items].sort((a, b) => urgency(b) - urgency(a));
  emptyMsg.style.display = sorted.length ? 'none' : 'block';
  list.innerHTML = '';

  sorted.forEach(item => {
    const score = urgency(item);
    const t = tier(score);
    const readinessLabel = item.type === 'exam' ? `${item.readiness}/5` : `${item.pct}%`;
    const readinessKey = item.type === 'exam' ? 'Knowledge' : 'Complete';

    const el = document.createElement('div');
    el.className = 'tag';
    el.dataset.id = item.id;
    el.innerHTML = `
      <div class="tag-band tier-${t}"></div>
      <div class="tag-hole"><span></span></div>
      <div class="tag-body">
        ${score >= 80 ? `<div class="stamp-mark">Urgent</div>` : ''}
        <div class="tag-top">
          <span class="tag-name">${escapeHtml(item.name)}</span>
          <button class="del" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}">×</button>
        </div>
        <div class="tag-type">${item.type}</div>
        <div class="tag-stub">
          <div class="metric"><span>Days left</span><b>${item.days === 0 ? 'Due now' : item.days}</b></div>
          <div class="metric"><span>${readinessKey}</span><b>${readinessLabel}</b></div>
          <div class="tag-score tier-${t}">${score}<small>${tierWord(t)}</small></div>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  // FLIP step 2 ("Last, Invert, Play"): compare new positions to the old ones,
  // then animate the delta back to zero so cards visibly slide into place
  // instead of instantly snapping — this is the "re-sorting" effect.
  [...list.children].forEach(el => {
    const id = el.dataset.id;
    if (oldPos[id] === undefined) return; // newly added card — no animation needed
    const newTop = el.getBoundingClientRect().top;
    const delta = oldPos[id] - newTop;
    if (Math.abs(delta) < 1) return;
    el.style.transform = `translateY(${delta}px)`;
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      el.style.transition = 'transform .4s cubic-bezier(.2,.8,.2,1)';
      el.style.transform = '';
    });
  });

  // Delegate delete clicks (elements are recreated every render, so listeners
  // are reattached each time — cheap at this list size).
  list.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', () => {
      items = items.filter(i => i.id !== btn.dataset.id);
      render();
    });
  });
}

render();
