const form = document.querySelector('#create-form');
const message = document.querySelector('#message');
const runs = document.querySelector('#runs');
let busy = false;

async function request(path, options) {
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function node(tag, text, className) {
  const result = document.createElement(tag);
  result.textContent = text;
  if (className) result.className = className;
  return result;
}

function showMessage(text, error = false) {
  message.textContent = text;
  message.className = error ? 'error' : '';
}

async function reload() {
  const [history, status] = await Promise.all([request('/api/runs'), request('/api/status')]);
  runs.replaceChildren();
  document.querySelector('#storage').textContent = `SQLite file · ${history.runs.length} saved record(s) · ${status.recoveredCount} recovered on this start`;
  document.querySelector('#instance').textContent = `Server instance ${status.instanceId.slice(0, 8)}`;
  if (!history.runs.length) runs.append(node('p', 'No saved records yet.', 'empty'));
  for (const run of history.runs) {
    const card = node('article', '', 'run');
    card.dataset.runId = run.runId;
    const top = node('div', '', 'run-top');
    top.append(node('span', `${run.targetMl} mL target`, 'volume'), node('span', run.status, `badge ${run.status}`));
    card.append(top, node('p', `Run ID ${run.runId}`, 'run-id'));
    const details = node('dl', '');
    for (const [label, value] of [['Capacity', `${run.usableCapacityMl} mL`], ['Reason', run.reason || 'Awaiting a terminal outcome'], ['Measurement', 'Unavailable — no dispensing performed'], ['Sequence', run.recordSequence], ['Saved at', run.updatedAt]]) {
      details.append(node('dt', label), node('dd', String(value)));
    }
    card.append(details);
    if (run.status === 'Pending') {
      const cancel = node('button', 'Cancel record', 'secondary');
      cancel.addEventListener('click', () => act(async () => {
        await request(`/api/runs/${run.runId}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        await reload();
        showMessage('Cancellation committed to SQLite and read back.');
      }));
      card.append(cancel);
    }
    runs.append(card);
  }
}

async function act(action) {
  if (busy) return;
  busy = true;
  document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  try { await action(); } catch (error) { showMessage(error.message, true); }
  finally {
    busy = false;
    document.querySelectorAll('button').forEach(button => { button.disabled = false; });
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  act(async () => {
    await request('/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMl: Number(document.querySelector('#target').value), usableCapacityMl: Number(document.querySelector('#capacity').value) }) });
    await reload();
    showMessage('Pending record committed to SQLite and read back.');
  });
});
document.querySelector('#refresh').addEventListener('click', () => act(async () => { await reload(); showMessage('History read from SQLite.'); }));
act(async () => { await reload(); showMessage('Ready. Enter a target and usable capacity.'); });
