import base from './worker.js';
import {isArtVaultPath, vaultLanguage} from './art-vault-worker.js';
const CONFIG_KEY = 'art-vault-control/accounts/users.enc.json';
const CONTEXT = 'VOCE/ARTE/ACCOUNTS/v1';
const encoder = new TextEncoder();
let cached = null;
function bytes(value) {
  return Uint8Array.from(atob(value), function(character) { return character.charCodeAt(0); });
}
export async function privateAccounts(env) {
  if (cached) {
    if (cached.seed === env.ART_VAULT_USERS) {
      if (Math.sign(cached.until - Date.now()) === 1) return cached.value;
    }
  }
  const original = JSON.parse(env.ART_VAULT_USERS);
  const owner = original.find(function(user) { return user.username === 'voce-admin'; });
  if (!owner) throw Error('Owner configuration unavailable');
  const object = await env.VOCE_CORPUS.get(CONFIG_KEY);
  if (!object) throw Error('Account configuration unavailable');
  const envelope = await object.json();
  if (envelope.version !== 1) throw Error('Unsupported account configuration');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(CONTEXT + ':' + owner.password));
  const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt']);
  const clear = new TextDecoder().decode(await crypto.subtle.decrypt({
    name:'AES-GCM', iv:bytes(envelope.iv), additionalData:encoder.encode(CONTEXT), tagLength:128
  }, key, bytes(envelope.ciphertext)));
  const users = JSON.parse(clear);
  if (!Array.isArray(users)) throw Error('Invalid account configuration');
  const configuredOwner = users.find(function(user) { return user.username === 'voce-admin'; });
  if (!configuredOwner) throw Error('Owner missing');
  if (configuredOwner.password !== owner.password) throw Error('Owner password mismatch');
  cached = {seed:env.ART_VAULT_USERS, until:Date.now() + 30000, value:clear};
  return clear;
}
export default {
 ...base,
  async fetch(request, env, ctx) {
    if (!isArtVaultPath(new URL(request.url).pathname)) return base.fetch(request, env, ctx);
    try {
      const configured = await privateAccounts(env);
      return await base.fetch(request, {...env, ART_VAULT_USERS:configured}, ctx);
    } catch {
      const messages = {fr:'Accès privé temporairement indisponible.',en:'Private access temporarily unavailable.',it:'Accesso riservato temporaneamente non disponibile.'};
      return new Response(messages[vaultLanguage(request)], {status:503, headers:{
        'content-type':'text/plain; charset=utf-8',
        'cache-control':'private, no-store, max-age=0, no-transform',
        'cdn-cache-control':'no-store',
        'x-robots-tag':'noindex, nofollow, noarchive, nosnipet, noimageindex',
        'referrer-policy':'no-referrer',
        'x-content-type-options':'nosniff',
        'content-security-policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        'vary':'Authorization'
      }});
    }
  }
};
