import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildCorpora, CORPORA, prepareCorpus, selectCorpora, loadCorpusTokenizer, CHUNK_RECIPE} from '../site/build-corpus-embeddings.mjs';
import {collectCorpora} from '../site/corpus-sources.mjs';
import {chunkText} from '../site/token-chunks.mjs';
import {sha256,readJson,readObject,verifyManifestRelease,writeObject,publishManifest,withIndexLock} from '../scriptures/index-publication.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const fakeTokenizer={model_max_length:512,encode:text=>Array.from(text+'xx')};
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'corpus-publication-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 let collections=Object.fromEntries(CORPORA.map(corpus=>[corpus,{entries:[{id:corpus,text:'source text',sourcePath:`public/${corpus}.json`}],sources:[{path:`public/${corpus}.json`,sha256:sha256(corpus)}]}]));
 let calls=0;
 const options={root,collect:()=>structuredClone(collections),tokenizer:fakeTokenizer,encoder:{model:'fixture'},embed:async(inputs)=>{
  calls++;const data=new Float32Array(inputs.length*384);inputs.forEach((text,row)=>{data[row*384+text.length%384]=1;});return {data};
 }};
 return {options,manifest:()=>fs.readFileSync(path.join(root,'public/semantic-corpora/manifest.json'),'utf8'),calls:()=>calls,
  change(id){collections[id].entries[0].text+=' changed';},corrupt(manifest,id){fs.writeFileSync(path.join(root,'public/semantic-corpora',manifest.corpora[id].rows.path),'bad');}};
}
test('corpus selection rejects omissions and typos',()=>{
 for(const args of [['--corpus'],['--corpus='],['--corpus=early,early'],['--corpus=early,bad'],['--corpus','early','--corpus=words']])assert.throws(()=>selectCorpora(args));
 assert.deepEqual([...selectCorpora(['--corpus','early,words'])],['early','words']);
});
test('corpora publish a complete generation, cache no-op, and preserve unselected artifacts',async t=>{
 const f=fixture(t);const first=await buildCorpora(f.options);verifyManifestRelease(first);assert.equal(f.calls(),CORPORA.length);
 const original=f.manifest();await buildCorpora(f.options);assert.equal(f.calls(),CORPORA.length);assert.equal(f.manifest(),original);
 f.change('early');const next=await buildCorpora({...f.options,args:['--corpus=early']});assert.equal(f.calls(),CORPORA.length+1);
 assert.deepEqual(next.corpora.words,first.corpora.words);assert.deepEqual(next.corpora.afterlife,first.corpora.afterlife);assert.deepEqual(next.corpora.library,first.corpora.library);assert.notEqual(next.releaseId,first.releaseId);
 await buildCorpora({...f.options,args:['--corpus=early','--force']});assert.equal(f.calls(),CORPORA.length+2);
});
test('partial rebuild refuses a stale or corrupt unselected corpus without publication',async t=>{
 const f=fixture(t);const first=await buildCorpora(f.options),original=f.manifest();f.corrupt(first,'words');
 await assert.rejects(buildCorpora({...f.options,args:['--corpus=early']}),/Cannot preserve words/);assert.equal(f.manifest(),original);
 await buildCorpora(f.options);f.change('afterlife');const repaired=f.manifest();
 await assert.rejects(buildCorpora({...f.options,args:['--corpus=early']}),/Cannot preserve afterlife/);assert.equal(f.manifest(),repaired);
});
test('inference failure, publication failure and source drift preserve the visible generation',async t=>{
 const f=fixture(t);await buildCorpora(f.options);const original=f.manifest();f.change('early');
 await assert.rejects(buildCorpora({...f.options,embed:async()=>{throw Error('inference failure');}}),/inference failure/);assert.equal(f.manifest(),original);
 await assert.rejects(buildCorpora({...f.options,beforePublish:()=>{throw Error('stop before publish');}}),/stop before publish/);assert.equal(f.manifest(),original);
 await assert.rejects(buildCorpora({...f.options,beforePublish:()=>f.change('words')}),/sources or model changed/);assert.equal(f.manifest(),original);
});
test('missing source provenance and empty or duplicate parents fail closed',()=>{
 const source={path:'public/source.json',sha256:sha256('source')},entry={id:'a',text:'body',sourcePath:source.path};
 for(const collection of [{sources:[],entries:[entry]},{sources:[source],entries:[entry,entry]},{sources:[source],entries:[{...entry,text:''}]}])assert.throws(()=>prepareCorpus('early',collection,fakeTokenizer));
});
test('chunks retain every character, progress, respect budgets and do not split Unicode code points',()=>{
 for(const text of ['','short','a'.repeat(600),'word '.repeat(300),'😀𐐷漢字 '.repeat(200)])for(const overlapTokens of [0,4]){
  const chunks=chunkText(text,s=>Array.from(s).length+2,{maxTokens:32,overlapTokens,specialTokens:2});
  if(!text){assert.deepEqual(chunks,[]);continue;}
  assert.equal(chunks[0].start,0);assert.equal(chunks.at(-1).end,text.length);
  chunks.forEach((c,i)=>{assert.equal(c.text,text.slice(c.start,c.end));assert.ok(c.tokens<=32);assert.ok(!/^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/.test(c.text));
   if(i){assert.ok(c.start>chunks[i-1].start);assert.ok(c.start<=chunks[i-1].end);assert.ok(c.end>chunks[i-1].end);}
  });
 }
 assert.throws(()=>chunkText('x',()=>1,{maxTokens:8,overlapTokens:8}));
});
test('published chunks match current source bytes, normalized spans and actual tokenizer limits',async()=>{
 const dir=path.join(ROOT,'public/semantic-corpora'),manifest=readJson(path.join(dir,'manifest.json'));verifyManifestRelease(manifest);
 const collections=collectCorpora(ROOT),tokenizer=await loadCorpusTokenizer(ROOT);
 for(const id of CORPORA){
  const descriptor=manifest.corpora[id],index=JSON.parse(readObject(dir,descriptor.index));
  const expected=prepareCorpus(id,collections[id],tokenizer);
  assert.deepEqual(index.entries,expected.entries);assert.deepEqual(index.sources,collections[id].sources);assert.deepEqual(index.coverage,expected.coverage);
  assert.equal(readObject(dir,descriptor.rows).length,expected.entries.length*384);
  const parents=new Map(collections[id].entries.map(e=>[e.id,e]));
  const groups=Map.groupBy(index.entries,e=>e.parentId);
  for(const [parentId,chunks]of groups){const parent=parents.get(parentId);assert.equal(chunks[0].chunk.start,0);assert.equal(chunks.at(-1).chunk.end,parent.text.length);
   chunks.forEach((e,i)=>{const text=parent.text.slice(e.chunk.start,e.chunk.end);assert.equal(sha256(text),e.chunk.sha256);assert.equal(tokenizer.encode(text).length,e.chunk.tokens);assert.ok(e.chunk.tokens<=CHUNK_RECIPE.maxTokens);
    if(i){assert.ok(e.chunk.start<=chunks[i-1].chunk.end);assert.ok(e.chunk.end>chunks[i-1].chunk.end);}
   });
  }
 }
});

test('a validly hashed but incompatible cached index must be rebuilt',async t=>{
 const f=fixture(t),first=await buildCorpora(f.options),dir=path.join(f.options.root,'public/semantic-corpora');
 const index=JSON.parse(readObject(dir,first.corpora.words.index));index.model='wrong-model';
 first.corpora.words.index=writeObject(dir,Buffer.from(JSON.stringify(index)+'\n'),'json');
 const payload={...first};delete payload.releaseId;delete payload.generatedAt;
 publishManifest(dir,payload,first);
 await assert.rejects(buildCorpora({...f.options,args:['--corpus=early']}),/Cannot preserve words/);
 await buildCorpora(f.options);assert.equal(f.calls(),CORPORA.length+1);
});
test('missing release provenance and concurrent corpus writers fail closed',async t=>{
 const f=fixture(t);
 await assert.rejects(buildCorpora({...f.options,args:['--corpus=early']}),/Cannot preserve words/);
 await withIndexLock(f.options.root,'corpora',async()=>assert.rejects(buildCorpora(f.options),/EEXIST/));
 await buildCorpora(f.options);
 fs.writeFileSync(path.join(f.options.root,'public/semantic-corpora/manifest.json'),'{broken');
 await assert.rejects(buildCorpora({...f.options,args:['--corpus=early']}),/Cannot preserve words/);
 verifyManifestRelease(await buildCorpora(f.options));
});
