// Sequential documentary model only. No robot or safety controller.
class Model {
 constructor(){this.state='MOUVEMENT';this.id=0;this.revision=0;}
 obstruct(now){if(this.state!=='MOUVEMENT')throw Error('state');this.id++;this.state='ARRET_DEMANDE';this.deadline=now+1;this.permit=null;return this.id;}
 ack(id){return this.state==='ARRET_DEMANDE'&&id===this.id;}
 confirm(id,now){if(this.state!=='ARRET_DEMANDE'||id!==this.id)return false;if(now>this.deadline){this.state='DEFAUT';return false;}this.state='ARRET_CONFIRME';return true;}
 tick(now){if(this.state==='ARRET_DEMANDE'&&now>this.deadline)this.state='DEFAUT';}
 prepare(id,c){if(this.state!=='ARRET_CONFIRME'||id!==this.id||!c.clear||!c.localized||!c.mapMatches)return false;this.permit={id,revision:this.revision};return true;}
 change(){this.revision++;}
 engage(){if(this.state!=='ARRET_CONFIRME'||!this.permit||this.permit.id!==this.id||this.permit.revision!==this.revision)return false;this.state='MOUVEMENT';this.permit=null;return true;}
}
function assert(x){if(!x)throw Error('assertion');}
let passed=0;function test(f){f();passed++;}
const conditions={clear:true,localized:true,mapMatches:true};
test(()=>{const m=new Model(),id=m.obstruct(0);assert(m.ack(id));assert(m.state==='ARRET_DEMANDE');m.tick(2);assert(m.state==='DEFAUT');});
test(()=>{const m=new Model(),id=m.obstruct(0);assert(!m.confirm(id-1,.2));assert(m.state==='ARRET_DEMANDE');});
test(()=>{const m=new Model(),id=m.obstruct(0);assert(m.confirm(id,.2));assert(m.state==='ARRET_CONFIRME');assert(!m.engage());});
test(()=>{const m=new Model(),id=m.obstruct(0);m.confirm(id,.2);assert(!m.prepare(id,{...conditions,clear:false}));assert(!m.engage());assert(m.state==='ARRET_CONFIRME');});
test(()=>{const m=new Model(),id=m.obstruct(0);m.confirm(id,.2);m.prepare(id,conditions);m.change();assert(!m.engage());assert(m.state==='ARRET_CONFIRME');});
test(()=>{const m=new Model(),id=m.obstruct(0);m.confirm(id,.2);assert(m.prepare(id,conditions));assert(m.engage());assert(m.permit===null);const next=m.obstruct(3);assert(next!==id);assert(!m.confirm(id,3.1));});
test(()=>{const m=new Model(),id=m.obstruct(0);assert(!m.confirm(id,2));assert(m.state==='DEFAUT');});
test(()=>{for(const key of ['localized','mapMatches']){const m=new Model(),id=m.obstruct(0);m.confirm(id,.2);assert(!m.prepare(id,{...conditions,[key]:false}));assert(!m.engage());}});
console.log(passed+' tests passed');
