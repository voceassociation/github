const test=require('node:test'),a=require('node:assert/strict');
function parse(o){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join(',')!=='unit,value'||!Number.isFinite(o.value)||!['m','km'].includes(o.unit))throw Error('format invalid');return o.value*(o.unit==='km'?1000:1)}
function verify(o,ref,abs=.01,rel=0){a.ok([ref,abs,rel].every(Number.isFinite)&&abs>=0&&rel>=0);try{return Math.abs(parse(o)-ref)<=abs+rel*Math.abs(ref)}catch{return false}}
function distance(kmh,duration,unit){const factor={h:3600,min:60,s:1}[unit];a.ok(factor&&Number.isFinite(kmh)&&Number.isFinite(duration)&&kmh>=0&&duration>=0);return kmh*1000/3600*duration*factor}
const near=(x,y)=>a.ok(Math.abs(x-y)<1e-9);
test('independent unit conversions',()=>{near(distance(60,30,'min'),30000);near(distance(60,.5,'h'),30000);near(distance(60,1800,'s'),30000)});
test('equivalent representations',()=>{a.ok(verify({value:30,unit:'km'},30000));a.ok(verify({value:30000,unit:'m'},30000));a.equal(verify({value:30,unit:'m'},30000),false)});
test('tolerance and inclusive boundary',()=>{a.ok(verify({value:30000.005,unit:'m'},30000));a.equal(verify({value:30000.02,unit:'m'},30000),false);a.ok(verify({value:8.5,unit:'m'},8,.5))});
test('nonfinite and unknown units rejected',()=>{for(const value of [NaN,Infinity,-Infinity])a.equal(verify({value,unit:'m'},30000),false);a.equal(verify({value:30,unit:'mile'},30000),false)});
test('substring and text shortcuts rejected',()=>{for(const o of ['1830 km','not 30 km','15, 30 or 60 km','',null])a.equal(verify(o,30000),false)});
test('expressions extra fields and absent unit rejected',()=>{for(const o of [{value:'60*0.5',unit:'km'},{value:30,unit:'km',other:60},{value:30}])a.equal(verify(o,30000),false)});
test('constant answer fails varied tasks',()=>{near(distance(80,15,'min'),20000);near(distance(36,10,'s'),100);a.equal(verify({value:30,unit:'km'},20000),false)});
test('metamorphic duration doubling',()=>near(distance(72,34,'s'),2*distance(72,17,'s')));
test('format-only reward increase',()=>{const before=.4+.2*.5,after=.4+.2;near(before,.5);near(after,.6);near((after-before)/before,.2);a.equal(0*1,0)});
