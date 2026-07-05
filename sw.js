/* Service worker — Somar Notas
   Estratégia: REDE PRIMEIRO.
   - Com internet: sempre pega a versão mais nova do GitHub (atualiza sozinho).
   - Sem internet: usa a última versão guardada (funciona offline).
   Você NÃO precisa mexer neste arquivo pra atualizar o app —
   basta editar o index.html no GitHub. */

const CACHE = 'somar-notas';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        // guarda uma cópia atualizada pra usar offline depois
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req)) // sem internet -> versão guardada
  );
});
