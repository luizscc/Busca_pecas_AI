import { orchestrator } from "./agents/orchestrator";
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
    button {
      margin-top: 12px;
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
  </style>
</head>
<body>
  <div class="container">
    <h1>Buscador de Peças IA</h1>
    <p>Teste rápido do orquestrador: digite a descrição da peça e clique em <strong>Buscar</strong>.</p>

    <form id="form-busca">
      <label for="descricao">Descrição da peça</label>
      <input
        id="descricao"
        type="text"
        value="bomba hidráulica PC200-8 OEM 708-2L-00300"
        autocomplete="off"
      />
      <button type="submit">Buscar</button>
      <div class="status" id="status"></div>
    </form>

    <div class="output" id="output">{ resultado aparecerá aqui }</div>
  </div>

  <script>
    const form = document.getElementById('form-busca');
    const input = document.getElementById('descricao');
    const output = document.getElementById('output');
    const statusEl = document.getElementById('status');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const descricao = input.value.trim();
      if (!descricao) return;

      statusEl.textContent = 'Buscando...';
      output.textContent = '';

      try {
        const resp = await fetch('/buscar-componente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descricao })
        });

        const data = await resp.json();
        statusEl.textContent = 'OK (' + resp.status + ')';
        output.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        statusEl.textContent = 'Erro na requisição';
        output.textContent = String(err);
      }
    });
  </script>
</body>
</html>`;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // Front-end simples em GET /
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(HTML_PAGE, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // API principal
    if (url.pathname === "/buscar-componente" && req.method === "POST") {
      try {
        const body = await req.json();
        const out = await orchestrator(env, body);
        return new Response(JSON.stringify(out, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            erro: "Falha ao processar requisição",
            detalhe: String(err)
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    return new Response("Rota não encontrada", { status: 404 });
  }
};
