const state = {
  pipeline: null,
  selectedNodeId: null,
  positions: {},
};

const qs = (id) => document.getElementById(id);
const statusEl = qs('status');
const canvasEl = qs('canvas');
const edgesEl = qs('edges');
const logListEl = qs('logList');
const costSummaryEl = qs('costSummary');

function setStatus(text) {
  statusEl.textContent = text;
}

function ensurePositions() {
  const nodes = state.pipeline?.nodes || [];
  nodes.forEach((node, i) => {
    if (!state.positions[node.id]) {
      state.positions[node.id] = { x: 80 + (i % 4) * 250, y: 90 + Math.floor(i / 4) * 180 };
    }
  });
}

function drawCanvas() {
  canvasEl.querySelectorAll('.node').forEach((el) => el.remove());
  edgesEl.innerHTML = '';
  ensurePositions();
  if (!state.pipeline) return;

  for (const edge of state.pipeline.edges) {
    const edgeFrom = edge.from || edge.source;
    const edgeTo = edge.to || edge.target;
    const from = state.positions[edgeFrom];
    const to = state.positions[edgeTo];
    if (!from || !to) continue;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(from.x + 85));
    line.setAttribute('y1', String(from.y + 38));
    line.setAttribute('x2', String(to.x + 85));
    line.setAttribute('y2', String(to.y + 38));
    line.setAttribute('stroke', '#6f81c9');
    line.setAttribute('stroke-width', '2');
    edgesEl.appendChild(line);
  }

  for (const node of state.pipeline.nodes) {
    const pos = state.positions[node.id];
    const div = document.createElement('div');
    div.className = `pipeline-node${state.selectedNodeId === node.id ? ' active' : ''}`;
    div.style.left = `${pos.x}px`;
    div.style.top = `${pos.y}px`;
    div.innerHTML = `
      <div class="bg-primary/10 px-4 py-2 border-b border-primary/20 flex justify-between items-center">
        <span class="text-[10px] font-bold uppercase tracking-wider text-primary">노드</span>
        <span class="material-symbols-outlined text-primary text-sm">hub</span>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-base">${node.label || node.id}</h3>
        <p class="text-xs text-slate-400 mt-1">ID: ${node.id}</p>
        <div class="mt-3 flex items-center gap-2 px-2 py-1 rounded bg-slate-800/70 text-[10px] font-mono">
          <span class="text-slate-400">Agent:</span>
          <span class="text-primary">${node.agent || 'unknown'}</span>
        </div>
      </div>`;
    div.addEventListener('click', () => {
      state.selectedNodeId = node.id;
      renderPanel();
      drawCanvas();
    });
    canvasEl.appendChild(div);
  }
}

function selectedNode() {
  return state.pipeline?.nodes.find((n) => n.id === state.selectedNodeId) || null;
}

function renderPanel() {
  const node = selectedNode();
  qs('nodeId').value = node?.id || '';
  qs('label').value = node?.label || '';
  qs('agent').value = node?.agent || '';
  qs('failureRate').value = node?.config?.failureRate ?? 0;
  qs('latency').value = node?.config?.latencyMs ?? 0;
  qs('cost').value = node?.config?.cost ?? 0;
  qs('description').value = node?.description || '';
}

function updateNodeFromPanel() {
  const node = selectedNode();
  if (!node) return;
  node.label = qs('label').value;
  node.agent = qs('agent').value;
  node.description = qs('description').value;
  node.config = node.config || {};
  node.config.failureRate = Number(qs('failureRate').value || 0);
  node.config.latencyMs = Number(qs('latency').value || 0);
  node.config.cost = Number(qs('cost').value || 0);
  drawCanvas();
  updateCostPanel();
}

function updateCostPanel(summary = null) {
  if (summary) {
    costSummaryEl.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded border border-slate-700 bg-slate-900/40"><p class="text-xs text-slate-400">총 노드</p><p class="text-xl text-primary font-bold">${summary.totalNodes}</p></div>
        <div class="p-3 rounded border border-slate-700 bg-slate-900/40"><p class="text-xs text-slate-400">총 지연(ms)</p><p class="text-xl font-bold">${summary.totalLatencyMs}</p></div>
        <div class="p-3 rounded border border-slate-700 bg-slate-900/40"><p class="text-xs text-slate-400">총 비용</p><p class="text-xl text-emerald-400 font-bold">${summary.totalCost.toFixed(2)}</p></div>
        <div class="p-3 rounded border border-slate-700 bg-slate-900/40"><p class="text-xs text-slate-400">평균 실패율</p><p class="text-xl text-amber-400 font-bold">${summary.avgFailureRate.toFixed(2)}</p></div>
      </div>`;
    return;
  }
  const nodes = state.pipeline?.nodes || [];
  if (nodes.length === 0) {
    costSummaryEl.textContent = '파이프라인이 없습니다.';
    return;
  }
  const totalLatencyMs = nodes.reduce((acc, n) => acc + (n.config?.latencyMs || 0), 0);
  const totalCost = nodes.reduce((acc, n) => acc + (n.config?.cost || 0), 0);
  const avgFailureRate = nodes.reduce((acc, n) => acc + (n.config?.failureRate || 0), 0) / nodes.length;
  updateCostPanel({ totalNodes: nodes.length, totalLatencyMs, totalCost, avgFailureRate });
}

function renderLogs(logs = []) {
  if (logs.length === 0) {
    logListEl.textContent = '아직 실행 로그가 없습니다.';
    return;
  }
  logListEl.innerHTML = logs.slice(-40).map((line, idx) => `<div class="flex gap-3"><span class="text-slate-500">#${idx + 1}</span><span>${line}</span></div>`).join('');
}

async function bootstrapSample() {
  await fetch('/pipelines/bootstrap', { method: 'POST' });
  const list = await fetch('/pipelines').then((r) => r.json());
  const id = list.pipelines[0];
  const pipelineRes = await fetch(`/pipelines/${id}`).then((r) => r.json());
  state.pipeline = pipelineRes.pipeline;
  state.selectedNodeId = state.pipeline.nodes[0]?.id || null;
  renderPanel();
  drawCanvas();
  updateCostPanel();
  renderLogs();
  setStatus(`로드 완료: ${id}`);
}

async function runSimulation() {
  if (!state.pipeline) return;
  const id = state.pipeline.pipelineMeta.id;
  const response = await fetch(`/pipelines/${id}/run?profile=default`, { method: 'POST' });
  const data = await response.json();
  if (!data.ok) {
    setStatus('시뮬레이션 실패');
    renderLogs(data.errors || []);
    return;
  }
  const logs = data.summary?.nodeResults?.map((entry) => `${entry.nodeId}: ${entry.status} (${entry.durationMs}ms)`) || [];
  renderLogs(logs);
  updateCostPanel();
  setStatus(`실행 완료: ${id}`);
}

function saveLocal() {
  if (!state.pipeline) return;
  localStorage.setItem('omnipostai.pipeline', JSON.stringify(state.pipeline));
  localStorage.setItem('omnipostai.positions', JSON.stringify(state.positions));
  setStatus('localStorage 저장 완료');
}

function loadLocal() {
  const rawPipeline = localStorage.getItem('omnipostai.pipeline');
  if (!rawPipeline) {
    setStatus('저장된 파이프라인이 없습니다.');
    return;
  }
  state.pipeline = JSON.parse(rawPipeline);
  state.positions = JSON.parse(localStorage.getItem('omnipostai.positions') || '{}');
  state.selectedNodeId = state.pipeline.nodes[0]?.id || null;
  renderPanel();
  drawCanvas();
  updateCostPanel();
  renderLogs();
  setStatus('localStorage 불러오기 완료');
}

['label', 'agent', 'failureRate', 'latency', 'cost', 'description'].forEach((id) => {
  qs(id).addEventListener('input', updateNodeFromPanel);
});
qs('bootstrap').addEventListener('click', bootstrapSample);
qs('simulate').addEventListener('click', runSimulation);
qs('save').addEventListener('click', saveLocal);
qs('load').addEventListener('click', loadLocal);

setStatus('샘플 로드 버튼을 눌러 시작하세요.');
renderLogs();
updateCostPanel();
