import vault, {privateAccounts} from './art-vault-accounts-entry.js';
export default {
 ...vault,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/art/vault/credentials.txt') return vault.fetch(request, env, ctx);
    if (!['GET','HEAD'].includes(request.method)) return vault.fetch(request, env, ctx);
    const checked = await vault.fetch(new Request(new URL('/art/vault?lang=fr', request.url), {
      method:'HEAD', headers:request.headers
    }), env, ctx);
    if (checked.status !== 200) return checked;
    const supplied = request.headers.get('authorization') || '';
    const username = atob(supplied.slice(6).trim()).split(':')[0];
    if (username !== 'voce-admin') return new Response(null, {status:404, headers:checked.headers});
    const users = JSON.parse(await privateAccounts(env));
    const lines = ['VOCE ARTE - IDENTIFIANTS PRIVES', '',
      'Document reserve au proprietaire. Transmettre seulement la fiche de chaque artiste.', '',
      'Le mot de passe proprietaire est conserve.', ''];
    for (const user of users) {
      const link = user.username === 'voce-admin' ? 'https://voce.life/art/vault?lang=fr' :
        'https://voce.life/art/vault/' + user.dossiers[0] + '/fr.html';
      lines.push(user.username, 'Lien : ' + link, 'Identifiant : ' + user.username,
        'Mot de passe : ' + user.password, '');
    }
    const headers = new Headers(checked.headers);
    headers.set('content-type', 'text/plain; charset=utf-8');
    headers.set('content-disposition', 'attachment; filename=VOCE_Arte_Identifiants_Prives.txt');
    headers.delete('content-length');
    return new Response(request.method === 'HEAD' ? null : lines.join(String.fromCharCode(10)),
      {status:200, headers:headers});
  }
};
