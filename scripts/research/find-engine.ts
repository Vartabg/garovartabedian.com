import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { encoderRecipe, loadCorpusEmbedder, DIMS } from "../site/build-corpus-embeddings.mjs";
import { collectEarly } from "../site/corpus-sources.mjs";
import { prepareBook } from "../scriptures/build-embeddings.mjs";
import { readObject, verifyManifestRelease } from "../scriptures/index-publication.mjs";
import { validateCorporaManifest, validateCorpusIndex, type CorporaManifest, type CorpusIndex, type EarlyEntry } from "../../src/lib/semantic-corpus";
import { rankRows, type SemanticManifest } from "../../src/lib/scriptures/semantic";
import { searchRelatedPassagesFrom } from "../../src/lib/scriptures/related";
import type { Canons, NaveIndex, NaveTopicFile } from "../../src/lib/scriptures/types";
import { compareEvidenceRelevance } from "../../src/lib/evidence-explorer";
import type { EvidenceQuery, EvidenceRun, EvidenceHit } from "../../src/lib/evidence-explorer";
import type { SourceSpec, TextBlock, Run, Unit } from "./types";
import { MODEL, RUBRIC_VERSION } from "./types";
import { loadSource, verifyBlock } from "./sources";
import { vectorsFor } from "./retrieval";
import { JevClient, loadKey, unitFingerprint } from "./client";
import { FIND_RUBRIC, findQuestions, validateRelevance } from "./find-rubric";
import { fingerprint, hash, readJson, writeJson, writeFile, localPath } from "./storage";
import { saveRun } from "./workflow";

type Doc = { id: string; text: string; spec: SourceSpec; block?: TextBlock; semantic?: number };
type Verse = { book: string; chapter: number; verse: number };
type ScriptureIndex = { rows: Int8Array; refs: Verse[] };
type EarlyIndex = { rows: Int8Array; docs: Doc[] };
const fold = (text: string) => text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const stop = new Set("a an the of to in is are was were be and or for with by your my their our it this that what does do how".split(" "));
const terms = (text: string) => fold(text).split(" ").filter(t => t && !stop.has(t));
const ints = (b: Buffer) => new Int8Array(b.buffer, b.byteOffset, b.byteLength);
const scoreVector = (q: number[], v: number[]) => q.reduce((n, x, i) => n + x * v[i], 0);
export function validateEvidenceQuery(value: unknown): EvidenceQuery {
  const v = value as EvidenceQuery;
  if (!v || typeof v.query !== "string" || !v.query.trim() || v.query.length > 500) throw new Error("Enter a question of 1–500 characters.");
  if (!["all", "scripture", "early", "text"].includes(v.scope) || !["web", "kjv", "drb", "brenton"].includes(v.translation)) throw new Error("Choose a supported source scope and edition.");
  if (v.scope === "text" && (typeof v.text !== "string" || !v.text.trim() || v.text.length > 32000 || v.text.includes("\0"))) throw new Error("Supply UTF-8 text of 1–32,000 characters.");
  if (v.scope === "text" && (typeof v.name !== "string" || !/\.(txt|md)$/i.test(v.name) || v.name.length > 100)) throw new Error("Give the supplied text a .txt or .md name (at most 100 characters).");
  return { query: v.query.trim(), scope: v.scope, translation: v.translation, ...(v.scope === "text" ? { text: v.text, name: v.name } : {}) };
}
/** BM25-style term weighting; phrase matches lead and negation remains searchable. */
export function lexicalRanking(query: string, docs: { text: string }[]) {
  const queryTerms = [...new Set(terms(query))], phrase = fold(query);
  const rows = docs.map(d => { const words = terms(d.text), counts = new Map<string, number>(); for (const w of words) if (queryTerms.includes(w)) counts.set(w, (counts.get(w) ?? 0) + 1); return { size: words.length, counts, phrase: phrase.length > 0 && (` ${fold(d.text)} `).includes(` ${phrase} `) }; });
  const average = rows.reduce((n,r)=>n+r.size,0) / Math.max(1,rows.length);
  const df = new Map(queryTerms.map(t=>[t, rows.filter(r=>r.counts.has(t)).length]));
  return rows.map((r,i)=>({ i, phrase: r.phrase, score: queryTerms.reduce((sum,t)=>{ const f=r.counts.get(t) ?? 0; return sum+Math.log(1+(rows.length-(df.get(t) ?? 0)+.5)/((df.get(t) ?? 0)+.5))*f*2.2/(f+1.2*(.25+.75*r.size/Math.max(1,average))); },0) })).filter(r=>r.score>0 || r.phrase).sort((a,b)=>Number(b.phrase)-Number(a.phrase) || b.score-a.score || a.i-b.i);
}
export class EvidenceEngine {
  private embedder?: Promise<Awaited<ReturnType<typeof loadCorpusEmbedder>>>;
  private scripture?: { fingerprint: string; index: ScriptureIndex };
  private early?: { fingerprint: string; index: EarlyIndex };
  constructor(private root: string, private local: string) {}
  private file(id: string) { return localPath(path.join(this.local, "find"), id) + ".json"; }
  read(id: string) { return readJson<EvidenceRun>(this.file(id)); }
  private save(run: EvidenceRun) { writeJson(this.file(run.id), run); }
  async dispose() { await (await this.embedder)?.dispose(); }
  private async embed(text: string) {
    this.embedder ??= loadCorpusEmbedder(this.root).catch(e=>{ this.embedder=undefined; throw e; });
    const output = await (await this.embedder)([text], { pooling: "mean", normalize: true });
    try { return Array.from(output.data) as number[]; } finally { output.dispose?.(); }
  }
  private scriptureIndex(): ScriptureIndex {
    const dir = path.join(this.root,"public/scriptures/semantic");
    const m = readJson<SemanticManifest & { recipe: Parameters<typeof prepareBook>[2]; books: Record<string, { rows: {path:string;sha256:string;bytes:number}; refs: {path:string;sha256:string;bytes:number}; fingerprint:string }> }>(path.join(dir,"manifest.json"));
    verifyManifestRelease(m);
    const encoder = encoderRecipe(this.root);
    if (m.model !== encoder.model || m.dims !== DIMS || JSON.stringify(m.recipe.modelFiles) !== JSON.stringify(encoder.modelFiles)) throw new Error("Scripture vector recipe mismatch");
    const inputs = Object.keys(m.books).map(book=>({book,input:prepareBook(this.root,book,m.recipe)}));
    for (const {book,input} of inputs) if (input.fingerprint !== m.books[book].fingerprint) throw new Error("Stale Scripture index: "+book);
    const key = fingerprint({release:m.releaseId,inputs:inputs.map(i=>i.input.fingerprint)});
    if (this.scripture?.fingerprint === key) return this.scripture.index;
    const arrays: Int8Array[] = [], refs: Verse[] = [];
    for (const {book,input} of inputs) {
      const a=m.books[book], bytes=readObject(dir,a.rows), locations=JSON.parse(readObject(dir,a.refs).toString()).refs as [number,number][];
      if (JSON.stringify(locations)!==JSON.stringify(input.refs) || bytes.length!==locations.length*DIMS) throw new Error("Invalid Scripture references");
      arrays.push(ints(bytes)); refs.push(...locations.map(([chapter,verse])=>({book,chapter,verse})));
    }
    const rows=new Int8Array(refs.length*DIMS);let offset=0;for(const a of arrays){rows.set(a,offset);offset+=a.length;}
    const index={rows,refs};this.scripture={fingerprint:key,index};return index;
  }
  private async earlyIndex(): Promise<EarlyIndex> {
    const dir=path.join(this.root,"public/semantic-corpora"),m=readJson<CorporaManifest & {corpora:{early:{fingerprint:string}}}>(path.join(dir,"manifest.json"));
    await validateCorporaManifest(m);
    const collected=collectEarly(this.root);
    const collection={entries:collected.entries,sources:[...new Set(collected.entries.map(e=>e.sourcePath))].sort().map(file=>({path:file,sha256:hash(fs.readFileSync(path.join(this.root,file)))}))};
    if(hash(JSON.stringify({corpus:"early",recipe:m.recipe,collection})+"\n")!==m.corpora.early.fingerprint) throw new Error("Stale early-writing index");
    if(JSON.stringify((m.recipe as {encoder:unknown}).encoder)!==JSON.stringify(encoderRecipe(this.root))) throw new Error("Early vector recipe mismatch");
    if(this.early?.fingerprint===m.releaseId)return this.early.index;
    const index=JSON.parse(readObject(dir,m.corpora.early.index).toString()) as CorpusIndex<EarlyEntry>;
    validateCorpusIndex(index,"early",m);
    const rows=ints(readObject(dir,m.corpora.early.rows));
    if(rows.length!==index.entries.length*DIMS)throw new Error("Invalid early vector rows");
    const parents=new Map(collection.entries.map(e=>[e.id,e.text]));
    const docs=index.entries.map(e=>{
      const text=parents.get(e.parentId!)?.slice(e.chunk!.start,e.chunk!.end);
      if(!text || hash(text)!==e.chunk!.sha256)throw new Error("Early excerpt mismatch");
      return {id:e.id,text,spec:{kind:"early",id:e.textId,section:e.section} as SourceSpec};
    });
    const result={rows,docs};this.early={fingerprint:m.releaseId,index:result};return result;
  }
  async search(value: unknown, signal?: AbortSignal, experiment: { limit?: number; contextWords?: boolean } = {}): Promise<EvidenceRun> {
    const limit = experiment.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new Error("Candidate limit must be 1–200.");
    const request=validateEvidenceQuery(value), docs: Doc[]=[], issues:string[]=[], notes:string[]=[];
    const check=()=>signal?.throwIfAborted();check();
    let queryVector:number[]|undefined;
    if (request.scope !== "scripture" || request.translation === "web") {
      try { queryVector=await this.embed(request.query); } catch { issues.push("Meaning model unavailable; word and phrase retrieval remain available."); }
    }
    check();
    if(request.scope==="scripture" || request.scope==="all"){
      const dir=path.join(this.root,"public/scriptures/text",request.translation);
      try {
        for(const name of fs.readdirSync(dir).filter(f=>f.endsWith(".json")).sort()){
          const book=name.slice(0,-5), data=readJson<{chapters:string[][]}>(path.join(dir,name));
          data.chapters.forEach((verses,c)=>verses.forEach((text,v)=>{if(text.trim())docs.push({id:`${book} ${c+1}:${v+1}`,text,spec:{kind:"scripture",translation:request.translation,book,chapter:c+1,verse:v+1,endVerse:v+1}});}));
        }
        if(queryVector && request.translation === "web"){
          try { const idx=this.scriptureIndex(),scores=new Map(rankRows(Float32Array.from(queryVector),idx.rows,DIMS,idx.refs.length).map(r=>{const a=idx.refs[r.row];return [`${a.book} ${a.chapter}:${a.verse}`,r.score];})); for(const d of docs)d.semantic=scores.get(d.id); }
          catch(e){issues.push((e as Error).message+"; Scripture meaning retrieval unavailable.");}
        }
        notes.push("Nave references are added only for KJV searches, matching that index’s source numbering.");
        notes.push("All hosted verses in the selected edition were searched by wording. Selected-edition text is used for inspection and Jev.");
        if (request.translation === "web") notes.push("Meaning ranks the full verified WEB verse index; it does not select a subset of books.");
        else notes.push("Scripture meaning retrieval is unavailable in this edition. WEB vector locations are not transferred across editions; results use this edition’s own words and locations.");
      }catch{issues.push("The selected Scripture edition is unavailable.");}
    }
    if(request.scope==="early" || request.scope==="all"){
      try{
        const early=await this.earlyIndex(),scores=queryVector ? new Map(rankRows(Float32Array.from(queryVector),early.rows,DIMS,early.docs.length).map(r=>[r.row,r.score])) : new Map<number,number>();
        docs.push(...early.docs.map((d,i)=>({...d,semantic:scores.get(i)})));
        notes.push("Early coverage: the original hosted shelf, using every verified bounded excerpt. Expanded library editions are outside this scan. Legacy editions may include translator/editorial material; inspect context.");
      }catch(e){
        issues.push((e as Error).message+"; early meaning retrieval unavailable.");
        try { const collection=collectEarly(this.root); docs.push(...collection.entries.map(e=>({id:e.id,text:e.text,spec:{kind:"early" as const,id:e.textId,section:e.section}}))); notes.push("Early writings were searched by wording only, over complete hosted sections; embeddings could not be verified."); }
        catch { issues.push("Early-writing source text is unavailable."); }
      }
    }
    if(request.scope==="text"){
      const file=path.join(this.local,"inputs",`find-${hash(request.text!).slice(0,24)}.txt`);
      writeFile(file,request.text!);
      const blocks=await loadSource({kind:"file",path:file,language:"en"},this.root);
      let vectors:number[][]=[];
      if(queryVector)try{vectors=(await vectorsFor(blocks,this.root,path.join(this.local,"embeddings"))).vectors;}catch{issues.push("Supplied-text embeddings unavailable; word and phrase matches remain available.");}
      docs.push(...blocks.map((block,i)=>({id:block.id,text:block.text,spec:block.source,block:{...block,title:request.name!},semantic:queryVector && vectors[i] ? scoreVector(queryVector,vectors[i]) : undefined})));
      notes.push("The full supplied text was split at paragraph and token boundaries. Every chunk was searched; displayed results are a shortlist.");
    }
    check();
    const lexical=lexicalRanking(request.query,docs), dense=docs.map((d,i)=>({i,score:d.semantic})).filter((r):r is {i:number;score:number}=>r.score!==undefined).sort((a,b)=>b.score-a.score);
    const channels=new Map<number,Set<string>>(), scores=new Map<number,number>();
    const add=(list:number[],channel:string)=>list.slice(0,Math.max(80,limit)).forEach((i,rank)=>{scores.set(i,(scores.get(i)??0)+1/(60+rank+1));const set=channels.get(i)??new Set();set.add(channel);channels.set(i,set);});
    add(lexical.map(r=>r.i),"Words");add(dense.map(r=>r.i),"Meaning");
    if (experiment.contextWords) {
      const windows = docs.map((d,i) => ({ text: [docs[i-1],d,docs[i+1]].filter(n => n && n.spec.kind === "scripture" && d.spec.kind === "scripture" && n.spec.book === d.spec.book && n.spec.chapter === d.spec.chapter).map(n=>n.text).join(" ") || d.text }));
      add(lexicalRanking(request.query, windows).map(r=>r.i), "Context wording (experimental)");
      notes.push("Experimental adjacent-verse word retrieval is enabled; its quality has not been adjudicated.");
    }
    if((request.scope==="scripture"||request.scope==="all") && request.translation === "kjv"){
      try{
        const base=path.join(this.root,"public/scriptures"),canons=readJson<Canons>(path.join(base,"canons.json"));
        const related=await searchRelatedPassagesFrom(request.query,{canons,index:readJson<NaveIndex>(path.join(base,"nave/index.json")),stopwords:readJson<{stopwords:string[]}>(path.join(base,"search/web/meta.json")).stopwords,loadShard:async s=>readJson<NaveTopicFile>(path.join(base,"nave",s+".json"))});
        const byId=new Map(docs.map((d,i)=>[d.id,i]));
        add(related.hits.map(h=>byId.get(`${h.book} ${h.chapter}:${h.verse}`)).filter((i):i is number=>i!==undefined),"Nave 1897");
      }catch{issues.push("Nave topic index unavailable; word and meaning retrieval were still attempted.");}
    }
    const phrase=new Set(lexical.filter(r=>r.phrase).map(r=>r.i));
    const ranked=[...scores.keys()].sort((a,b)=>Number(phrase.has(b))-Number(phrase.has(a))||(scores.get(b)!-scores.get(a)!)||a-b);
    const hits:EvidenceHit[]=[],seen=new Set<string>();
    for(const i of ranked){
      check();if(hits.length===limit)break;const d=docs[i];
      // Keep the strongest excerpt per section; duplicates do not consume the shortlist.
      const parent=d.spec.kind==="early" ? `early:${d.spec.id}:${d.spec.section}` : d.id;
      if(seen.has(parent))continue;seen.add(parent);
      try{
        let block=d.block;
        if(!block){
          const blocks=await loadSource(d.spec,this.root);
          // Choose original text covering the winning normalized chunk, never quote synthesized headings.
          const overlap=(b:TextBlock)=>{const a=new Set(terms(d.text));return terms(b.text).filter(t=>a.has(t)).length/Math.max(1,terms(b.text).length);};
          block=blocks.sort((a,b)=>Number(fold(b.text).includes(fold(request.query)))-Number(fold(a.text).includes(fold(request.query)))||overlap(b)-overlap(a))[0];
        }
        verifyBlock(block,this.root);
        if(hits.some(h=>h.block.id===block.id))continue;
        hits.push({block,rank:hits.length+1,channels:[...(channels.get(i)??[])],phrase:(` ${fold(block.text)} `).includes(` ${fold(request.query)} `)});
      }catch(e){issues.push("Unavailable result: "+(e as Error).message);}
    }
    const run:EvidenceRun={id:`find-${randomUUID()}`,createdAt:new Date().toISOString(),request,hits,coverage:{passages:docs.length,sources:new Set(docs.map(d=>d.spec.kind==="scripture"?d.spec.book:d.spec.kind==="early"?d.spec.id:"supplied-text")).size,semantic:dense.length,returned:hits.length,notes:[...notes,`At most ${limit} distinct passages/sections are returned. Omitted candidates have not been assessed by Jev. Similarity scores are not evidence of support, influence, or agreement. English evaluation remains experimental.`]},issues,status:issues.length?"incomplete":"retrieved",attempts:0,inputTokens:0,outputTokens:0,model:MODEL,rubric:FIND_RUBRIC};
    this.save(run);return run;
  }
  async evaluate(id:string,options:{key?:string;fetcher?:typeof fetch;signal?:AbortSignal;offline?:boolean}){
    const run=this.read(id),budget={attempts:run.attempts,limit:500};
    if (run.hits.length > 20) throw new Error("Benchmark pools cannot be assessed as a batch. Select at most 20 candidates.");
    if(run.model!==MODEL||run.rubric!==FIND_RUBRIC)throw new Error("Search model/rubric changed. Start a new search.");
    for(const h of run.hits)verifyBlock(h.block,this.root);
    const client=new JevClient({cache:path.join(this.local,"find-cache"),...options,key:options.key??loadKey(),budget,onAttempt:()=>{run.attempts=budget.attempts;this.save(run);},onUsage:(i,o)=>{run.inputTokens+=i;run.outputTokens+=o;this.save(run);}});
    let cursor=0;
    const worker=async()=>{while(cursor<run.hits.length && !options.signal?.aborted){
      const h=run.hits[cursor++];delete h.error;
      try{
        if(h.block.language!=="en")throw new Error("Non-English evaluation is unvalidated.");
        verifyBlock(h.block,this.root);
        const request={model:MODEL,state:{query:run.request.query,candidate:{passage:h.block.text,context:h.block.context,edition:h.block.edition,role:h.block.role}},questions:findQuestions};
        const result=await client.evaluateRequest(request,fingerprint({request,block:h.block,rubric:FIND_RUBRIC}),validateRelevance);
        verifyBlock(h.block,this.root);h.judgment=result.reply;h.cached=result.cached;
      }catch(e){delete h.judgment;h.error=(e as Error).message;}
      this.save(run);
    }};
    await Promise.all([worker(),worker()]);
    run.status=!run.issues.length && run.hits.length>0 && run.hits.every(h=>h.judgment&&!h.error) && !options.signal?.aborted?"complete":"incomplete";
    this.save(run);return run;
  }
  async connect(id:string,sourceId:string,options:{key?:string;fetcher?:typeof fetch;signal?:AbortSignal}){
    const search=this.read(id),left=search.hits.find(h=>h.block.id===sourceId)?.block;
    if(!left)throw new Error("Select a passage from this search.");
    verifyBlock(left,this.root);
    const units:Unit[]=[...search.hits].sort(compareEvidenceRelevance).filter(h=>h.block.id!==sourceId).slice(0,4).map(h=>({id:fingerprint({left:left.id,right:h.block.id}),task:"relationship",left,right:h.block}));
    const run:Run={schemaVersion:1,id:`find-map-${randomUUID()}`,createdAt:new Date().toISOString(),model:MODEL,rubric:RUBRIC_VERSION,status:"incomplete",planned:units.length,attempts:0,usage:{inputTokens:0,outputTokens:0,meteredResponses:0},coverage:{sourceBlocks:1,targetBlocks:units.length,shortlistedPairs:units.length,explicitPairs:0,scope:"Four other passages from the current search shortlist; not an exhaustive connection scan. Context windows retain the original editions. Model suggestions require editorial review."},issues:[],outcomes:units.map(unit=>({unit,status:"incomplete",fingerprint:unitFingerprint(unit),exactMatch:left.text.includes(unit.right.text)||unit.right.text.includes(left.text),cached:false,milliseconds:0}))};
    const dir=path.join(this.local,"runs",run.id),budget={attempts:0,limit:12};
    const client=new JevClient({cache:path.join(this.local,"responses"),...options,key:options.key??loadKey(),budget,onAttempt:()=>{run.attempts=budget.attempts;saveRun(run,dir);},onUsage:(i,o)=>{run.usage!.inputTokens+=i;run.usage!.outputTokens+=o;run.usage!.meteredResponses++;}});
    saveRun(run,dir);let cursor=0;
    const worker=async()=>{while(cursor<run.outcomes.length&&!options.signal?.aborted){const o=run.outcomes[cursor++],start=performance.now();try{
      verifyBlock(left,this.root);verifyBlock(o.unit.right,this.root);
      if([left,o.unit.right].some(b=>b.language!=="en"))throw new Error("Non-English evaluation is unvalidated.");
      const {reply,cached}=await client.evaluate(o.unit);
      verifyBlock(left,this.root);verifyBlock(o.unit.right,this.root);
      Object.assign(o,{status:"complete",answer:reply.answers.judgment,cached,model:reply.model,inputTokens:reply.usage.input_tokens,outputTokens:reply.usage.output_tokens});
    }catch(e){o.error=(e as Error).message;}o.milliseconds=performance.now()-start;saveRun(run,dir);}};
    await Promise.all([worker(),worker()]);run.status=run.outcomes.length>0&&run.outcomes.every(o=>o.status==="complete")?"complete":"incomplete";saveRun(run,dir);
    search.connections={from:sourceId,runId:run.id,outcomes:run.outcomes};this.save(search);return search;
  }
}
