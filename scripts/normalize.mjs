import vm from 'node:vm';
import fs from 'node:fs';
const ctx={window:{}};vm.createContext(ctx);
for(const name of ['content','permits'])vm.runInContext(fs.readFileSync(new URL(`legacy-${name}.js`,import.meta.url),'utf8'),ctx);
fs.writeFileSync(new URL('../public/data/content.json',import.meta.url),JSON.stringify(ctx.window.SIERRA_CONTENT,null,2));
fs.writeFileSync(new URL('../public/data/permits.json',import.meta.url),JSON.stringify(ctx.window.SIERRA_PERMITS,null,2));
fs.writeFileSync(new URL('../public/data/weather.json',import.meta.url),JSON.stringify(ctx.window.SIERRA_WEATHER,null,2));
