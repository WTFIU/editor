// editor.js — structured JSON editor (array/object) with upload/download support
let currentData = null;
let currentType = null; // "array" or "object"

const fileInput = document.getElementById('file-input');
const loadSampleBtn = document.getElementById('load-sample');
const downloadBtn = document.getElementById('download-btn');
const editorArea = document.getElementById('editor-area');
const detectedTypeEl = document.getElementById('detected-type');
const logoutBtn = document.getElementById('logout-btn');

logoutBtn.addEventListener('click', () => window.logout());

fileInput.addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  const txt = await f.text();
  try {
    const parsed = JSON.parse(txt);
    setData(parsed);
  } catch (e) {
    alert('Invalid JSON file: ' + e.message);
  }
});

loadSampleBtn.addEventListener('click', async () => {
  const r = await fetch('data.json');
  if (!r.ok) return alert('Could not load sample data.json');
  const txt = await r.text(); // UTF-8 by default
  try {
    setData(JSON.parse(txt));
  } catch (e) { alert('Invalid JSON in sample: ' + e.message); }
});

downloadBtn.addEventListener('click', () => {
  if (currentData === null) return alert('No data loaded');
  const blob = new Blob([JSON.stringify(currentData, null, 2)], {type: 'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
});

function setData(d) {
  currentData = d;
  if (Array.isArray(d)) currentType = 'array';
  else if (d && typeof d === 'object') currentType = 'object';
  else { alert('Unsupported JSON root type (must be object or array of objects)'); return; }

  detectedTypeEl.textContent = currentType;
  renderEditor();
}

function renderEditor() {
  editorArea.innerHTML = '';
  if (currentType === 'array') renderTableEditor();
  else renderKeyValueEditor();
}

function renderTableEditor() {
  const arr = currentData;
  // compute columns union
  const columns = new Set();
  arr.forEach(item => { if (item && typeof item === 'object') Object.keys(item).forEach(k=>columns.add(k)); });
  const cols = Array.from(columns);
  const container = document.createElement('div');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  cols.forEach(c => {
    const th = document.createElement('th'); th.textContent = c; headRow.appendChild(th);
  });
  const thActions = document.createElement('th'); thActions.textContent = 'Actions'; headRow.appendChild(thActions);
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  arr.forEach((row, idx) => {
    const tr = document.createElement('tr');
    cols.forEach(c => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.value = row[c] !== undefined ? String(row[c]) : '';
      input.addEventListener('input', (e)=> { row[c] = parseValue(e.target.value); });
      td.appendChild(input);
      tr.appendChild(td);
    });
    const tdAct = document.createElement('td');
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'small-btn';
    del.addEventListener('click', ()=>{ arr.splice(idx,1); setData(arr); });
    tdAct.appendChild(del);
    tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Row';
  addBtn.addEventListener('click', ()=> {
    const newRow = {};
    cols.forEach(c => newRow[c] = '');
    arr.push(newRow);
    setData(arr);
  });
  container.appendChild(addBtn);

  // allow adding a new column
  const addColBtn = document.createElement('button');
  addColBtn.textContent = 'Add Column';
  addColBtn.style.marginLeft = '8px';
  addColBtn.addEventListener('click', ()=> {
    const colName = prompt('New column name (no spaces):');
    if (!colName) return;
    cols.push(colName);
    arr.forEach(r=> r[colName] = '');
    setData(arr);
  });
  container.appendChild(addColBtn);

  editorArea.appendChild(container);
}

function renderKeyValueEditor() {
  const obj = currentData;
  const container = document.createElement('div');
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  Object.keys(obj).forEach((k) => {
    const tr = document.createElement('tr');
    const tdKey = document.createElement('td');
    const keyInput = document.createElement('input');
    keyInput.value = k;
    keyInput.addEventListener('change', (e) => {
      const newKey = e.target.value;
      if (!newKey) { alert('Key cannot be empty'); e.target.value = k; return; }
      if (newKey !== k) {
        obj[newKey] = obj[k];
        delete obj[k];
        setData(obj);
      }
    });
    tdKey.appendChild(keyInput);

    const tdVal = document.createElement('td');
    const valInput = document.createElement('input');
    valInput.value = obj[k];
    valInput.addEventListener('input', (e)=> { obj[k] = parseValue(e.target.value); });
    tdVal.appendChild(valInput);

    const tdAct = document.createElement('td');
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'small-btn';
    del.addEventListener('click', ()=> { delete obj[k]; setData(obj); });

    tdAct.appendChild(del);
    tr.appendChild(tdKey); tr.appendChild(tdVal); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Field';
  addBtn.addEventListener('click', ()=> {
    const key = prompt('Field name:');
    if (!key) return;
    obj[key] = '';
    setData(obj);
  });
  container.appendChild(addBtn);

  editorArea.appendChild(container);
}

function parseValue(raw) {
  // try to parse numbers and booleans, else return string
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === '') return '';
  if (!isNaN(raw) && raw.trim() !== '') {
    // preserve integers/decimals
    return raw.includes('.') ? parseFloat(raw) : parseInt(raw, 10);
  }
  return raw;
}

// initialize after authentication
document.addEventListener('editor:authenticated', () => {
  // nothing: wait for user to load sample or upload
});
