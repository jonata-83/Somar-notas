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
    if(!notes.length){ say('Nenhuma nota'); return; }
    try{
      var uri = await writeCache(backupFileName(), b64utf8(backupData()));
      await Share.share({ files:[uri], title:'Backup Somar Notas' });
    }catch(e){ say('Erro ao compartilhar'); }
  }
  var bWa = document.getElementById('exportWaBtn');  if (bWa) bWa.onclick = shareBackup;
  var bExp = document.getElementById('exportBtn');   if (bExp) bExp.onclick = shareBackup;
})();
