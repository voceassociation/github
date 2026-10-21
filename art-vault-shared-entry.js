import base from './worker.js';
import {privateAccounts as originalAccounts} from './art-vault-accounts-entry.js';
import {isArtVaultPath} from './art-vault-worker.js';
async function privateAccounts(env) {
  const users = JSON.parse(await originalAccounts(env));
  const owner = users.find(function(user) { return user.username === 'voce-admin'; });
  const prepared = users.find(function(user) { return user.username === 'arte-seguso'; });
  if (!owner || !prepared || !prepared.password) throw Error('Shared access unavailable');
  const shared = {username:'voce-arte', password:prepared.password, dossiers:owner.dossiers.slice()};
  return JSON.stringify([owner, shared]);
}
const vault = {
 ...base,
 async fetch(request, env, ctx) {
   if (!isArtVaultPath(new URL(request.url).pathname)) return base.fetch(request, env, ctx);
   try {
     const accounts = await privateAccounts(env);
     return await base.fetch(request, {...env, ART_VAULT_USERS:accounts}, ctx);
   } catch {
     return new Response('Private access temporarily unavailable.', {status:503, headers:{
       'cache-control':'private, no-store', 'x-robots-tag':'noindex, nofollow, noarchive, nosnippet, noimageindex',
       'referrer-policy':'no-referrer', 'content-type':'text/plain; charset=utf-8'
     }});
   }
 }
};
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
      'Document reserve au proprietaire. Transmettre uniquement le compte partage voce-arte.', '',
      'Le mot de passe proprietaire est conserve.', ''];
    for (const user of users) {
      const link = 'https://voce.life/art/vault?lang=fr';
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
