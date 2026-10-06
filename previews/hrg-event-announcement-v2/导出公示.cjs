const path=require('node:path');
const {chromium}=require('C:/Users/24175/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1800,height:2400},deviceScaleFactor:1});
await page.goto('file:///'+path.join(__dirname,'活动整体公示.html').replaceAll('\\','/'));
await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
const report=await page.evaluate(()=>{
 const height=Math.ceil(document.querySelector('.poster').getBoundingClientRect().height);
 const overflow=[...document.querySelectorAll('.route-strip,.subline,.place,.reading p,.intro,.footer')].filter(el=>el.scrollWidth>el.clientWidth+2).map(el=>el.className||el.tagName);
 const text=document.body.innerText;
 const required=['在指定网页注册账号','5 个不同的 BINGO 棋盘','25 个分值不等的任务','19 个任务','6 个任务可以直接完成','必须前往下一个区域','AI 识别图片','西湖文化广场','武林广场','龙翔桥'];
 return{width:1800,height,fontLoaded:document.fonts.check('49px FangYuan'),overflow,unwanted:/玩家|两两|两人|2 人|安装|人数|自动审核/.test(text),missing:required.filter(t=>!text.includes(t)),ruleHeadings:document.querySelectorAll('.reading h2,.reading h3').length};
});
if(report.overflow.length||report.unwanted||report.missing.length||!report.fontLoaded||report.ruleHeadings)throw new Error(JSON.stringify(report));
await page.setViewportSize({width:1800,height:report.height});
await page.screenshot({path:path.join(__dirname,'失序重奏-活动整体公示-v2.png'),fullPage:true});
await page.screenshot({path:path.join(__dirname,'排版检查-前半.png'),clip:{x:0,y:0,width:1800,height:3350}});
await page.screenshot({path:path.join(__dirname,'排版检查-正文.png'),clip:{x:0,y:3350,width:1800,height:report.height-3350}});
console.log(JSON.stringify(report));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
