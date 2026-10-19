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
    if (index) return null;
    return {username:value.slice(0,index), password:value.slice(index+1)};
  } catch { return null; }
}

async function sameSecret(a, b) {
  const [left, right] = await Promise.all([a,b].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const l = new Uint8Array(left), r = new Uint8Array(right);
  let difference = 0;
  for (let i = 0; i 0 && item.q  1) return null;
    const seen = new Set();
    for (const user of value) {
      if (!user || !SAFE_NAME.test(user.username || '') || seen.has(user.username)
        || typeof user.password !== 'string' || user.password.length 24 || user.password.length > 256
        || !Array.isArray(user.dossiers) || !user.dossiers.length
        || !user.dossiers.every(id => typeof id === 'string' && SAFE_NAME.test(id))
        || (user.expiresAt && !Number.isFinite(Date.parse(user.expiresAt)))) return null;
      seen.add(user.username);
    }
    return value;
  } catch { return null; }
}

function escape(value) {
  return String(value).replace(/[&amp;="']/g, ch => ({'&':'&amp;','&lt;':'&lt;','&gt;':'&gt;','&quot;':'&quot;',"&apos;":'&#39;'}[ch]));
}

const COPY = {
  fr: {private:'Accès privé',intro:'Dossiers ouverts à votre consultation.',dossier:'dossier institutionnel',back:'Retour à VOCE Art',languages:'Langue',https:'Connexion HTTPS requise.',method:'Méthode non autorisée.',unavailable:'L'accès privé n'est pas encore disponible.',temporary:'L'accès privé est temporairement indisponible.',denied:'Accès réservé aux personnes autorisées.',retry:'Veuillez réessayer plus tard.',missing:'Document introuvable.'},
  en: {private:'Private access',intro:'Dossiers available for your review.',dossier:'institutional dossier',back:'Return to VOCE Art',languages:'Language',https:'HTTPS connection required.',method:'Method not allowed.',unavailable:'Private access is not yet available.',temporary:'Private access is temporarily unavailable.',denied:'Access is restricted to authorised users.',retry:'Please try again later.',missing:'Document not found.'},
  it: {private:'Accesso riservato',intro:'Dossier disponibili per la consultazione.',dossier:'dossier istituzionale',back:'Torna a VOCE Art',languages:'Lingua',https:'È richiesta una connessione HTTPS.',method:'Metodo non consentito.',unavailable:'L'accesso riservato non è ancora disponibile.',temporary:'L'accesso riservato è temporaneamente non disponibile.',denied:'Accesso riservato alle persone autorizzate.',retry:'Riprovare più tardi.',missing:'Documento non trovato.'},
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
  }).filter(item => Object.hasOwn(COPY,item.lang) && item.q  0 && item.q  = 1 = 'Basic realm="VOCE Art Vault", charset="UTF-8"'});
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
  if (!user || !correct || (user.expiresAt && Date.parse(user.expiresAt)  Date.now())) return reject();
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
