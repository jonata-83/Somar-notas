/* native-share.js — só age dentro do APK (Capacitor). No site (PWA) fica inerte. */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || typeof Cap.isNativePlatform !== 'function' || !Cap.isNativePlatform()) return;
  var P = Cap.Plugins || {};
  var Share = P.Share, Filesystem = P.Filesystem;
  if (!Share) return;

  function say(m){ try{ toast(m); }catch(e){} }
  function b64utf8(s){ return btoa(unescape(encodeURIComponent(s))); }

  async function writeCache(name, base64){
    await Filesystem.writeFile({ path: name, data: base64, directory: 'CACHE' });
    var r = await Filesystem.getUri({ path: name, directory: 'CACHE' });
    return r.uri;
  }

  // Texto -> abre a folha de compartilhamento (escolher WhatsApp)
  var bText = document.getElementById('hdrShareText');
  if (bText) bText.onclick = async function(){
    if(!noteBody.value.trim()){ say('Nota vazia'); return; }
    try{ await Share.share({ text: buildText() }); }catch(e){}
  };

  // Imagem (estilo tira PNG ou folhas JPG, conforme escolhido no menu) -> grava no cache e compartilha
  var bPng = document.getElementById('hdrSharePng');
  if (bPng) bPng.onclick = async function(){
    if(!noteBody.value.trim()){ say('Nota vazia'); return; }
    try{
      var G = (typeof gerarImagens === 'function') ? gerarImagens() : {canvases:[makePNG()], mime:'image/png', ext:'png'};
      var canvases = G.canvases;
      var uris = [];
      for (var k = 0; k < canvases.length; k++){
        var base64 = canvases[k].toDataURL(G.mime, G.q).split(',')[1];
        uris.push(await writeCache(nomeFoto(k, canvases.length, G.ext), base64));
      }
      await Share.share({ files: uris, title: noteTitle.value.trim()||'Nota' });
    }catch(e){ say('Erro ao compartilhar'); }
  };

  // Backup JSON -> WhatsApp/arquivo
  async function shareBackup(){
    var temPag = (typeof pagamentos !== 'undefined') && pagamentos.length;
    if(!notes.length && !temPag){ say('Nenhuma nota'); return; }
    try{
      var uri = await writeCache(backupFileName(), b64utf8(backupData()));
      await Share.share({ files:[uri], title:'Backup Somar Notas' });
      if (typeof marcarBackup === 'function') marcarBackup();
    }catch(e){ say('Erro ao compartilhar'); }
  }
  // Extrato da conta em imagem (JPG) -> compartilhar
  var bImg = document.getElementById('contaImg');
  if (bImg) bImg.onclick = async function(){
    try{
      var b = bandeiras.find(function(x){ return x.id === contaAberta; });
      if(!b) return;
      var cv = makeExtratoImg(b);
      var base64 = cv.toDataURL('image/jpeg', 0.9).split(',')[1];
      var nome = (semEmoji(b.nome)||'conta').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'_') + '_extrato_' + Date.now() + '.jpg';
      var uri = await writeCache(nome, base64);
      await Share.share({ files:[uri], title:'Extrato ' + b.nome });
    }catch(e){ say('Erro ao compartilhar'); }
  };

  var bWa = document.getElementById('exportWaBtn');  if (bWa) bWa.onclick = shareBackup;
  var bExp = document.getElementById('exportBtn');   if (bExp) bExp.onclick = shareBackup;
})();
