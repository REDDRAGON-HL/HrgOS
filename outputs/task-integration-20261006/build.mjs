import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const outDir = decodeURIComponent(dir);
if(process.argv.includes('--name-tasks')) {
 const file=path.join(outDir,'HRG挑战任务汇总_各组25项.xlsx');
 const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(file));
 const s=wb.worksheets.getItem('任务总表');
 const original=s.getRange('A7:F131').values;
 const names={
  'Phigros':['板子别动！','红键外包','一手包办动画','课题三连红','曲库统计员','IN级查户口','唱打','二次元扫书行动','蒙眼代打？！','人形平板支架','魔王曲速写','谷子认亲大会','全连低分王','白V断连大师','冷手热谱','credits不是片尾？','Rr精准控分','闭眼也能d0EZ','左右护法','一指宇宙','Random3开盲盒','一指全红','986000复刻现场','零零五说的道理','HD一手拿捏'],
  'Arcaea':['镜中追分','只能看不能摸','光暗双生','来自隔壁的你','困难角色带我飞','67，不能再多了','GUY，你干嘛','这歌我会唱','小p收集癖','快慢都是你','曲师连连看','拆开也要千万','迟到是不可能的','早到也不行','井水不犯河水','质数强迫症','分数复读机','天翻地覆色号','强碱体验卡','d0ez出来挨打','风暴二人转','曲绘照进现实','卸载冷静一下','猫猫喘口气','三连批发商'],
  'maimai':['？！初见！？','不许爆G','长条绝缘体','键盘大师？','每日325','福瑞？！','张雪峰','长跑冠军','单手挑战','路人夺权','高速狂飙','首字母捉迷藏','交叉手挑战','全程解说','极极？！','小拇指也要上分','深海闭嘴挑战','星星单手承包','彩虹提前报到','边打边建王国','GDP精准扶贫','致敬传奇心态王','乌冬面上分套餐','废物三项','这不是我们屁屁肉的歌吗'],
  '范式起源':['范式也能Dynamix','冬日方块少丢点','时间到了，满分！','elegante双向奔赴','inner norm侧面出击','bpm=rt达标打卡','席替（换座位）','重返新手村','ternion三道关','慢速带师','入侵二选一','曲师猜猜乐','曲绘找找茬之我爱para','纵连打信者','曲名何意味','谁笑谁重开','命运交给路人','人形街机','倒转脑回路','双小拇指冲百万','零号车单手司机','十六级全收','数据乱流','控速挑战','大麻烦！！！'],
  '通用':['空中音游','双手打结','边打边画','走着也能AP','初音巡回打卡','柠檬水补给站','慢到怀疑人生','反面教材','地板音游','音游字母表','曲师点名册','跨游爬楼梯','b键加班中','你打歌我跳一跳','旁白正在加载','板子三周转','事已至此，先吃饭吧','冰手挑战','你打歌我平板','这口水不能吐','镜像倒打二人转','音游减法','曲绘团建','325在哪里','名场面返场']
 };
 for(const [game,list]of Object.entries(names))if(list.length!==25)throw new Error('Name count '+game);
 const labels=original.map(r=>names[r[1]][r[2]-1]);
 if(labels.some(x=>!x)||new Set(labels).size!==125)throw new Error('Missing or duplicate names');
 // Move the existing notes area and descriptions one column right without changing their content or styles.
 s.getRange('K2:K19').copyFrom(s.getRange('J2:J19'),'all');
 s.getRange('J2:J19').copyFrom(s.getRange('I2:I19'),'all');
 s.getRange('I2:I19').copyFrom(s.getRange('H2:H19'),'all');
 s.getRange('H2:H19').clear({applyTo:'all'});
 s.tables.items[0].delete();
 s.getRange('G6:G131').copyFrom(s.getRange('F6:F131'),'all');
 s.getRange('F6:F131').copyFrom(s.getRange('E6:E131'),'all');
 s.getRange('F3:F4').copyFrom(s.getRange('E3:E4'),'all');
 s.getRange('E3:E4').clear({applyTo:'all'});
 s.getRange('E6').values=[['任务名称']];
 s.getRange('E7:E131').values=labels.map(x=>[x]);
 const table=s.tables.add('A6:G131',true,'ChallengeTasks');table.showFilterButton=true;
 s.getRange('A6:G6').format={fill:'#284766',font:{name:'Microsoft YaHei',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:30};
 s.getRange('E7:E131').format.font={name:'Microsoft YaHei',size:11,bold:true,color:'#284766'};
 s.getRange('E7:E131').format.verticalAlignment='center';
 s.getRange('E7:E131').format.wrapText=true;
 for(const [col,width]of [['E',230],['F',730],['G',300],['H',25],['I',120],['J',70],['K',550]])s.getRange(`${col}1:${col}131`).format.columnWidthPx=width;
 // Reapply alternating name-cell fills so the new field follows the existing row layout.
 for(let i=0;i<labels.length;i++)s.getRange(`E${i+7}`).format.fill=i%2===0?'#FFFFFF':'#F3F6FA';
 s.freezePanes.freezeRows(6);
 wb.recalculate();
 const after=s.getRange('A7:G131').values;
 for(let i=0;i<after.length;i++){
  const restored=[...after[i].slice(0,4),after[i][5],after[i][6]];
  if(JSON.stringify(restored)!==JSON.stringify(original[i]))throw new Error('Task content changed '+(i+1));
  if(after[i][4]!==labels[i])throw new Error('Name mismatch');
 }
 console.log(JSON.stringify({named:labels.length,unique:new Set(labels).size,groups:Object.keys(names).map(game=>({game,count:names[game].length})),unchanged:'task text, difficulty, numbering, notes'}));
 console.log((await wb.inspect({kind:'table',range:'任务总表!A57:G60',include:'values',tableMaxRows:4,tableMaxCols:7,maxChars:1800})).ndjson);
 const previews=[['named-opening','A1:G10'],['named-arc','B32:G38'],['named-mai','B57:G63'],['named-paradigm','B91:G96'],['named-common','B123:G131'],['named-sidebar','I2:K19']];
 for(const [name,range]of previews){
  const preview=await wb.render({sheetName:s.name,range,scale:1.1,format:'png'});
  await fs.writeFile(path.join(outDir,name+'.png'),new Uint8Array(await preview.arrayBuffer()));
 }
 const outputPath=path.join(outDir,'HRG挑战任务汇总_任务命名版.xlsx');
 const output=await SpreadsheetFile.exportXlsx(wb);await output.save(outputPath);
 const records=JSON.parse(await fs.readFile(path.join(outDir,'integrated-data.json'),'utf8'));
 records.forEach((r,i)=>r.name=labels[i]);
 await fs.writeFile(path.join(outDir,'integrated-data.json'),JSON.stringify(records,null,2));
 console.log('SAVED '+outputPath);
 process.exit(0);
}
if(process.argv.includes('--review-names')) {
 const existing=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(outDir,'HRG挑战任务汇总_各组25项.xlsx')));
 console.log(existing.help('range.insert',{include:'index,examples,notes',maxChars:5000}).ndjson);
 const preview=await existing.render({sheetName:'任务总表',range:'A1:F10',scale:1.1,format:'png'});
 await fs.writeFile(path.join(outDir,'before-names.png'),new Uint8Array(await preview.arrayBuffer()));
 console.log((await existing.inspect({kind:'table',range:'任务总表!A7:F8',include:'values',tableMaxRows:2,tableMaxCols:6,maxChars:1300})).ndjson);
 process.exit(0);
}
if(process.argv.includes('--normalize-25')) {
 const baseFile=path.join(outDir,'normalization-base.json');
 try {await fs.access(baseFile);} catch {await fs.copyFile(path.join(outDir,'integrated-data.json'),baseFile);}
 const base=JSON.parse(await fs.readFile(baseFile,'utf8'));
 const gameOrder=['Phigros','Arcaea','maimai','范式起源','通用'];
 const removals={maimai:new Map([[10,'随机游玩仅要求完成，辨识度较低。'],[16,'成绩取决于朋友水平，缺少统一门槛。'],[18,'与原第 8 项同为白南十字途中附加任务。'],[19,'依赖特定对象和双方水平，完成门槛不固定。']]),'范式起源':new Map([[18,'吃东西的任务与通用组的吃饭、饮料任务相近。'],[19,'路人划拳与游戏操作无关，优先保留本游戏挑战。']])};
 const changes={
  'Phigros:9':['极难','蒙眼、由队友引导，并要求大于 15 级谱面 AP，叠加限制最多。'],
  'Arcaea:4':['中','没有限时要求，主要考验曲目知识与随机抽取。'],
  'Arcaea:10':['难','极高、极低流速下都要维持较高成绩。'],
  'Arcaea:11':['中','主要考验 30 秒内的曲包检索与曲师熟悉度。'],
  'Arcaea:12':['极难','三次分别只接一种音符，仍要求合计达到 10000000，容错较小。'],
  'Arcaea:15':['易','可选任意曲目，只要求 track complete；补评原未标注难度。'],
  'Arcaea:16':['易','可通过调整残片数量满足末两位为质数，没有操作限制。'],
  'maimai:12':['中','10.0 流速叠加 13 级谱面和 90% 成绩门槛。'],
  'maimai:14':['中','全程交叉手限制操作范围，需保持规定评级。'],
  'maimai:20':['极难','仅使用双小拇指，13.4 及以上谱面仍要求达成率至少 100%。'],
  'maimai:26':['难','低流速、缩小谱面，并须精确限定为 AP-2 且 2 GOOD。'],
  '范式起源:22':['难','双小拇指、15 级及以上、1000000 分，操作限制较强。'],
  '范式起源:25':['极难','16 级以上谱面叠加音频 -200、画面 +100 延迟，仍要求 1000000 分。']
 };
 const additions={
  'Phigros':[
   ['难','课题模式通过随机选择到 Random3 难度并游玩（不严格要求顺序），若成绩在 2990000 以上额外 +50'],
   ['易','单指 AP 一张任意难度谱面'],
   ['中','在课题模式下，游玩 d0EZ，并完全复刻 986000 场面（分数相同，爆点相同）'],
   ['易','把自己的昵称改为零零五即可，但之后的所有任务开始前需要先溜一遍说的道理'],
   ['易','单手游玩一张 HD 谱面并 AP']
  ],
  '通用':[
   ['极难','镜像倒打双人合作一首最高难度的谱面，并拿到这个游戏倒数第二评级以上（不包含）的成绩'],
   ['难','删除游玩设备上的任意一款音游'],
   ['难','还原任意含三人及以上的曲绘姿势'],
   ['中','在任意一款音游中找到“325”字样'],
   ['易','还原任意除 Phigros 音游外的名场面']
  ]
 };
 const records=[],removed=[];
 for(const game of gameOrder) {
  const items=[];
  for(const item of base.filter(x=>x.game===game)) {
   if(removals[game]?.has(item.n)) {removed.push({...item,reason:removals[game].get(item.n)});continue;}
   const updated={...item,sourceNumber:item.n};
   const change=changes[game+':'+item.n];
   if(change) {
    updated.difficulty=change[0];
    updated.note=game==='Arcaea'&&item.n===15?change[1]:[item.note,`难度复评：${item.difficulty} → ${change[0]}。${change[1]}`].filter(Boolean).join('\n');
   }
   items.push(updated);
  }
  for(const [difficulty,text] of additions[game]||[]) items.push({game,difficulty,text,note:'新增任务。',sourceNumber:null});
  if(items.length!==25)throw new Error(`${game} count is ${items.length}`);
  if(!items.some(x=>x.difficulty==='极难'))throw new Error('Missing extreme: '+game);
  items.forEach((r,i)=>{
   r.n=i+1;
   if(r.sourceNumber!==null&&r.sourceNumber!==r.n) r.note=[`原任务序号：${r.sourceNumber}。`,r.note].filter(Boolean).join('\n');
   records.push(r);
  });
 }
 const wb=Workbook.create();
 const s=wb.worksheets.add('任务总表');
 s.showGridLines=false;s.tabColor='#284766';
 s.getRange('A1:F131').format.font={name:'Microsoft YaHei',size:11,color:'#1F2937'};
 s.getRange('A1:F131').format.verticalAlignment='center';
 s.getRange('A2').values=[['HRG 挑战任务总表']];
 s.getRange('A2:D2').merge();
 s.getRange('A2').format.font={name:'Microsoft YaHei',size:17,bold:true,color:'#284766'};
 s.getRange('A2:F2').format.rowHeight=30;
 s.getRange('A2:F2').format.borders={bottom:{style:'thin',color:'#A6B6C5'}};
 s.getRange('E3').values=[['共 125 项：Phigros、Arcaea、maimai、范式起源、通用各 25 项。']];
 s.getRange('E4').values=[['易：绿色；中：黄色；难：红色；极难：玫瑰红。各组至少 1 项极难任务。']];
 s.getRange('E3:E4').format.font={name:'Microsoft YaHei',size:10,color:'#596679'};
 s.getRange('A6:F6').values=[['总序号','游戏 / 侧别','任务序号','任务难度','任务内容与完成要求','备注']];
 const matrix=records.map((r,i)=>[i+1,r.game,r.n,r.difficulty,r.text,r.note]);
 s.getRange('A7:F131').values=matrix;
 const table=s.tables.add('A6:F131',true,'ChallengeTasks');table.showFilterButton=true;
 s.getRange('A6:F6').format={fill:'#284766',font:{name:'Microsoft YaHei',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:30};
 s.getRange('A7:A131').setNumberFormat('0');s.getRange('C7:C131').setNumberFormat('0');
 s.getRange('A7:A131').format.horizontalAlignment='right';s.getRange('C7:C131').format.horizontalAlignment='right';s.getRange('D7:D131').format.horizontalAlignment='center';
 s.getRange('E7:F131').format.wrapText=true;s.getRange('E7:F131').format.verticalAlignment='top';
 for(const [col,width] of [['A',60],['B',130],['C',75],['D',90],['E',730],['F',300],['G',25],['H',120],['I',70],['J',550]])s.getRange(`${col}1:${col}131`).format.columnWidthPx=width;
 const units=t=>[...t].reduce((n,c)=>n+(c.charCodeAt(0)>255?2:1),0);
 for(let i=0;i<records.length;i++){
  const row=i+7,r=records[i];
  const lines=(t,max)=>t.split('\n').reduce((n,p)=>n+Math.max(1,Math.ceil(units(p)/max)),0);
  s.getRange(`A${row}:F${row}`).format.rowHeight=Math.max(34,Math.max(lines(r.text,81),lines(r.note,33))*19+12);
  s.getRange(`A${row}:F${row}`).format.fill=i%2===0?'#FFFFFF':'#F3F6FA';
  if(i%25===0)s.getRange(`A${row}:F${row}`).format.borders={top:{style:'medium',color:'#A6B6C5'}};
 }
 const diff=s.getRange('D7:D131');
 for(const [label,bg,fg] of [['易','#E2F0E7','#21613D'],['中','#FFF2D8','#825900'],['难','#F9E3E3','#9B3232'],['极难','#D81B60','#FFFFFF']])diff.conditionalFormats.addCustom(`$D7="${label}"`,{fill:bg,font:{color:fg,bold:true}});
 diff.dataValidation={rule:{type:'list',values:['易','中','难','极难']}};
 s.freezePanes.freezeRows(6);
 s.getRange('H2').values=[['删减说明（不计入任务数）']];
 s.getRange('H2').format.font={name:'Microsoft YaHei',size:13,bold:true,color:'#284766'};
 s.getRange('H6:J6').values=[['游戏 / 侧别','原序号','删减任务与原因']];
 s.getRange('H6:J6').format.font={name:'Microsoft YaHei',size:10,bold:true,color:'#284766'};
 const removalTitles=['抽卡达人','你选我打','白南十字途中吃麦当劳','假装萌新后拼机胜过对方','薯条二重奏限时吃完','路人划拳连胜三次'];
 const removalReasons=['仅要求随机游玩完成，辨识度较低。','门槛依赖朋友水平。','与原第 8 项主题相近。','门槛依赖对象及双方水平。','与通用组吃饭、饮料任务相近。','优先保留本游戏操作挑战。'];
 s.getRange('H7:J12').values=removed.map((r,i)=>[r.game,r.n,removalTitles[i]+'：'+removalReasons[i]]);
 s.getRange('H7:J12').format.font={name:'Microsoft YaHei',size:10,color:'#596679'};
 s.getRange('H7:J12').format.verticalAlignment='top';s.getRange('J7:J12').format.wrapText=true;
 s.getRange('H14').values=[['难度评估口径']];s.getRange('H14').format.font={name:'Microsoft YaHei',size:11,bold:true,color:'#284766'};
 s.getRange('J15').values=[['以原难度为基础，综合操作限制、成绩门槛、精确复刻及条件叠加评估；未逐项实测。']];
 s.getRange('J16').values=[['难度会随选曲与玩家水平变化；调整理由见任务备注。']];
 s.getRange('J17').values=[['Phigros 与通用新增任务保留用户指定难度。']];
 s.getRange('J18').values=[['资料：原文档、上传图片、用户提供的 maimai 难度及新增任务。']];
 s.getRange('J19').values=[['maimai 评分机制核对：https://maimai.sega.jp/news/2019-08-07/']];
 s.getRange('J15:J19').format.font={name:'Microsoft YaHei',size:10,color:'#596679'};s.getRange('J15:J19').format.wrapText=true;
 const sources=[['E7','tiaozhan (1).docx，Phigros；新增 21–25 由用户提供。'],['E32','5a0c6691100637b2944bea5b3bbc4bce.jpg，Arcaea 新版任务。'],['E57','tiaozhan (1).docx，Maimai；原难度由用户提供，已删减原 10、16、18、19 并复评。'],['E82','40315d723ae54167b180ea3e3896d0cb.png 与 d037a42b33e54e9b3c21f5f5f0c5008b.png；删减原 18、19 并复评。'],['E107','tiaozhan (1).docx，通用；新增 21–25 由用户提供。']];
 for(const [address,text]of sources)wb.notes.add({id:s.name+':'+address,target:{cell:{sheetName:s.name,sheetId:s.sheetId,address}},authorId:'',createdAt:'',body:{plainText:text}});
 wb.recalculate();
 if(JSON.stringify(s.getRange('A7:F131').values)!==JSON.stringify(matrix))throw new Error('Data mismatch');
 const summaries=gameOrder.map(game=>({game,count:records.filter(r=>r.game===game).length,difficulties:records.filter(r=>r.game===game).reduce((a,r)=>(a[r.difficulty]=(a[r.difficulty]||0)+1,a),{})}));
 if(records.length!==125||records.some(x=>!['易','中','难','极难'].includes(x.difficulty)))throw new Error('Invalid results');
 console.log(JSON.stringify({total:125,summaries,deleted:removed.map(r=>({game:r.game,originalNumber:r.n})),extreme:records.filter(r=>r.difficulty==='极难').map(r=>({game:r.game,number:r.n,text:r.text}))}));
 console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
 for(const [name,range]of [['normalized-opening','A1:F10'],['normalized-phi','A26:F31'],['normalized-arc','A42:F47'],['normalized-mai','A70:F75'],['normalized-paradigm','A102:F106'],['normalized-common','A127:F131'],['normalized-removals','H2:J19']]){
  const preview=await wb.render({sheetName:s.name,range,scale:1.2,format:'png'});
  await fs.writeFile(path.join(outDir,name+'.png'),new Uint8Array(await preview.arrayBuffer()));
 }
 const output=await SpreadsheetFile.exportXlsx(wb);await output.save(path.join(outDir,'HRG挑战任务汇总_各组25项.xlsx'));
 await fs.writeFile(path.join(outDir,'integrated-data.json'),JSON.stringify(records,null,2));
 await fs.writeFile(path.join(outDir,'normalization-audit.json'),JSON.stringify({summaries,removed,changes},null,2));
 console.log('SAVED '+path.join(outDir,'HRG挑战任务汇总_各组25项.xlsx'));
 process.exit(0);
}
const paragraphs = JSON.parse(await fs.readFile(path.join(outDir, 'source-paragraphs.json'), 'utf8')).map(s=>s.trim()).filter(Boolean);
if (process.argv.includes('--review-colors') || process.argv.includes('--update-colors')) {
 const file=path.join(outDir,'HRG挑战任务汇总.xlsx');
 const existing=await SpreadsheetFile.importXlsx(await FileBlob.load(file));
 const s=existing.worksheets.getItem('任务总表');
 if(process.argv.includes('--review-colors')) {
  const preview=await existing.render({sheetName:s.name,range:'A6:F10',scale:1.2,format:'png'});
  await fs.writeFile(path.join(outDir,'before-colors.png'),new Uint8Array(await preview.arrayBuffer()));
  console.log((await existing.inspect({kind:'table',range:'任务总表!A7:F10',include:'values',tableMaxRows:4,tableMaxCols:6,maxChars:1800})).ndjson);
  process.exit(0);
 }
 const original=s.getRange('A7:F127').values;
 const colorParas=JSON.parse(await fs.readFile(path.join(outDir,'source-colors.json'),'utf8')).filter(x=>x.text.trim()).map(x=>({...x,text:x.text.trim()}));
 const difficultyMap={green:'易',yellow:'中',red:'难'};
 const beforeRecords=JSON.parse(await fs.readFile(path.join(outDir,'integrated-data.json'),'utf8'));
 let currentGame='',phiNumber=0,commonNumber=0;
 const mappings=new Map();
 for(const p of colorParas) {
  if(['Phigros','Arcaea','Maimai','Paradigm：Reboot','通用：'].includes(p.text)) { currentGame=p.text;continue; }
  if(!['Phigros','通用：'].includes(currentGame)) continue;
  const highlights=[...new Set(p.colors.flatMap(x=>[...x.matchAll(/<w:highlight\s+w:val="(green|yellow|red)"/g)].map(m=>m[1])))];
  if(highlights.length>1) throw new Error('Conflicting highlight colors: '+p.text);
  let n;
  if(currentGame==='Phigros') {
   const explicit=p.text.match(/^(\d+)[.、]/);
   if(explicit) { n=Number(explicit[1]);phiNumber=n; }
   else if(/^(不转板|请和你|单手ap|课题模式|本挑战)/.test(p.text)) {n=++phiNumber;}
   else n=phiNumber;
  } else {
   const explicit=p.text.match(/^(\d+)[.、]/);
   if(explicit) {n=Number(explicit[1]);commonNumber=n;} else n=commonNumber;
  }
  if(highlights.length) {
   const key=(currentGame==='Phigros'?'Phigros':'通用')+':'+n;
   const diff=difficultyMap[highlights[0]];
   if(mappings.has(key)&&mappings.get(key)!==diff) throw new Error('Task color mismatch '+key);
   mappings.set(key,diff);
  }
 }
 if(mappings.size!==40) throw new Error('Expected 40 highlighted tasks, got '+mappings.size);
 for(let i=0;i<original.length;i++) {
  const row=original[i],key=row[1]+':'+row[2];
  if(mappings.has(key)) {
   s.getRange(`D${i+7}`).values=[[mappings.get(key)]];
   beforeRecords[i].difficulty=mappings.get(key);
  }
 }
 s.getRange('E4').values=[['文档荧光色：绿色易、黄色中、红色难；Arcaea、范式起源用图片；maimai 难度按用户提供。']];
 const colored=s.getRange('D7:D127');
 colored.conditionalFormats.deleteAll();
 for(const [name,bg,fg] of [['易','#E2F0E7','#21613D'],['中','#FFF2D8','#825900'],['难','#F9E3E3','#9B3232'],['未标注','#E9EDF2','#657186']]) colored.conditionalFormats.addCustom(`$D7="${name}"`,{fill:bg,font:{color:fg,bold:true}});
 existing.recalculate();
 const after=s.getRange('A7:F127').values;
 let changed=0;
 for(let i=0;i<original.length;i++) for(let j=0;j<6;j++) {
  if(original[i][j]!==after[i][j]) {if(j!==3||!['Phigros','通用'].includes(original[i][1]))throw new Error('Unexpected change');changed++;}
 }
 if(changed!==40) throw new Error('Changed count mismatch '+changed);
 for(let i=0;i<after.length;i++) {const key=after[i][1]+':'+after[i][2];if(mappings.has(key)&&after[i][3]!==mappings.get(key))throw new Error('Difficulty mismatch');}
 console.log(JSON.stringify({updated:changed,difficulty:after.reduce((a,r)=>(a[r[3]]=(a[r[3]]||0)+1,a),{}),unmarked:after.filter(r=>r[3]==='未标注').map(r=>({game:r[1],number:r[2]}))}));
 for(const [name,range] of [['after-colors-phi','A6:F12'],['after-colors-common','A108:F113']]) {
  const preview=await existing.render({sheetName:s.name,range,scale:1.3,format:'png'});
  await fs.writeFile(path.join(outDir,name+'.png'),new Uint8Array(await preview.arrayBuffer()));
 }
 await fs.writeFile(path.join(outDir,'integrated-data.json'),JSON.stringify(beforeRecords,null,2));
 const output=await SpreadsheetFile.exportXlsx(existing);
 await output.save(file);
 console.log('UPDATED '+file);
 process.exit(0);
}
function section(name, next) { return paragraphs.slice(paragraphs.indexOf(name)+1, paragraphs.indexOf(next)); }
function numbered(lines) {
  const records=[];
  for(const line of lines) {
    const m=line.match(/^(\d+)[.．、]?\s*(.*)$/);
    if(m) records.push({n:Number(m[1]),text:m[2]});
    else { if(!records.length) throw new Error('Unexpected continuation'); records.at(-1).text+='\n'+line; }
  }
  return records;
}
const phiLines=section('Phigros','Arcaea');
const phigros=[
 {n:1,text:phiLines[0]},
 {n:2,text:phiLines[1]+'\n'+phiLines[2]},
 {n:3,text:phiLines[3]},
 {n:4,text:phiLines[4]},
 {n:5,text:phiLines[5]+'\n'+phiLines[6]},
 {n:6,text:phiLines[7]+'\n'+phiLines[8]},
 ...numbered(phiLines.slice(9))
];
const maimai=numbered(section('Maimai','Paradigm：Reboot'));
const common=numbered(paragraphs.slice(paragraphs.indexOf('通用：')+1));
const maiDifficulties='易，中，难，难，易，易，中，中，易，易，易，易，中，易，难，中，中，难，难，难，中，中，中，难，易，中，难，易，易'.split('，');
const arcaea=[
 ['中','镜像游玩任意一首 10 级及以上的歌，超过自己本地的记录\n-100000','图片中“-100000”另起一行，按原文保留。'],
 ['难','游玩任意等级的 ftr 曲目，要求达到全部红蛇，有音弧判定上得分则重开（本身就能做到全红）'],
 ['易','可以对换光暗侧的歌曲使用光对立前后打两次，保持在同一评级'],
 ['难','在选曲列表随歌，直到随到联动曲目为止，并说出联动曲目在本家的主难度定数（每失败一次积分 -50）'],
 ['难','使用任意困难角色通关任意一首 11/11 /12','图片原文为“11/11 /12”，未显示加号。'],
 ['难','在任意难度任意曲目打出 far/lost 为 6/7 的结算成绩（允许使用拉格兰）'],
 ['易','连续游玩首字母为 g、u、y 的曲目（要求 ftr 及以上），总成绩达到 29550000 以上'],
 ['中','唱打 xterfusion'],
 ['难','以超过 100 小 p 的成绩 pm 任意一首歌'],
 ['中','以 max 速度和 min 速度游玩同一首 ftr 及以上曲子，结算成绩达到 19200000 及以上'],
 ['难','从进入主界面开始计时，30s 内通过选取曲包的方式找到 4 首同个曲师的作品（每失败一次 -50）'],
 ['难','选取任意一首 ftr9 及以上，连续三次游玩，分别只接蛇/地键/天键，总结算成绩达到 10000000 及以上'],
 ['易','游玩任意 ftr，不能出现 late 判定'],
 ['易','游玩任意 ftr，不能出现 early 判定'],
 ['未标注','一只手接天键和蛇，不同于那只手的另一只手接地键，track complete 任意曲目','图片未标注难度。'],
 ['中','残片数量末尾两位为质数'],
 ['易','任意谱面结算分数的 7–8 位数中有至少 4 个数字相同（不能是 0）'],
 ['中','倒打色号，5000000 以上'],
 ['易','被姛炷强碱一次'],
 ['易','随机选歌直到抽选到 d0ez'],
 ['中','风暴 byd 双人合作，左边的人用右手，右边的人用左手，达到 7000000'],
 ['中','拍摄出多次元 & testify & Oshama Scramble 曲绘姿势'],
 ['难','卸载掉游玩设备上的任意一款音游'],
 ['难','暂停 10 次使用猫对立完成 Libertas BYD clear'],
 ['易','给 bult_0509 一键三连十次']
].map(([difficulty,text,note],i)=>({n:i+1,difficulty,text,note:note||''}));
const paradigm=[
 ['易','名无宣教师 ctc 拟，双人或三人协力，分数达到 990000（模拟 dynamix 站位）'],
 ['中','winter cube ctc ■，双人或三人协力，lost 总数不超过 30'],
 ['中',"time's up ctc 止，1000000"],
 ['易','elegante ctc 双，990000'],
 ['易','inner norm ctc 侧，990000'],
 ['易','bpm=rt ctc，990000'],
 ['易','席替（换座位），massive 难度全连'],
 ['中','以下任务任选其一：\nA. 新手教程，数据紊乱段全连。\nB. 新手教程，教程段 AD 通过（特殊要求：将蓝色 tap 视为白色 tap 击打，即手指需要离开屏幕，不可在屏幕上滑动）。'],
 ['易','ternion massive 难度，达成以下要求：开异象；三押段全连；尾杀降速段 AD'],
 ['难','慢速带师：cybernetic vampire massive 难度，在满足以下要求的条件下分数达到 980000：谱面流速 0.4；音符出现距离 3'],
 ['中','nox silva/labyrinthox 两者任选其一，invaded 谱面分数达到 1009000'],
 ['中','【special】曲师猜猜乐：请找出范式起源游戏内收录曲目数量大于 6 首的一个曲师，并选择其任意一首曲目 massive 难度进行游玩，分数达到 1009000'],
 ['中','【special】曲绘找找茬之我爱 para：请在全游收录曲目中找到 3 首满足“曲绘中有 para 且她手中（或手旁）有花束”的曲目，并游玩其中任意一首，分数达到 1005000'],
 ['中','【special】纵连打信者：选择一首有长纵连的曲目游玩其 massive 难度，分数达到 1000000'],
 ['易','【special】曲名何意味：找到曲名除去字母、汉字、日语假名后含有至少两个圈的曲目，并游玩 massive 难度，分数达到 1000000'],
 ['中','在商场过道罚站军姿 3min，保持面部严肃，眼神坚毅，不许笑（），若没绷住则重新开始计时'],
 ['难','随机找一个路人点击一次范式全曲随机键，得到一首随机曲目，游玩该曲目的最高难度且分数须达到 1005000，若否，重复上一步骤（即重新寻找路人），直至达到分数要求'],
 ['易','麦门？！：在附近的麦当劳购买薯条二重奏并在计时 10min 内吃完，则该任务完成'],
 ['中','随机寻找路人进行划拳，连胜三次（平局不计入）则任务完成，若在中途失败则须重新寻找路人'],
 ['中','由任一队员手持平板或手机站立，设备所在平面和地面垂直，另一队员与之面对面站立，游玩指定曲目 [Re:Layered massive]，要求分数达到 1006000'],
 ['难','转板倒打指定曲目 rebooted mind massive 难度，分数达到 1000000'],
 ['中','用双手小拇指游玩一首难度为 15 及以上曲目，分数达到 1000000'],
 ['易','单手游玩零号车辆 detected 谱面，并取得全连击，则该任务完成'],
 ['中','AD 一首 16 级难度歌曲'],
 ['难','【special】数据乱流：将音频延迟参数 -200，画面延迟参数 +100，完成一首 16 级或以上曲目，要求分数达到 1000000'],
 ['难','控速挑战：指定曲目 Aleph0 massive 难度，从以下两项中任选一项完成：\nA. 结算时 received 总数达到 200 或以上，lost 总数不超过 20。\nB. 将谱面流速调至 1.6，音符出现距离调至 1，在此设置下游玩该谱面，要求分数达到 1000000。'],
 ['难','大麻烦！！！：游玩 Giganto Machina reboot 难度，分数达到 1007500']
].map(([difficulty,text],i)=>({n:i+1,difficulty,text,note:''}));

const groups=[['Phigros',phigros,20],['Arcaea',arcaea,25],['maimai',maimai,29],['范式起源',paradigm,27],['通用',common,20]];
const records=[];
for(const [game,items,count] of groups) {
 if(items.length!==count) throw new Error(`${game} count ${items.length} != ${count}`);
 items.forEach((item,i)=>{
  if(item.n!==i+1) throw new Error(`${game} numbering error`);
  records.push({game,...item,difficulty:game==='maimai'?maiDifficulties[i]:item.difficulty||'未标注',note:item.note||''});
 });
}
if(records.length!==121||maiDifficulties.length!==29) throw new Error('Total mismatch');
await fs.writeFile(path.join(outDir,'integrated-data.json'),JSON.stringify(records,null,2));
const wb=Workbook.create();
const sheet=wb.worksheets.add('任务总表');
sheet.showGridLines=false;
sheet.tabColor='#284766';
const end=records.length+6;
const all=sheet.getRange(`A1:F${end}`);
all.format.font={name:'Microsoft YaHei',size:11,color:'#1F2937'};
all.format.verticalAlignment='center';
sheet.getRange('A2').values=[['HRG 挑战任务总表']];
sheet.getRange('A2').format.font={name:'Microsoft YaHei',size:17,bold:true,color:'#284766'};
sheet.getRange('A2:F2').format.rowHeight=30;
sheet.getRange('A2:F2').format.borders={bottom:{style:'thin',color:'#A6B6C5'}};
sheet.getRange('E3').values=[['共 121 项：Phigros 20 · Arcaea 25 · maimai 29 · 范式起源 27 · 通用 20']];
sheet.getRange('E4').values=[['文档：Phigros、maimai、通用；图片：Arcaea、范式起源；maimai 难度：用户提供。']];
sheet.getRange('E3:E4').format.font={name:'Microsoft YaHei',size:10,color:'#596679'};
sheet.getRange('A6:F6').values=[['总序号','游戏 / 侧别','任务序号','任务难度','任务内容与完成要求','备注']];
const matrix=records.map((r,i)=>[i+1,r.game,r.n,r.difficulty,r.text,r.note]);
sheet.getRange(`A7:F${end}`).values=matrix;
const table=sheet.tables.add(`A6:F${end}`,true,'ChallengeTasks');
table.showFilterButton=true;
sheet.getRange('A6:F6').format={fill:'#284766',font:{name:'Microsoft YaHei',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:30};
sheet.getRange(`A7:A${end}`).setNumberFormat('0');
sheet.getRange(`C7:C${end}`).setNumberFormat('0');
sheet.getRange(`A7:A${end}`).format.horizontalAlignment='right';
sheet.getRange(`C7:C${end}`).format.horizontalAlignment='right';
sheet.getRange(`D7:D${end}`).format.horizontalAlignment='center';
sheet.getRange(`E7:F${end}`).format.wrapText=true;
sheet.getRange(`E7:F${end}`).format.verticalAlignment='top';
for(const [col,width] of [['A',60],['B',130],['C',75],['D',90],['E',730],['F',250]]) sheet.getRange(`${col}1:${col}${end}`).format.columnWidthPx=width;
function visualUnits(text) { return [...text].reduce((n,c)=>n+(c.charCodeAt(0)>255?2:1),0); }
for(let i=0;i<records.length;i++) {
 const row=i+7,r=records[i];
 const lines=r.text.split('\n').reduce((n,t)=>n+Math.max(1,Math.ceil(visualUnits(t)/81)),0);
 const noteLines=Math.max(1,Math.ceil(visualUnits(r.note)/27));
 sheet.getRange(`A${row}:F${row}`).format.rowHeight=Math.max(34,Math.max(lines,noteLines)*19+12);
 sheet.getRange(`A${row}:F${row}`).format.fill=i%2===0?'#FFFFFF':'#F3F6FA';
 if(i===0||r.game!==records[i-1].game) sheet.getRange(`A${row}:F${row}`).format.borders={top:{style:'medium',color:'#A6B6C5'}};
}
const diffRange=sheet.getRange(`D7:D${end}`);
for(const [name,bg,fg] of [['易','#E2F0E7','#21613D'],['中','#FFF2D8','#825900'],['难','#F9E3E3','#9B3232'],['未标注','#E9EDF2','#657186']]) diffRange.conditionalFormats.add('cellIs',{operator:'equal',formula:`"${name}"`,format:{fill:bg,font:{color:fg,bold:true}}});
diffRange.dataValidation={rule:{type:'list',values:['易','中','难','未标注']}};
sheet.freezePanes.freezeRows(6);
const sourceNotes=[
 ['E7','来源：tiaozhan (1).docx，Phigros 段落。'],
 ['E27','来源：5a0c6691100637b2944bea5b3bbc4bce.jpg，Arcaea 新版任务及难度。'],
 ['E52','来源：tiaozhan (1).docx，Maimai 段落；难度按用户提供的 29 项顺序对应。'],
 ['E81','来源：40315d723ae54167b180ea3e3896d0cb.png（1–15）和 d037a42b33e54e9b3c21f5f5f0c5008b.png（16–27）。'],
 ['E108','来源：tiaozhan (1).docx，通用段落。']
];
for(const [address,text] of sourceNotes) wb.notes.add({id:`${sheet.name}:${address}`,target:{cell:{sheetName:sheet.name,sheetId:sheet.sheetId,address}},authorId:'',createdAt:'',body:{plainText:text}});
wb.recalculate();
const actual=sheet.getRange(`A7:F${end}`).values;
if(JSON.stringify(actual)!==JSON.stringify(matrix)) throw new Error('Workbook data mismatch');
console.log(JSON.stringify({total:records.length,groups:groups.map(([g,t])=>[g,t.length]),difficulty:records.reduce((x,r)=>(x[r.difficulty]=(x[r.difficulty]||0)+1,x),{})}));
console.log((await wb.inspect({kind:'table',range:'任务总表!A27:F29',include:'values',tableMaxRows:3,tableMaxCols:6,maxChars:1600})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:10},maxChars:1000})).ndjson);
for(const [name,range] of [['opening','A1:F10'],['arc-details','A37:F43'],['paradigm-end','A102:F107']]) {
 const image=await wb.render({sheetName:sheet.name,range,scale:1.4,format:'png'});
 await fs.writeFile(path.join(outDir,`${name}.png`),new Uint8Array(await image.arrayBuffer()));
}
const output=await SpreadsheetFile.exportXlsx(wb);
await output.save(path.join(outDir,'HRG挑战任务汇总.xlsx'));
console.log('SAVED '+path.join(outDir,'HRG挑战任务汇总.xlsx'));
