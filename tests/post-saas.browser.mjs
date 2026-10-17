// Run against the repository preview: POST_SAAS_BASE=http://localhost:8787 node tests/post-saas.browser.mjs
// Requires Playwright and an installed Chromium (or CHROMIUM_EXECUTABLE).
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{} )});
const base=process.env.POST_SAAS_BASE||'http://localhost:8787';
try{
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const prefix of ['', '/fr','/it']){
   await page.goto(base+prefix+'/applied/post-saas');await page.waitForFunction(()=>document.getElementById('ps-current').textContent.length>0);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   assert.equal(await page.evaluate(()=>[...document.querySelectorAll('header .lang a')].every(a=>{const r=a.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),true);
  }
  await page.locator('summary').first().click();await page.fill('#ps-users','123');
  for(const lang of ['FR','EN','IT']){
   await page.locator('header .lang a',{hasText:lang}).click();await page.waitForFunction(l=>document.documentElement.lang===l,lang.toLowerCase());
   assert.equal(await page.inputValue('#ps-users'),'123');
  }
  await page.locator('summary').first().click();await page.fill('#ps-hosting','');assert.equal(await page.locator('#ps-output').isVisible(),false);
  await page.fill('#ps-hosting','999999');assert.match(await page.textContent('#ps-diff-label'),/Maggior costo/);
  await page.close();
 }
}finally{await browser.close();}
