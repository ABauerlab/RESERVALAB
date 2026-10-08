export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Esta página não carregou | Teggly</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2563eb" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&display=swap" />
    <style>
      body { font: 400 16px/1.5 'Manrope', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #0f172a; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      .logo { display: block; height: 28px; width: auto; margin: 0 auto 2rem; }
      h1 { font-size: 1.5rem; line-height: 2rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
      p { color: #475569; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.625rem; justify-content: center; flex-wrap: wrap; }
      a, button { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; border-radius: 10px; font-family: inherit; font-size: 15px; font-weight: 600; line-height: 20px; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      a:focus-visible, button:focus-visible { outline: none; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.28); }
      .primary { background: #2563eb; color: #fff; box-shadow: 0 8px 20px -8px rgba(37, 99, 235, 0.55); }
      .primary:hover { background: #1d4ed8; }
      .secondary { background: #fff; color: #0f172a; border-color: #e2e8f0; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
      .secondary:hover { border-color: #cbd5e1; background: #f8fafc; }
    </style>
  </head>
  <body>
    <div class="card">
      <a href="https://teggly.com.br/" target="_blank" rel="noopener" aria-label="Teggly, abrir o site"><img class="logo" src="/brand/Teggly_Logo_Primary.svg" alt="Teggly" width="118" height="28" /></a>
      <h1>Esta página não carregou</h1>
      <p>Algo não saiu como esperado do nosso lado. Atualize a página ou volte ao início.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Tentar novamente</button>
        <a class="secondary" href="/">Ir para o início</a>
      </div>
    </div>
  </body>
</html>`;
}
