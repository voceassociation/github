// Private artwork bytes live only in R2, never in the public source repository.
const PREFIX = '/art/vault';
const SAFE_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;
const encoder = new TextEncoder();
const POLICY = {
  'cache-control': 'private, no-store, max-age=0',
  'cdn-cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'vary': 'Authorization',
};

function respond(body, status = 200, extra = {}) {
  return new Response(body, {status, headers: {...POLICY, ...extra}});
}

export function isArtVaultPath(pathname) {
  try {
    return /^\/art\/vault(?:\.html)?(?:\/|$)/i.test(decodeURIComponent(pathname));
  } catch { return /^\/art\/vault/i.test(pathname); }
}

function credentials(header) {
  if (!header || header.length > 2048 || !/^Basic /i.test(header)) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6).trim()), ch => ch.charCodeAt(0));
    const value = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
    const index = value.indexOf(':');
    if (!(index >= 1)) return null;
    return {username:value.slice(0,index), password:value.slice(index+1)};
  } catch { return null; }
}

async function sameSecret(a, b) {
  const [left, right] = await Promise.all([a,b].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const l = new Uint8Array(left), r = new Uint8Array(right);
  let difference = 0;
  l.forEach((value, i) => { difference |= value ^ r[i]; });
  return difference === 0;
}

function accounts(secret) {
  try {
    const value = JSON.parse(secret);
    if (!Array.isArray(value) || !value.length || value.length > 100) return null;
    const seen = new Set();
    for (const user of value) {
      if (!user || !SAFE_NAME.test(user.username || '') || seen.has(user.username)
        || typeof user.password !== 'string' || 24 > user.password.length || user.password.length > 256
        || !Array.isArray(user.dossiers) || !user.dossiers.length
        || !user.dossiers.every(id => typeof id === 'string' && SAFE_NAME.test(id))
        || (user.expiresAt && !Number.isFinite(Date.parse(user.expiresAt)))) return null;
      seen.add(user.username);
    }
    return value;
  } catch { return null; }
}

function escape(value) {
  return String(value).replace(/[&\x3c>"']/g, ch => ({'&':'\x26amp;','\x3c':'\x26lt;','>':'\x26gt;','"':'\x26quot;',"'":'\x26#39;'}[ch]));
}

const COPY = {
  fr: {private:'Acc\u00e8s priv\u00e9',intro:'Dossiers ouverts \u00e0 votre consultation.',dossier:'dossier institutionnel',back:'Retour \u00e0 VOCE Art',languages:'Langue',https:'Connexion HTTPS requise.',method:'M\u00e9thode non autoris\u00e9e.',unavailable:'L\u2019acc\u00e8s priv\u00e9 n\u2019est pas encore disponible.',temporary:'L\u2019acc\u00e8s priv\u00e9 est temporairement indisponible.',denied:'Acc\u00e8s r\u00e9serv\u00e9 aux personnes autoris\u00e9es.',retry:'Veuillez r\u00e9essayer plus tard.',missing:'Document introuvable.'},
  en: {private:'Private access',intro:'Dossiers available for your review.',dossier:'institutional dossier',back:'Return to VOCE Art',languages:'Language',https:'HTTPS connection required.',method:'Method not allowed.',unavailable:'Private access is not yet available.',temporary:'Private access is temporarily unavailable.',denied:'Access is restricted to authorised users.',retry:'Please try again later.',missing:'Document not found.'},
  it: {private:'Accesso riservato',intro:'Dossier disponibili per la consultazione.',dossier:'dossier istituzionale',back:'Torna a VOCE Art',languages:'Lingua',https:'\u00c8 richiesta una connessione HTTPS.',method:'Metodo non consentito.',unavailable:'L\u2019accesso riservato non \u00e8 ancora disponibile.',temporary:'L\u2019accesso riservato \u00e8 temporaneamente non disponibile.',denied:'Accesso riservato alle persone autorizzate.',retry:'Riprovare pi\u00f9 tardi.',missing:'Documento non trovato.'},
};

export function vaultLanguage(request) {
  const url = new URL(request.url);
  const fileLanguage = url.pathname.match(/\/(fr|en|it)\.html$/)?.[1];
  if (fileLanguage) return fileLanguage;
  const selected = url.searchParams.get('lang');
  if (Object.hasOwn(COPY, selected)) return selected;
  const requested = (request.headers.get('accept-language') || '').split(',').map((part, order) => {
    const [tag,...parameters] = part.trim().split(';');
    const quality = parameters.find(p => /^q\s*=/.test(p.trim()));
    return {lang:tag.toLowerCase().split('-')[0],q:quality ? Number(quality.trim().slice(2)) : 1,order};
  }).filter(item => Object.hasOwn(COPY,item.lang) && item.q > 0 && 1 >= item.q)
    .sort((a,b) => b.q - a.q || a.order - b.order);
  return requested[0]?.lang || 'en';
}

function indexPage(user, lang) {
  const m = COPY[lang];
  const links = user.dossiers.map(id => ` x3cli> x3ca href="${PREFIX}/${id}${id === 'seguso' ? `/${lang}.html` : ''}">${id === 'seguso' ? `Livio Seguso - ${m.dossier}` : escape(id)} x3c/a> x3c/li>`).join('');
  const languages = ['fr','en','it'].map(code => ` x3ca href="${PREFIX}?lang=${code}" lang="${code}" hreflang="${code}"${lang === code ? ' aria-current="page"' : ''}>${code.toUpperCase()} x3c/a>`).join('  u00b7 ');
  return ` x3c!doctype html> x3chtml lang="${lang}"> x3chead> x3cmeta charset="utf-8"> x3cmeta name="viewport" content="width=device-width,initial-scale=1"> x3cmeta name="robots" content="noindex,nofollow"> x3ctitle>Private Art Vault | VOCE x3c/title> x3clink rel="stylesheet" href="/styles.css"> x3c/head> x3cbody> x3cheader> x3cdiv class="wrap nav"> x3ca href="/art">VOCE / ARTE x3c/a> x3cnav aria-label="${m.languages}">${languages} x3c/nav> x3c/div> x3c/header> x3cmain class="wrap longform" style="padding:80px 24px"> x3cp>VOCE Art  u00b7 ${m.private} x3c/p> x3ch1>Private Art Vault. x3c/h1> x3cp>${m.intro} x3c/p> x3cul>${links} x3c/ul> x3cp> x3ca href="/art">${m.back} x3c/a> x3c/p> x3c/main> x3c/body> x3c/html>`;
}

const TYPES = {html:'text/html; charset=utf-8',json:'application/json; charset=utf-8',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf'};

export async function handleArtVault(request, env) {
  const url = new URL(request.url);
  const lang = vaultLanguage(request), m = COPY[lang];
  const reply = (body,status=200,extra={}) => respond(body,status,{'content-language':lang,...extra});
  if (url.protocol !== 'https:') return reply(m.https, 426);
  if (!['GET','HEAD'].includes(request.method)) return reply(m.method, 405, {allow:'GET, HEAD'});
  // Fails closed before any private object or static asset can be requested.
  const users = accounts(env.ART_VAULT_USERS);
  if (!users || !env.VOCE_CORPUS?.get) return reply(m.unavailable, 503);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname).replace(/\/+$/, ''); }
  catch { return reply(m.missing,404); }
  if (/%|\\/.test(pathname) || pathname.split('/').some(part => part === '.' || part === '..')) return reply(m.missing,404);
  const route = pathname.match(/^\/art\/vault(?:\.html)?(?:\/([a-z0-9][a-z0-9-]{0,63})(?:\/(.*))?)?$/);
  if (!route) return reply(m.missing,404);
  const supplied = credentials(request.headers.get('authorization'));
  const reject = () => reply(m.denied,401, {'www-authenticate':'Basic realm="VOCE Art Vault", charset="UTF-8"'});
  if (!supplied) return reject();
  if (env.ART_VAULT_LOGIN_LIMITER) {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    try {
      const result = await env.ART_VAULT_LOGIN_LIMITER.limit({key:ip});
      if (!result.success) return reply(m.retry,429,{'retry-after':'60'});
    } catch { return reply(m.temporary,503); }
  }
  const user = users.find(entry => entry.username === supplied.username);
  const correct = await sameSecret(supplied.password, user?.password || 'invalid-account-placeholder-password');
  if (!user || !correct || (user.expiresAt && Date.now() >= Date.parse(user.expiresAt))) return reject();
  if (!route[1]) return reply(request.method === 'HEAD' ? null : indexPage(user,lang),200,{'content-type':TYPES.html});
  const dossier = route[1];
  if (!user.dossiers.includes(dossier)) return reply(m.missing,404);
  let file = route[2] || (dossier === 'seguso' ? `${lang}.html` : 'index.html');
  if (!/^[A-Za-z0-9_./-]+$/.test(file) || file.includes('..') || file.includes('//')) return reply(m.missing,404);
  const extension = file.split('.').pop().toLowerCase();
  if (!TYPES[extension]) return reply(m.missing,404);
  let object;
  try { object = await env.VOCE_CORPUS.get(`art-vault/${dossier}/${file}`); }
  catch { return reply(m.temporary,503); }
  if (!object) return reply(m.missing,404);
  const headers = {'content-type':TYPES[extension]};
  if (Number.isFinite(object.size)) headers['content-length'] = String(object.size);
  if (extension === 'pdf') headers['content-disposition'] = 'inline';
  return reply(request.method === 'HEAD' ? null : object.body,200,headers);
}
