)
  ) return reject();
  if (!route[1]) return respond(request.method === 'HEAD' ? null : indexPage(user),200,{'content-type':TYPES.html});
  const dossier = route[1];
  if (!user.dossiers.includes(dossier)) return respond('Not found',404);
  let file = route[2] || 'index.html';
  if (!/^[A-Za-z0-9_./-]+$/.test(file) || file.includes('..') || file.includes('//')) return respond('Not found',404);
  const extension = file.split('.').pop().toLowerCase();
  if (!TYPES[extension]) return respond('Not found',404);
  let object;
  try { object = await env.VOCE_CORPUS.get(`art-vault/${dossier}/${file}`); }
  catch { return respond('Private access is temporarily unavailable.',503); }
  if (!object) return respond('Not found',404);
  const headers = {'content-type':TYPES[extension]};
  if (Number.isFinite(object.size)) headers['content-length'] = String(object.size);
  if (extension === 'pdf') headers['content-disposition'] = 'inline';
  return respond(request.method === 'HEAD' ? null : object.body,200,headers);
}
