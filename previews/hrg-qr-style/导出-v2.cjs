const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('C:/Users/24175/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1800,height:2100},deviceScaleFactor:1});
 await page.goto('file:///'+path.join(__dirname,'二维码设计-v2.html').replaceAll('\\','/'));
 await page.evaluate(async({source,texture})=>{await document.fonts.ready;await window.renderCode(source,texture)}, {
  source:'data:image/jpeg;base64,'+fs.readFileSync(path.join(__dirname,'原始群二维码.jpg')).toString('base64'),
  texture:'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'二维码故障纹理-v2.png')).toString('base64')
 });
 await page.locator('#code').screenshot({path:path.join(__dirname,'风格化码点-v2.png')});
 await page.screenshot({path:path.join(__dirname,'失序重奏-风格化二维码-v2.png')});
 console.log(JSON.stringify(await page.evaluate(()=>window.codeReport)));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
