import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createCorpusLoader,rankCorpusRows,validateCorpusIndex,validateCorporaManifest,type CorpusIndex,type EarlyEntry,type CorporaManifest} from '../src/lib/semantic-corpus';
const ROOT=path.join(import.meta.dirname,'../public/semantic-corpora');
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file));
const manifest=JSON.parse(read('manifest.json').toString()) as CorporaManifest;
const index=JSON.parse(read(manifest.corpora.early.index.path).toString()) as CorpusIndex<EarlyEntry>;
const rehash=(value:CorporaManifest)=>{const payload:Partial<CorporaManifest>={...value};delete payload.releaseId;delete payload.generatedAt;value.releaseId=createHash('sha256').update(JSON.stringify(payload)+'\n').digest('hex');return value;};
test('parent aggregation happens before top-k with stable ties and matrix validation',()=>{
 const entries=[{id:'a0',parentId:'a'},{id:'a1',parentId:'a'},{id:'a2',parentId:'a'},{id:'b0',parentId:'b'},{id:'c0',parentId:'c'}] as EarlyEntry[];
 const idx={...index,dims:2,entries};const rows=new Int8Array([127,0,126,0,125,0,124,0,124,0]);
 assert.deepEqual(rankCorpusRows([1,0],idx,rows,3).map(v=>v.row),[0,3,4]);
 assert.deepEqual(rankCorpusRows([1,0],idx,rows,0),[]);
 assert.throws(()=>rankCorpusRows([NaN,0],idx,rows,3));assert.throws(()=>rankCorpusRows([1,0],idx,rows.slice(2),3));assert.throws(()=>rankCorpusRows([1,0],idx,rows,-1));
});
test('manifest digest, identity and artifact shape are mandatory',async()=>{
 await validateCorporaManifest(manifest);
 const wrong=structuredClone(manifest);wrong.corpora.early.parents--;await assert.rejects(validateCorporaManifest(wrong),/integrity/);
 const model=rehash({...manifest,model:'wrong'});await assert.rejects(validateCorporaManifest(model),/Incompatible/);
 const traversal=structuredClone(manifest);traversal.corpora.early.index.path='../early.json';await assert.rejects(validateCorporaManifest(rehash(traversal)),/artifact/);
});
test('index validation rejects duplicate, missing and gapped provenance',()=>{
 validateCorpusIndex(index,'early',manifest);
 const firstLong=index.entries.findIndex(e=>e.chunk!.count>1);
 for(const mutate of [(e:EarlyEntry)=>{e.parentId=undefined;},(e:EarlyEntry)=>{e.chunk!.tokens=513;},(e:EarlyEntry)=>{e.chunk!.start+=100000;},(e:EarlyEntry)=>{e.source!.sha256='bad';}]){
  const broken=structuredClone(index);mutate(broken.entries[firstLong+1]);assert.throws(()=>validateCorpusIndex(broken,'early',manifest));
 }
 const duplicate=structuredClone(index);duplicate.entries[1]=duplicate.entries[0];assert.throws(()=>validateCorpusIndex(duplicate,'early',manifest));
});
test('one manifest binds parallel rows and metadata; corrupt requests can be retried',async()=>{
 let rootCalls=0,corrupt=true;const requests:string[]=[];
 const loader=createCorpusLoader(async url=>{
  const file=String(url).replace('/semantic-corpora/','');requests.push(file);
  if(file==='manifest.json')rootCalls++;
  const bytes=file===manifest.corpora.early.rows.path&&corrupt ? Buffer.from('mismatched generation') : read(file);
  return new Response(bytes);
 });
 const loaded=await loader.loadIndex<EarlyEntry>('early');assert.equal(loaded.entries.length,index.entries.length);
 await assert.rejects(loader.loadRows('early'),/integrity/);corrupt=false;
 const [rows,same]=await Promise.all([loader.loadRows('early'),loader.loadIndex('early')]);
 assert.equal(rows.length,index.entries.length*384);assert.equal(same,loaded);assert.equal(rootCalls,1);
 assert.equal(requests.filter(p=>p===manifest.corpora.early.rows.path).length,2);
 assert.ok(requests.every(p=>p==='manifest.json'||/^objects\/[a-f0-9]{64}\.(bin|json)$/.test(p)));
});
test('a failed manifest request does not poison subsequent attempts',async()=>{
 let first=true;const loader=createCorpusLoader(async url=>{
  if(first){first=false;return new Response('unavailable',{status:503});}
  return new Response(read(String(url).replace('/semantic-corpora/','')));
 });
 await assert.rejects(loader.loadIndex('early'),/503/);
 assert.equal((await loader.loadIndex('early')).entries.length,index.entries.length);
});
