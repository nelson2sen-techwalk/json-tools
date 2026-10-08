// ---------- 页签切换 ----------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

const $ = id => document.getElementById(id);

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'err');
}

function parseJSON(text) {
  const t = text.trim();
  if (!t) throw new Error('输入是空的，请先粘贴 JSON');
  return JSON.parse(t);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---------- 美化 ----------
const inputEl = $('input'), outputEl = $('output'), msgEl = $('beautify-msg');
const indentSel = $('indent');

function currentIndent() {
  const v = indentSel.value;
  return v === 'tab' ? '\t' : ' '.repeat(parseInt(v, 10));
}

$('btn-format').addEventListener('click', () => {
  try {
    const obj = parseJSON(inputEl.value);
    outputEl.textContent = JSON.stringify(obj, null, currentIndent());
    showMsg(msgEl, '美化成功', true);
  } catch (e) {
    outputEl.textContent = '';
    showMsg(msgEl, 'JSON 解析失败：' + e.message, false);
  }
});

$('btn-minify').addEventListener('click', () => {
  try {
    const obj = parseJSON(inputEl.value);
    outputEl.textContent = JSON.stringify(obj);
    showMsg(msgEl, '压缩成功', true);
  } catch (e) {
    outputEl.textContent = '';
    showMsg(msgEl, 'JSON 解析失败：' + e.message, false);
  }
});

$('btn-sample').addEventListener('click', () => {
  inputEl.value = JSON.stringify({
    name: 'muse', version: 1,
    features: ['美化', '对比', '纯前端'],
    meta: { local: true, upload: false }
  }, null, 2);
  msgEl.textContent = '';
  msgEl.className = 'msg';
});

$('btn-clear').addEventListener('click', () => {
  inputEl.value = '';
  outputEl.textContent = '';
  msgEl.textContent = '';
  msgEl.className = 'msg';
});

$('btn-copy').addEventListener('click', async () => {
  const text = outputEl.textContent;
  if (!text) { showMsg(msgEl, '还没有结果可以复制', false); return; }
  try {
    await navigator.clipboard.writeText(text);
    showMsg(msgEl, '已复制到剪贴板', true);
  } catch (e) {
    const range = document.createRange();
    range.selectNodeContents(outputEl);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    showMsg(msgEl, '自动复制失败，已帮你选中结果，按 Ctrl/Cmd+C 手动复制', false);
  }
});

// ---------- 对比 ----------
const diffA = $('diff-a'), diffB = $('diff-b');
const diffMsg = $('diff-msg'), diffOut = $('diff-output');

function shortVal(v) {
  if (v === undefined) return '—';
  const s = JSON.stringify(v);
  return s.length > 80 ? s.slice(0, 80) + '…' : s;
}

function fmtPath(segs) {
  if (!segs.length) return '$';
  return '$' + segs.map(s =>
    typeof s === 'number' ? '[' + s + ']'
      : /^[A-Za-z_$][\w$]*$/.test(s) ? '.' + s
      : '[' + JSON.stringify(s) + ']'
  ).join('');
}

// 递归对比，结果写入 out：{ path, type: added|removed|changed|type, a, b }
function diffValue(a, b, path, out) {
  if (a === undefined) { out.push({ path: fmtPath(path), type: 'added', a, b }); return; }
  if (b === undefined) { out.push({ path: fmtPath(path), type: 'removed', a, b }); return; }
  const kind = v => Array.isArray(v) ? 'array' : (v !== null && typeof v === 'object' ? 'object' : typeof v);
  const ka = kind(a), kb = kind(b);
  if (ka !== kb) { out.push({ path: fmtPath(path), type: 'type', a, b }); return; }
  if (ka === 'object') {
    new Set([...Object.keys(a), ...Object.keys(b)])
      .forEach(k => diffValue(a[k], b[k], [...path, k], out));
    return;
  }
  if (ka === 'array') {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) diffValue(a[i], b[i], [...path, i], out);
    return;
  }
  if (a !== b) out.push({ path: fmtPath(path), type: 'changed', a, b });
}

const TYPE_LABEL = { added: '右边新增', removed: '右边删除', changed: '取值不同', type: '类型不同' };

$('btn-diff').addEventListener('click', () => {
  diffOut.innerHTML = '';
  let a, b;
  try { a = parseJSON(diffA.value); }
  catch (e) { showMsg(diffMsg, '左边 JSON 解析失败：' + e.message, false); return; }
  try { b = parseJSON(diffB.value); }
  catch (e) { showMsg(diffMsg, '右边 JSON 解析失败：' + e.message, false); return; }
  const diffs = [];
  diffValue(a, b, [], diffs);
  if (!diffs.length) {
    showMsg(diffMsg, '两边完全相同', true);
    return;
  }
  showMsg(diffMsg, '共发现 ' + diffs.length + ' 处差异', true);
  const frag = document.createDocumentFragment();
  diffs.forEach(d => {
    const row = document.createElement('div');
    row.className = 'diff-row ' + d.type;
    const label = document.createElement('span');
    label.className = 'diff-type';
    label.textContent = TYPE_LABEL[d.type];
    const path = document.createElement('code');
    path.className = 'diff-path';
    path.textContent = d.path;
    const vals = document.createElement('span');
    vals.className = 'diff-vals';
    const va = document.createElement('span');
    va.className = 'v-a';
    va.textContent = shortVal(d.a);
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    const vb = document.createElement('span');
    vb.className = 'v-b';
    vb.textContent = shortVal(d.b);
    vals.append(va, arrow, vb);
    row.append(label, path, vals);
    frag.appendChild(row);
  });
  diffOut.appendChild(frag);
});

$('btn-diff-sample').addEventListener('click', () => {
  diffA.value = JSON.stringify({ name: 'muse', version: 1, tags: ['a', 'b'], on: true }, null, 2);
  diffB.value = JSON.stringify({ name: 'muse', version: 2, tags: ['a', 'c'], extra: 'new' }, null, 2);
  diffMsg.textContent = '';
  diffMsg.className = 'msg';
  diffOut.innerHTML = '';
});

$('btn-diff-clear').addEventListener('click', () => {
  diffA.value = '';
  diffB.value = '';
  diffMsg.textContent = '';
  diffMsg.className = 'msg';
  diffOut.innerHTML = '';
});
