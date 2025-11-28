import { orchestrator } from "./agents/orchestrator";
import { createSupabaseClient } from "./lib/supabase";
import { processDocument } from "./lib/document-processor";
import { createClient } from "@supabase/supabase-js";
import { runJob } from "./lib/job-runner";
import type { Env } from "./types";

const HTML_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Buscador de Peças IA</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      min-height: 100vh;
    }
    .container {
      margin-top: 40px;
      width: 100%;
      max-width: 800px;
      background: #020617;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border: 1px solid #1f2937;
    }
    h1 {
      margin-top: 0;
      font-size: 22px;
      margin-bottom: 8px;
    }
    p {
      margin-top: 0;
      margin-bottom: 16px;
      color: #9ca3af;
      font-size: 14px;
    }
    label {
      font-size: 14px;
      margin-bottom: 4px;
      display: block;
    }
    input[type="text"] {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #374151;
      background: #020617;
      color: #e5e7eb;
      font-size: 14px;
      box-sizing: border-box;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #22c55e;
      box-shadow: 0 0 0 1px #22c55e55;
    }
    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    button {
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      background: #22c55e;
      color: #022c22;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
      flex: 1;
    }
    button:hover {
      background: #16a34a;
    }
    button.btn-secondary {
      background: #374151;
      color: #e5e7eb;
      flex: 0 0 auto;
    }
    button.btn-secondary:hover {
      background: #4b5563;
    }
    .output {
      margin-top: 20px;
      font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
      background: #020617;
      border-radius: 8px;
      border: 1px solid #1f2937;
      padding: 12px;
      max-height: 380px;
      overflow: auto;
      font-size: 12px;
      white-space: pre;
    }
    .status {
      margin-top: 8px;
      font-size: 12px;
      color: #a5b4fc;
    }
    .upload-section {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #1f2937;
    }
    .upload-section h2 {
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .upload-section p {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 16px;
    }
    .category-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .category-tab {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: #020617;
      color: #9ca3af;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .category-tab:hover {
      border-color: #22c55e;
      color: #e5e7eb;
    }
    .category-tab.active {
      background: #22c55e;
      color: #022c22;
      border-color: #22c55e;
      font-weight: 600;
    }
    .dropzone {
      border: 2px dashed #374151;
      border-radius: 8px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: #0f172a;
    }
    .dropzone:hover {
      border-color: #22c55e;
      background: #1a2332;
    }
    .dropzone.dragover {
      border-color: #22c55e;
      background: #1a2332;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
    }
    .dropzone-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .dropzone-text {
      font-size: 14px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .dropzone-hint {
      font-size: 12px;
      color: #6b7280;
    }
    .file-input {
      display: none;
    }
    .upload-status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      background: #0f172a;
      border: 1px solid #374151;
      font-size: 13px;
      display: none;
    }
    .upload-status.show {
      display: block;
    }
    .upload-status.processing {
      border-color: #3b82f6;
      color: #93c5fd;
    }
    .upload-status.success {
      border-color: #22c55e;
      color: #86efac;
    }
    .upload-status.error {
      border-color: #ef4444;
      color: #fca5a5;
    }
    .file-list {
      margin-top: 12px;
      font-size: 12px;
      color: #9ca3af;
    }
    .file-item {
      padding: 8px;
      background: #020617;
      border-radius: 6px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .file-item .filename {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-item .status-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .status-badge.processing {
      background: #1e3a8a;
      color: #93c5fd;
    }
    .status-badge.success {
      background: #14532d;
      color: #86efac;
    }
    .status-badge.error {
      background: #7f1d1d;
      color: #fca5a5;
    }
    .batch-upload {
      margin-top: 16px;
      padding: 16px;
      border: 1px dashed #374151;
      border-radius: 8px;
      background: #0f172a;
    }
    .batch-upload label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .batch-upload input[type="file"] {
      display: block;
      width: 100%;
      padding: 8px;
      font-size: 13px;
      background: #020617;
      border: 1px solid #374151;
      border-radius: 6px;
      color: #e5e7eb;
      cursor: pointer;
    }
    .batch-upload input[type="file"]::file-selector-button {
      padding: 6px 12px;
      margin-right: 12px;
      background: #374151;
      border: none;
      border-radius: 4px;
      color: #e5e7eb;
      cursor: pointer;
      font-size: 12px;
    }
    .batch-upload input[type="file"]::file-selector-button:hover {
      background: #4b5563;
    }
    .batch-info {
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }
    .modal.show {
      display: flex;
    }
    .modal-content {
      background: #020617;
      border-radius: 12px;
      padding: 24px;
      max-width: 700px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid #1f2937;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }
    .modal-close {
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
    }
    .modal-close:hover {
      color: #e5e7eb;
    }
    .config-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #0f172a;
      border-radius: 8px;
      border: 1px solid #374151;
    }
    .config-section h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      color: #22c55e;
    }
    .config-row {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      align-items: center;
    }
    .config-row label {
      flex: 0 0 200px;
      font-size: 14px;
      color: #9ca3af;
    }
    .config-row input[type="number"] {
      width: 100px;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: #020617;
      color: #e5e7eb;
      font-size: 14px;
    }
    .config-row input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .config-row button {
      flex: 0 0 auto;
    }
    .job-log {
      max-height: 200px;
      overflow-y: auto;
      font-size: 12px;
      background: #020617;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #374151;
    }
    .job-log-item {
      padding: 8px;
      margin-bottom: 6px;
      background: #0f172a;
      border-radius: 4px;
      border-left: 3px solid #374151;
    }
    .job-log-item.completed {
      border-left-color: #22c55e;
    }
    .job-log-item.failed {
      border-left-color: #ef4444;
    }
    .job-log-item.running {
      border-left-color: #3b82f6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Buscador de Peças IA</h1>
    <p>Teste rápido do orquestrador: digite a descrição da peça e clique em <strong>Buscar</strong>.</p>

    <!-- Botões de navegação e configuração -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <a href="/relatorios" style="color: #22c55e; text-decoration: none; font-weight: 600; font-size: 14px;">📊 Ver Relatórios ISO 14224</a>
      <button type="button" class="btn-secondary" id="btnJobsConfig" style="display:inline-block">⚙️ Atualização Automática</button>
    </div>

    <form id="form-busca">
      <label for="descricao">Descrição da peça</label>
      <input
        id="descricao"
        type="text"
        value="bomba hidráulica PC200-8 OEM 708-2L-00300"
        autocomplete="off"
      />
      
      <!-- Upload de planilha para busca em lote -->
      <div class="batch-upload">
        <label for="batchFile">📄 Busca em Lote (Opcional)</label>
        <input type="file" id="batchFile" accept=".xlsx,.xls,.csv,.txt" />
        <div class="batch-info">
          💡 Carregue Excel, CSV ou TXT com uma descrição por linha. O sistema processará todas automaticamente.
        </div>
      </div>

      <!-- Opções -->
      <div class="batch-info" style="margin-top:8px; display:flex; gap:16px; align-items:center">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="fastToggle" />
          <span>⚡ Modo rápido (pula hunters)</span>
        </label>
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer">
          <input type="checkbox" id="autoToggle" />
          <span>🧠 Auto (aprofundar se necessário)</span>
        </label>
      </div>

      <div class="button-group">
        <button type="submit">Buscar</button>
        <button type="button" class="btn-secondary" id="btnLimpar">🗑️ Limpar</button>
        <button type="button" class="btn-secondary" id="btnAprofundar" style="display:none">🔎 Aprofundar</button>
      </div>
      <div class="status" id="status"></div>
    </form>

    <div class="output" id="output">{ resultado aparecerá aqui }</div>

    <!-- Seção de Upload -->
    <div class="upload-section">
      <h2>📚 Base de Conhecimento RAG</h2>
      <p>Adicione documentos para melhorar as respostas dos agentes. Arraste arquivos ou clique para selecionar.</p>
      
      <div class="category-tabs">
        <button class="category-tab active" data-category="ncm">📋 NCM</button>
        <button class="category-tab" data-category="equivalences">🔄 Equivalências</button>
        <button class="category-tab" data-category="technical">⚙️ Técnico</button>
        <button class="category-tab" data-category="suppliers">🏭 Fornecedores</button>
      </div>

      <div class="dropzone" id="dropzone">
        <div class="dropzone-icon">📁</div>
        <div class="dropzone-text">Arraste arquivos aqui ou clique para selecionar</div>
        <div class="dropzone-hint">Aceita: .txt, .md (máx 10MB por arquivo)</div>
      </div>
      
      <input type="file" id="fileInput" class="file-input" multiple accept=".txt,.md" />
      
      <div class="upload-status" id="uploadStatus"></div>
      
      <div class="file-list" id="fileList"></div>
    </div>

    <!-- Modal de Configuração de Jobs -->
    <div class="modal" id="jobsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>⚙️ Atualização Automática de Fornecedores</h2>
          <button class="modal-close" id="closeJobsModal">×</button>
        </div>

        <div class="config-section">
          <h3>Configuração do Job</h3>
          <div class="config-row">
            <label>✅ Ativado</label>
            <input type="checkbox" id="jobEnabled" />
          </div>
          <div class="config-row">
            <label>📅 Intervalo (dias)</label>
            <input type="number" id="jobInterval" min="1" max="365" value="7" />
          </div>
          <div class="config-row">
            <label>🎯 Melhoria Mínima Qualidade</label>
            <input type="number" id="jobMinQuality" min="0" max="1" step="0.01" value="0.1" />
            <span style="font-size: 12px; color: #6b7280">(0.1 = 10%)</span>
          </div>
          <div class="config-row">
            <label>💰 Melhoria Mínima Preço</label>
            <input type="number" id="jobMinPrice" min="0" max="1" step="0.01" value="0.05" />
            <span style="font-size: 12px; color: #6b7280">(0.05 = 5%)</span>
          </div>
          <div class="config-row">
            <label>🗑️ Inativar Automático</label>
            <input type="checkbox" id="jobAutoInactivate" checked />
          </div>
          <div class="config-row">
            <label></label>
            <button id="btnSaveJobConfig">💾 Salvar Configuração</button>
            <button class="btn-secondary" id="btnRunJobNow">▶️ Executar Agora</button>
          </div>
        </div>

        <div class="config-section">
          <h3>Última Execução</h3>
          <div id="jobLastRun" style="font-size: 13px; color: #9ca3af;">Carregando...</div>
        </div>

        <div class="config-section">
          <h3>Histórico de Execuções (últimas 10)</h3>
          <div class="job-log" id="jobLogList">Carregando...</div>
        </div>

        <div id="jobModalStatus" style="margin-top: 16px; padding: 12px; border-radius: 6px; display: none;"></div>
      </div>
    </div>
  </div>

  <script>
    // === BUSCA DE COMPONENTES ===
    const form = document.getElementById('form-busca');
    const input = document.getElementById('descricao');
    const output = document.getElementById('output');
    const statusEl = document.getElementById('status');
    const batchFileInput = document.getElementById('batchFile');
    const fastToggle = document.getElementById('fastToggle');
    const autoToggle = document.getElementById('autoToggle');
    const btnAprofundar = document.getElementById('btnAprofundar');

    // Função para processar arquivo de lote
    async function processarLote(file) {
      const text = await file.text();
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
      
      statusEl.textContent = 'Processando ' + lines.length + ' itens...';
      const resultados = [];

      const isFast = fastToggle && fastToggle.checked;
      const isAuto = autoToggle && autoToggle.checked && !isFast;

      for (let i = 0; i < lines.length; i++) {
        const descricao = lines[i];
        statusEl.textContent = 'Processando ' + (i + 1) + '/' + lines.length + ': ' + descricao.substring(0, 40) + '...';
        
        try {
          const resp = await fetch('/buscar-componente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao, fast: isFast, auto: isAuto })
          });
          const data = await resp.json();
          resultados.push({ item: i + 1, descricao, resultado: data });
        } catch (err) {
          resultados.push({ item: i + 1, descricao, erro: String(err) });
        }
      }

      return resultados;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Verificar se tem arquivo de lote
      if (batchFileInput.files.length > 0) {
        const file = batchFileInput.files[0];
        statusEl.textContent = 'Processando arquivo: ' + file.name;
        output.textContent = '';

        try {
          const resultados = await processarLote(file);
          output.textContent = JSON.stringify(resultados, null, 2);
          statusEl.textContent = 'Concluído! ' + resultados.length + ' itens processados';
        } catch (err) {
          statusEl.textContent = 'Erro ao processar arquivo';
          output.textContent = String(err);
        }
        return;
      }

      // Busca individual
      const descricao = input.value.trim();
      if (!descricao) return;

      statusEl.textContent = 'Buscando...';
      output.textContent = '';

      try {
        const isFast = fastToggle && fastToggle.checked;
        const isAuto = autoToggle && autoToggle.checked && !isFast;

        const resp = await fetch('/buscar-componente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descricao, fast: isFast, auto: isAuto })
        });

        const data = await resp.json();
        statusEl.textContent = 'OK (' + resp.status + ')';
        output.textContent = JSON.stringify(data, null, 2);
        if (data && data.meta && data.meta.modeUsed === 'auto-fast') {
          btnAprofundar.style.display = 'inline-block';
        } else {
          btnAprofundar.style.display = 'none';
        }
      } catch (err) {
        statusEl.textContent = 'Erro na requisição';
        output.textContent = String(err);
      }
    });

    // === UPLOAD DE DOCUMENTOS ===
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const fileList = document.getElementById('fileList');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const btnLimpar = document.getElementById('btnLimpar');
    const batchFile = document.getElementById('batchFile');
    
    let selectedCategory = 'ncm';

    // Botão Limpar
    btnLimpar.addEventListener('click', () => {
      document.getElementById('descricao').value = '';
      document.getElementById('output').textContent = '{ resultado aparecerá aqui }';
      document.getElementById('status').textContent = '';
      batchFileInput.value = '';
      if (fastToggle) fastToggle.checked = false;
      if (autoToggle) autoToggle.checked = false;
      if (btnAprofundar) btnAprofundar.style.display = 'none';
    });
    
    // Gerenciar seleção de categoria
    categoryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedCategory = tab.dataset.category;
      });
    });

    // Botão Aprofundar (roda hunters)
    btnAprofundar.addEventListener('click', async () => {
      const descricao = input.value.trim();
      if (!descricao) return;
      statusEl.textContent = 'Aprofundando (rodando hunters)...';
      try {
        const resp = await fetch('/buscar-componente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descricao, fast: false, auto: false, noCache: true })
        });
        const data = await resp.json();
        statusEl.textContent = 'OK (' + resp.status + ')';
        output.textContent = JSON.stringify(data, null, 2);
        if (data && data.meta && data.meta.modeUsed === 'auto-fast') {
          btnAprofundar.style.display = 'inline-block';
        } else {
          btnAprofundar.style.display = 'none';
        }
      } catch (err) {
        statusEl.textContent = 'Erro ao aprofundar';
      }
    });

    // Click na dropzone abre seletor de arquivos
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    });

    // Seleção via input
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      handleFiles(files);
      fileInput.value = ''; // Reset input
    });

    // Processar arquivos
    async function handleFiles(files) {
      if (files.length === 0) return;

      // Filtrar apenas .txt e .md
      const validFiles = files.filter(f => 
        f.name.endsWith('.txt') || f.name.endsWith('.md')
      );

      if (validFiles.length === 0) {
        showStatus('error', 'Nenhum arquivo válido (.txt ou .md) foi selecionado.');
        return;
      }

      // Mostrar arquivos na lista
      fileList.innerHTML = validFiles.map((f, i) => \`
        <div class="file-item" id="file-\${i}">
          <span class="filename">\${f.name}</span>
          <span class="status-badge processing">Processando...</span>
        </div>
      \`).join('');

      showStatus('processing', \`Processando \${validFiles.length} arquivo(s)...\`);

      // Processar cada arquivo
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileEl = document.getElementById(\`file-\${i}\`);
        const badge = fileEl.querySelector('.status-badge');

        try {
          const content = await file.text();
          
          const resp = await fetch('/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              filename: file.name,
              category: selectedCategory
            })
          });

          const result = await resp.json();

          if (result.success) {
            badge.className = 'status-badge success';
            badge.textContent = \`✓ \${result.chunksCreated} chunks\`;
            successCount++;
          } else {
            badge.className = 'status-badge error';
            badge.textContent = '✗ Erro';
            errorCount++;
          }
        } catch (err) {
          badge.className = 'status-badge error';
          badge.textContent = '✗ Erro';
          errorCount++;
        }
      }

      // Status final
      if (errorCount === 0) {
        showStatus('success', 
          \`✅ \${successCount} arquivo(s) processado(s) com sucesso! Os agentes já podem usar esse conhecimento.\`
        );
      } else {
        showStatus('error', 
          \`⚠️ \${successCount} sucesso, \${errorCount} erro(s). Verifique os arquivos.\`
        );
      }
    }

    function showStatus(type, message) {
      uploadStatus.className = \`upload-status show \${type}\`;
      uploadStatus.textContent = message;
    }

    // === CONFIGURAÇÃO DE JOBS ===
    const jobsModal = document.getElementById('jobsModal');
    const btnJobsConfig = document.getElementById('btnJobsConfig');
    const closeJobsModal = document.getElementById('closeJobsModal');
    const btnSaveJobConfig = document.getElementById('btnSaveJobConfig');
    const btnRunJobNow = document.getElementById('btnRunJobNow');
    const jobModalStatus = document.getElementById('jobModalStatus');

    // Abrir modal
    btnJobsConfig.addEventListener('click', async () => {
      jobsModal.classList.add('show');
      await loadJobConfig();
      await loadJobLog();
    });

    // Fechar modal
    closeJobsModal.addEventListener('click', () => {
      jobsModal.classList.remove('show');
    });

    // Fechar modal ao clicar fora
    jobsModal.addEventListener('click', (e) => {
      if (e.target === jobsModal) {
        jobsModal.classList.remove('show');
      }
    });

    // Carregar configuração de jobs
    async function loadJobConfig() {
      try {
        const resp = await fetch('/jobs-config');
        const jobs = await resp.json();
        
        if (jobs.length > 0) {
          const job = jobs[0];
          document.getElementById('jobEnabled').checked = job.enabled === 1;
          document.getElementById('jobInterval').value = job.interval_days || 7;

          if (job.config_json) {
            const config = JSON.parse(job.config_json);
            document.getElementById('jobMinQuality').value = config.minQualityImprovement || 0.1;
            document.getElementById('jobMinPrice').value = config.minPriceImprovement || 0.05;
            document.getElementById('jobAutoInactivate').checked = config.autoInactivate !== false;
          }

          // Exibir última execução
          const lastRun = job.last_run ? new Date(job.last_run).toLocaleString('pt-BR') : 'Nunca';
          const nextRun = job.next_run ? new Date(job.next_run).toLocaleString('pt-BR') : 'N/A';
          document.getElementById('jobLastRun').innerHTML = \`
            <strong>Última execução:</strong> \${lastRun}<br>
            <strong>Próxima execução:</strong> \${nextRun}
          \`;
        }
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      }
    }

    // Carregar log de jobs
    async function loadJobLog() {
      try {
        const resp = await fetch('/jobs-log?limit=10');
        const logs = await resp.json();
        
        const logList = document.getElementById('jobLogList');
        if (logs.length === 0) {
          logList.innerHTML = '<div style="color:#6b7280">Nenhuma execução registrada</div>';
          return;
        }

        logList.innerHTML = logs.map(log => {
          const started = new Date(log.started_at).toLocaleString('pt-BR');
          const status = log.status;
          const statusClass = status === 'completed' || status === 'completed_with_errors' ? 'completed' : 
                             status === 'failed' ? 'failed' : 'running';
          
          return \`
            <div class="job-log-item \${statusClass}">
              <div><strong>\${log.job_name}</strong> - \${started}</div>
              <div style="margin-top:4px;font-size:11px;color:#9ca3af">
                Status: \${status} | 
                Componentes: \${log.componentes_processados || 0} | 
                Novos: \${log.fornecedores_adicionados || 0} | 
                Inativados: \${log.fornecedores_inativados || 0} | 
                Atualizações: \${log.ofertas_atualizadas || 0}
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        console.error('Erro ao carregar log:', err);
      }
    }

    // Salvar configuração
    btnSaveJobConfig.addEventListener('click', async () => {
      try {
        const config = {
          minQualityImprovement: parseFloat(document.getElementById('jobMinQuality').value),
          minPriceImprovement: parseFloat(document.getElementById('jobMinPrice').value),
          autoInactivate: document.getElementById('jobAutoInactivate').checked
        };

        const body = {
          job_name: 'update_suppliers',
          enabled: document.getElementById('jobEnabled').checked ? 1 : 0,
          interval_days: parseInt(document.getElementById('jobInterval').value),
          config_json: JSON.stringify(config)
        };

        const resp = await fetch('/jobs-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const result = await resp.json();
        
        jobModalStatus.style.display = 'block';
        if (result.success) {
          jobModalStatus.style.background = '#14532d';
          jobModalStatus.style.color = '#86efac';
          jobModalStatus.textContent = '✅ Configuração salva com sucesso!';
          await loadJobConfig();
        } else {
          jobModalStatus.style.background = '#7f1d1d';
          jobModalStatus.style.color = '#fca5a5';
          jobModalStatus.textContent = '❌ Erro ao salvar configuração';
        }

        setTimeout(() => {
          jobModalStatus.style.display = 'none';
        }, 3000);
      } catch (err) {
        jobModalStatus.style.display = 'block';
        jobModalStatus.style.background = '#7f1d1d';
        jobModalStatus.style.color = '#fca5a5';
        jobModalStatus.textContent = '❌ Erro: ' + String(err);
      }
    });

    // Executar job manualmente
    btnRunJobNow.addEventListener('click', async () => {
      try {
        jobModalStatus.style.display = 'block';
        jobModalStatus.style.background = '#1e3a8a';
        jobModalStatus.style.color = '#93c5fd';
        jobModalStatus.textContent = '⏳ Executando job... Isso pode levar alguns minutos.';

        const resp = await fetch('/run-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_name: 'update_suppliers' })
        });

        const result = await resp.json();
        
        if (result.success) {
          jobModalStatus.style.background = '#14532d';
          jobModalStatus.style.color = '#86efac';
          jobModalStatus.textContent = \`✅ Job concluído! Processados: \${result.result.componentesProcessados}, Novos: \${result.result.fornecedoresAdicionados}, Inativados: \${result.result.fornecedoresInativados}\`;
          await loadJobConfig();
          await loadJobLog();
        } else {
          jobModalStatus.style.background = '#7f1d1d';
          jobModalStatus.style.color = '#fca5a5';
          jobModalStatus.textContent = '❌ Erro ao executar job: ' + (result.error || 'Desconhecido');
        }

        setTimeout(() => {
          jobModalStatus.style.display = 'none';
        }, 5000);
      } catch (err) {
        jobModalStatus.style.display = 'block';
        jobModalStatus.style.background = '#7f1d1d';
        jobModalStatus.style.color = '#fca5a5';
        jobModalStatus.textContent = '❌ Erro: ' + String(err);
      }
    });


  </script>
</body>
</html>`;

const RELATORIOS_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Relatórios - Taxonomia ISO 14224</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: #020617;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border: 1px solid #1f2937;
    }
    .nav {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #1f2937;
    }
    .nav a {
      color: #22c55e;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }
    .nav a:hover {
      color: #16a34a;
    }
    h1 {
      margin-top: 0;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #9ca3af;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: #0f172a;
      border-radius: 8px;
      border: 1px solid #1f2937;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    label {
      font-size: 12px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    select {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: #020617;
      color: #e5e7eb;
      font-size: 14px;
    }
    select:focus {
      outline: none;
      border-color: #22c55e;
    }
    .actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    button {
      padding: 10px 16px;
      border-radius: 8px;
      border: none;
      background: #22c55e;
      color: #022c22;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background: #16a34a;
    }
    button.btn-secondary {
      background: #374151;
      color: #e5e7eb;
    }
    button.btn-secondary:hover {
      background: #4b5563;
    }
    .column-selector {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px;
      background: #0f172a;
      border-radius: 8px;
      border: 1px solid #1f2937;
      margin-bottom: 24px;
    }
    .column-selector label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #e5e7eb;
      text-transform: none;
      letter-spacing: normal;
      cursor: pointer;
    }
    .column-selector input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 16px;
      background: #0f172a;
      border-radius: 8px;
      border: 1px solid #1f2937;
    }
    .stat-label {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #22c55e;
    }
    .table-container {
      overflow-x: auto;
      border: 1px solid #1f2937;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #0f172a;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #1f2937;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #1f2937;
    }
    tr:hover {
      background: #0f172a;
    }
    .taxonomy-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #1f2937;
      border-radius: 4px;
      font-size: 11px;
      font-family: monospace;
      color: #22c55e;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #9ca3af;
    }
    .group-header {
      background: #1f2937;
      font-weight: 700;
      color: #22c55e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="nav">
      <a href="/">← Voltar para Busca</a>
      <span style="color: #374151;">|</span>
      <a href="/relatorios">Relatórios</a>
    </div>

    <h1>📊 Relatórios - Taxonomia ISO 14224</h1>
    <p class="subtitle">Consulte componentes organizados por equipamento, sistema e subsistema</p>

    <div class="filters">
      <div class="filter-group">
        <label>Equipamento</label>
        <select id="filterEquipamento">
          <option value="">Todos</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Sistema</label>
        <select id="filterSistema">
          <option value="">Todos</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Subsistema</label>
        <select id="filterSubsistema">
          <option value="">Todos</option>
        </select>
      </div>
    </div>

    <div class="actions">
      <button id="btnFiltrar">🔍 Filtrar</button>
      <button id="btnLimparFiltros" class="btn-secondary">✕ Limpar Filtros</button>
      <button id="btnExportar" class="btn-secondary">📥 Exportar CSV</button>
    </div>

    <details open>
      <summary style="cursor: pointer; margin-bottom: 12px; font-weight: 600;">Selecionar Colunas</summary>
      <div class="column-selector" id="columnSelector">
        <label><input type="checkbox" value="equipamento" checked> Equipamento</label>
        <label><input type="checkbox" value="sistema" checked> Sistema</label>
        <label><input type="checkbox" value="subsistema" checked> Subsistema</label>
        <label><input type="checkbox" value="taxonomia_iso14224" checked> Código ISO 14224</label>
        <label><input type="checkbox" value="categoria" checked> Categoria</label>
        <label><input type="checkbox" value="nome_comercial"> Nome Comercial</label>
        <label><input type="checkbox" value="fabricante_maquina"> Fabricante</label>
        <label><input type="checkbox" value="modelo_maquina"> Modelo</label>
        <label><input type="checkbox" value="oem_code" checked> Código OEM</label>
        <label><input type="checkbox" value="descricao_tecnica"> Descrição Técnica</label>
        <label><input type="checkbox" value="total_fornecedores" checked> Total Fornecedores</label>
        <label><input type="checkbox" value="melhor_preco_brl" checked> Melhor Preço (BRL)</label>
        <label><input type="checkbox" value="media_reputacao"> Média Reputação</label>
      </div>
    </details>

    <div class="stats" id="stats"></div>

    <div class="table-container">
      <table id="dataTable">
        <thead id="tableHead"></thead>
        <tbody id="tableBody">
          <tr><td colspan="20" class="loading">Carregando dados...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const filterEquipamento = document.getElementById('filterEquipamento');
    const filterSistema = document.getElementById('filterSistema');
    const filterSubsistema = document.getElementById('filterSubsistema');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const btnExportar = document.getElementById('btnExportar');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const statsDiv = document.getElementById('stats');

    let currentData = [];
    let filtrosDisponiveis = { equipamentos: [], sistemas: [], subsistemas: [] };

    const columnLabels = {
      equipamento: 'Equipamento',
      sistema: 'Sistema',
      subsistema: 'Subsistema',
      taxonomia_iso14224: 'Código ISO 14224',
      categoria: 'Categoria',
      nome_comercial: 'Nome Comercial',
      fabricante_maquina: 'Fabricante',
      modelo_maquina: 'Modelo',
      oem_code: 'Código OEM',
      descricao_tecnica: 'Descrição Técnica',
      total_fornecedores: 'Fornecedores',
      melhor_preco_brl: 'Preço (BRL)',
      media_reputacao: 'Reputação'
    };

    function getSelectedColumns() {
      const checkboxes = document.querySelectorAll('#columnSelector input[type="checkbox"]:checked');
      return Array.from(checkboxes).map(cb => cb.value);
    }

    function formatValue(value, column) {
      if (value === null || value === undefined) return '-';
      if (column === 'taxonomia_iso14224' && value) {
        return \`<span class="taxonomy-badge">\${value}</span>\`;
      }
      if (column === 'melhor_preco_brl' && typeof value === 'number') {
        return 'R$ ' + value.toFixed(2);
      }
      if (column === 'media_reputacao' && typeof value === 'number') {
        return value.toFixed(1) + '/5';
      }
      return value;
    }

    function renderTable(data) {
      const selectedColumns = getSelectedColumns();
      
      // Build header
      let headerHTML = '<tr>';
      selectedColumns.forEach(col => {
        headerHTML += \`<th>\${columnLabels[col] || col}</th>\`;
      });
      headerHTML += '</tr>';
      tableHead.innerHTML = headerHTML;
      
      // Build body with grouping
      let bodyHTML = '';
      let lastEquipamento = null;
      let lastSistema = null;
      
      data.forEach(row => {
        // Group headers
        if (row.equipamento && row.equipamento !== lastEquipamento) {
          bodyHTML += \`<tr class="group-header"><td colspan="\${selectedColumns.length}">\${row.equipamento || 'Sem Equipamento'}</td></tr>\`;
          lastEquipamento = row.equipamento;
          lastSistema = null;
        }
        if (row.sistema && row.sistema !== lastSistema) {
          bodyHTML += \`<tr class="group-header" style="background: #1a1f2e;"><td colspan="\${selectedColumns.length}">  └ \${row.sistema || 'Sem Sistema'}</td></tr>\`;
          lastSistema = row.sistema;
        }
        
        // Data row
        bodyHTML += '<tr>';
        selectedColumns.forEach(col => {
          bodyHTML += \`<td>\${formatValue(row[col], col)}</td>\`;
        });
        bodyHTML += '</tr>';
      });
      
      tableBody.innerHTML = bodyHTML || '<tr><td colspan="20" class="loading">Nenhum resultado encontrado</td></tr>';
      
      // Update stats
      const totalComponentes = data.length;
      const equipamentosUnicos = new Set(data.map(d => d.equipamento).filter(Boolean)).size;
      const sistemasUnicos = new Set(data.map(d => d.sistema).filter(Boolean)).size;
      const totalFornecedores = data.reduce((sum, d) => sum + (d.total_fornecedores || 0), 0);
      
      statsDiv.innerHTML = \`
        <div class="stat-card">
          <div class="stat-label">Total de Componentes</div>
          <div class="stat-value">\${totalComponentes}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Equipamentos Únicos</div>
          <div class="stat-value">\${equipamentosUnicos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Sistemas Únicos</div>
          <div class="stat-value">\${sistemasUnicos}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total de Fornecedores</div>
          <div class="stat-value">\${totalFornecedores}</div>
        </div>
      \`;
    }

    async function loadData() {
      try {
        const params = new URLSearchParams();
        if (filterEquipamento.value) params.append('equipamento', filterEquipamento.value);
        if (filterSistema.value) params.append('sistema', filterSistema.value);
        if (filterSubsistema.value) params.append('subsistema', filterSubsistema.value);
        const qs = params.toString();
        const url = '/relatorios' + (qs ? ('?' + qs) : '');
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await response.json();
        
        currentData = data.componentes;
        filtrosDisponiveis = data.filtros;
        
        // Populate filter dropdowns
        filterEquipamento.innerHTML = '<option value="">Todos</option>' +
          filtrosDisponiveis.equipamentos.map(e => \`<option value="\${e.equipamento}">\${e.equipamento}</option>\`).join('');
        
        filterSistema.innerHTML = '<option value="">Todos</option>' +
          filtrosDisponiveis.sistemas.map(s => \`<option value="\${s.sistema}">\${s.sistema}</option>\`).join('');
        
        filterSubsistema.innerHTML = '<option value="">Todos</option>' +
          filtrosDisponiveis.subsistemas.map(s => \`<option value="\${s.subsistema}">\${s.subsistema}</option>\`).join('');
        
        renderTable(currentData);
      } catch (err) {
        tableBody.innerHTML = \`<tr><td colspan="20" class="loading">Erro ao carregar dados: \${err.message}</td></tr>\`;
      }
    }

    btnFiltrar.addEventListener('click', loadData);
    
    btnLimparFiltros.addEventListener('click', () => {
      filterEquipamento.value = '';
      filterSistema.value = '';
      filterSubsistema.value = '';
      loadData();
    });

    btnExportar.addEventListener('click', () => {
      const params = new URLSearchParams();
      if (filterEquipamento.value) params.append('equipamento', filterEquipamento.value);
      if (filterSistema.value) params.append('sistema', filterSistema.value);
      if (filterSubsistema.value) params.append('subsistema', filterSubsistema.value);
      const qs = params.toString();
      const url = '/relatorios/export' + (qs ? ('?' + qs) : '');
      window.location.href = url;
    });

    // Re-render on column selection change
    document.getElementById('columnSelector').addEventListener('change', () => {
      renderTable(currentData);
    });

    // Initial load
    loadData();
  </script>
</body>
</html>`;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Inicializar Supabase client se necessário
    if (!env.SUPABASE && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      // @ts-ignore - Env is mutable at runtime
      env.SUPABASE = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    }

    // Favicon (silent 204 to avoid 404 logs)
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    // Healthcheck simples
    if (url.pathname === "/healthz" && req.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          time: new Date().toISOString(),
          supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Front-end simples em GET /
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(HTML_PAGE, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // API principal - Busca de componentes
    if (url.pathname === "/buscar-componente" && req.method === "POST") {
      try {
        const body = await req.json();
        const out = await orchestrator(env, body);
        return new Response(JSON.stringify(out, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        console.error("❌ Erro no orchestrator:", err?.message || String(err));
        return new Response(
          JSON.stringify({
            erro: "Falha ao processar requisição",
            detalhe: err?.message || String(err)
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // API de upload de documentos para RAG
    if (url.pathname === "/upload-document" && req.method === "POST") {
      try {
        const body = await req.json() as {
          content: string;
          filename: string;
          category: string;
        };

        // Validações básicas
        if (!body.content || !body.filename || !body.category) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Campos obrigatórios: content, filename, category"
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Validar categoria
        const validCategories = ['ncm', 'equivalences', 'technical', 'suppliers'];
        if (!validCategories.includes(body.category)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Categoria inválida. Use: " + validCategories.join(', ')
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Processar documento
        const result = await processDocument(
          env,
          body.content,
          body.filename,
          body.category
        );

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });

      } catch (err) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Falha ao processar documento",
            details: String(err)
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // API de jobs - Listar configuração
    if (url.pathname === "/jobs-config" && req.method === "GET") {
      try {
        const jobs = await env.DB.prepare(`SELECT * FROM jobs_config`).all();
        return new Response(JSON.stringify(jobs.results || []), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao buscar configurações de jobs", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API de jobs - Atualizar configuração
    if (url.pathname === "/jobs-config" && req.method === "POST") {
      try {
        const body = await req.json() as {
          job_name: string;
          enabled?: number;
          interval_days?: number;
          config_json?: string;
        };

        if (!body.job_name) {
          return new Response(
            JSON.stringify({ error: "job_name é obrigatório" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Atualizar job
        await env.DB.prepare(
          `UPDATE jobs_config
           SET enabled = COALESCE(?, enabled),
               interval_days = COALESCE(?, interval_days),
               config_json = COALESCE(?, config_json),
               atualizado_em = datetime('now')
           WHERE job_name = ?`
        )
          .bind(
            body.enabled !== undefined ? body.enabled : null,
            body.interval_days !== undefined ? body.interval_days : null,
            body.config_json || null,
            body.job_name
          )
          .run();

        return new Response(
          JSON.stringify({ success: true, message: "Configuração atualizada" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar configuração", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API de jobs - Histórico de execuções
    if (url.pathname === "/jobs-log" && req.method === "GET") {
      try {
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const logs = await env.DB.prepare(
          `SELECT * FROM jobs_log ORDER BY id DESC LIMIT ?`
        )
          .bind(limit)
          .all();

        return new Response(JSON.stringify(logs.results || []), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao buscar histórico de jobs", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API de jobs - Executar job manualmente
    if (url.pathname === "/run-job" && req.method === "POST") {
      try {
        const body = await req.json() as { job_name: string };

        if (!body.job_name) {
          return new Response(
            JSON.stringify({ error: "job_name é obrigatório" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const result = await runJob(env, body.job_name);

        return new Response(
          JSON.stringify({ success: true, result }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao executar job", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Página de relatórios (HTML) - apenas se não tiver indicador de API
    if (url.pathname === "/relatorios" && req.method === "GET") {
      const acceptHeader = req.headers.get("Accept") || "";
      const isApiRequest = acceptHeader.includes("application/json") || url.searchParams.toString().length > 0;
      
      // Se for requisição de página (navegação direta), retorna HTML
      if (!isApiRequest) {
        return new Response(RELATORIOS_PAGE, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }
      
      // Caso contrário, é requisição da API (fetch do JavaScript)
      try {
        const equipamento = url.searchParams.get("equipamento");
        const sistema = url.searchParams.get("sistema");
        const subsistema = url.searchParams.get("subsistema");
        const categoria = url.searchParams.get("categoria");

        // Try Supabase first (where data is actually being saved)
        const supabase = createSupabaseClient(env);
        let componentes: any[] = [];
        let filtros: { equipamentos: any[]; sistemas: any[]; subsistemas: any[] } = { equipamentos: [], sistemas: [], subsistemas: [] };

        if (supabase) {
          console.log('📊 [RELATORIOS] Buscando dados do Supabase...');
          
          // Build query
          let query = supabase
            .from('componentes')
            .select('id, categoria, nome_comercial, fabricante_maquina, modelo_maquina, oem_code, descricao_tecnica, equipamento, sistema, subsistema, taxonomia_iso14224');
          
          if (equipamento) query = query.eq('equipamento', equipamento);
          if (sistema) query = query.eq('sistema', sistema);
          if (subsistema) query = query.eq('subsistema', subsistema);
          if (categoria) query = query.eq('categoria', categoria);
          
          query = query.order('equipamento').order('sistema').order('subsistema');
          
          const { data, error } = await query;
          
          if (error) {
            console.error('❌ [RELATORIOS] Erro ao buscar do Supabase:', error);
          } else {
            componentes = data || [];
            console.log(`✅ [RELATORIOS] ${componentes.length} componentes retornados do Supabase`);
          }
          
          // Get filter options
          const { data: eqs } = await supabase
            .from('componentes')
            .select('equipamento')
            .not('equipamento', 'is', null)
            .order('equipamento');
          
          const { data: sists } = await supabase
            .from('componentes')
            .select('sistema')
            .not('sistema', 'is', null)
            .order('sistema');
          
          const { data: subs } = await supabase
            .from('componentes')
            .select('subsistema')
            .not('subsistema', 'is', null)
            .order('subsistema');
          
          filtros = {
            equipamentos: [...new Set((eqs || []).map((r: any) => r.equipamento))].map((e: any) => ({ equipamento: e })),
            sistemas: [...new Set((sists || []).map((r: any) => r.sistema))].map((s: any) => ({ sistema: s })),
            subsistemas: [...new Set((subs || []).map((r: any) => r.subsistema))].map((s: any) => ({ subsistema: s }))
          };
        } else {
          // Fallback to D1
          console.log('📊 [RELATORIOS] Buscando dados do D1 local...');
          
          let query = `
            SELECT 
              c.id,
              c.categoria,
              c.nome_comercial,
              c.fabricante_maquina,
              c.modelo_maquina,
              c.oem_code,
              c.descricao_tecnica,
              c.equipamento,
              c.sistema,
              c.subsistema,
              c.taxonomia_iso14224
            FROM componentes c
            WHERE 1=1
          `;
          
          const params: any[] = [];
          
          if (equipamento) {
            query += ` AND c.equipamento = ?`;
            params.push(equipamento);
          }
          if (sistema) {
            query += ` AND c.sistema = ?`;
            params.push(sistema);
          }
          if (subsistema) {
            query += ` AND c.subsistema = ?`;
            params.push(subsistema);
          }
          if (categoria) {
            query += ` AND c.categoria = ?`;
            params.push(categoria);
          }
          
          query += `
            ORDER BY c.equipamento, c.sistema, c.subsistema, c.categoria
          `;
          
          const stmt = env.DB.prepare(query);
          const result = await stmt.bind(...params).all();
          componentes = result.results || [];
          
          // Get distinct values for filters
          const equipamentos = await env.DB.prepare(
            `SELECT DISTINCT equipamento FROM componentes WHERE equipamento IS NOT NULL ORDER BY equipamento`
          ).all();
          
          const sistemas = await env.DB.prepare(
            `SELECT DISTINCT sistema FROM componentes WHERE sistema IS NOT NULL ORDER BY sistema`
          ).all();
          
          const subsistemas = await env.DB.prepare(
            `SELECT DISTINCT subsistema FROM componentes WHERE subsistema IS NOT NULL ORDER BY subsistema`
          ).all();
          
          filtros = {
            equipamentos: (equipamentos.results as any[]) || [],
            sistemas: (sistemas.results as any[]) || [],
            subsistemas: (subsistemas.results as any[]) || []
          };
        }

        return new Response(
          JSON.stringify({
            componentes,
            filtros
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao buscar relatórios", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API de relatórios - Export CSV
    if (url.pathname === "/relatorios/export" && req.method === "GET") {
      try {
        const equipamento = url.searchParams.get("equipamento");
        const sistema = url.searchParams.get("sistema");
        const subsistema = url.searchParams.get("subsistema");
        
        let query = `
          SELECT 
            c.equipamento,
            c.sistema,
            c.subsistema,
            c.taxonomia_iso14224,
            c.categoria,
            c.nome_comercial,
            c.fabricante_maquina,
            c.modelo_maquina,
            c.oem_code,
            c.descricao_tecnica,
            COUNT(DISTINCT f.id) as total_fornecedores,
            MIN(o.preco_brl) as melhor_preco_brl,
            AVG(f.reputacao_score) as media_reputacao
          FROM componentes c
          LEFT JOIN ofertas o ON o.componente_id = c.id
          LEFT JOIN fornecedores f ON f.id = o.fornecedor_id
          WHERE 1=1
        `;
        
        const params: any[] = [];
        
        if (equipamento) {
          query += ` AND c.equipamento = ?`;
          params.push(equipamento);
        }
        if (sistema) {
          query += ` AND c.sistema = ?`;
          params.push(sistema);
        }
        if (subsistema) {
          query += ` AND c.subsistema = ?`;
          params.push(subsistema);
        }
        
        query += `
          GROUP BY c.id
          ORDER BY c.equipamento, c.sistema, c.subsistema, c.categoria
        `;
        
        const stmt = env.DB.prepare(query);
        const result = await stmt.bind(...params).all();
        
        // Build CSV com UTF-8 BOM e separador ponto-e-vírgula (Excel PT-BR)
        const rows = result.results as any[];
        const headers = [
          "Equipamento", "Sistema", "Subsistema", "Taxonomia ISO 14224",
          "Categoria", "Nome Comercial", "Fabricante", "Modelo",
          "Código OEM", "Descrição Técnica", "Total Fornecedores",
          "Melhor Preço (BRL)", "Média Reputação"
        ];
        
        // UTF-8 BOM para Excel reconhecer encoding correto
        let csv = "\ufeff" + headers.join(";") + "\n";
        
        for (const row of rows) {
          const values = [
            row.equipamento || "",
            row.sistema || "",
            row.subsistema || "",
            row.taxonomia_iso14224 || "",
            row.categoria || "",
            row.nome_comercial || "",
            row.fabricante_maquina || "",
            row.modelo_maquina || "",
            row.oem_code || "",
            (row.descricao_tecnica || "").replace(/"/g, '""').replace(/\n/g, " "),
            row.total_fornecedores || 0,
            row.melhor_preco_brl ? row.melhor_preco_brl.toFixed(2) : "",
            row.media_reputacao ? row.media_reputacao.toFixed(2) : ""
          ];
          
          csv += values.map(v => `"${v}"`).join(";") + "\n";
        }
        
        return new Response(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="relatorio_componentes_${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Erro ao exportar CSV", details: String(err) }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Rota não encontrada", { status: 404 });
  }
};
