import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { EvidenceEngine, lexicalRanking, validateEvidenceQuery } from "../scripts/research/find-engine";
import { FIND_RUBRIC, validateRelevance } from "../scripts/research/find-rubric";
import { MODEL, RELATIONS } from "../scripts/research/types";
import { compareEvidenceRelevance, RELEVANCE, type EvidenceHit, type EvidenceRun } from "../src/lib/evidence-explorer";
import { findSearchHref } from "../src/lib/site/find-text";
import { loadSource } from "../scripts/research/sources";
import { writeJson } from "../scripts/research/storage";
import { exportReviewed, reviewRun } from "../scripts/research/workflow";
import { loadShard } from "../src/lib/scriptures/client";
import { StaticJsonError } from "../src/lib/staticJsonClient";

test("text submission preserves query and translation independent of suggestions",()=>{
  assert.equal(findSearchHref("kjv: charity",true),"/scriptures/find?q=charity&trans=kjv");
  assert.equal(findSearchHref("Jesus wept"),"/scriptures/search?q=Jesus%20wept&trans=web");
  assert.throws(()=>validateEvidenceQuery({query:"x",scope:"file:/etc/passwd",translation:"web"}));
  assert.throws(()=>validateEvidenceQuery({query:"x",scope:"text",translation:"web",name:"a.txt",text:"x".repeat(32001)}));
});
test("lexical ranking protects whole phrases and preserves negative query terms",()=>{
  const docs=[{text:"Peter remembered that Jesus had spoken, and wept."},{text:"Jesus wept."},{text:"The writer said Jesus would not weep."}];
  assert.equal(lexicalRanking('"Jesus wept"',docs)[0].i,1);
  assert.equal(lexicalRanking("not",docs)[0].i,2);
  assert.equal(lexicalRanking("light",[{text:"Lightning flashed."}]).length,0);
});
const reply=()=>({model:MODEL,answers:{useful:{type:"noul",noul:.9},relation:{type:"choice",choice:"directly-relevant",confidence:.8,probabilities:Object.fromEntries(RELEVANCE.map(l=>[l,l==="directly-relevant"?.97:.01]))}},usage:{input_tokens:120,output_tokens:20}});
test("relevance validation rejects changed models, invalid distributions and usage",()=>{
  validateRelevance(reply());
  assert.throws(()=>validateRelevance({...reply(),model:"other"}));
  const invalid=reply();invalid.answers.useful.noul=NaN;assert.throws(()=>validateRelevance(invalid));
  const wrong=reply();wrong.answers.relation.probabilities.unrelated=.8;assert.throws(()=>validateRelevance(wrong));
  assert.throws(()=>validateRelevance({...reply(),usage:{input_tokens:-1,output_tokens:0}}));
});
test("search shard errors distinguish absent files from failures and remain retryable",async()=>{
  const prior=globalThis.fetch;let status=503;globalThis.fetch=async()=>new Response("failure",{status});
  try{
    await assert.rejects(loadShard("web","fixture503"),e=>e instanceof StaticJsonError && e.status===503);
    status=404;assert.deepEqual(await loadShard("web","fixture503"),{});
  }finally{globalThis.fetch=prior;}
});
test("fixture relevance, cache, source freshness, connection review and approved-only export",async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"find-evidence-")),local=path.join(root,".research");
  fs.mkdirSync(local);const file=path.join(local,"source.txt");fs.writeFileSync(file,"A gentle answer calms anger.\n\nA harsh answer provokes anger.");
  const blocks=await loadSource({kind:"file",path:file},root);
  const run:EvidenceRun={id:"find-fixture",createdAt:new Date().toISOString(),request:{query:"gentle answers",scope:"text",translation:"web",name:"source.txt",text:fs.readFileSync(file,"utf8")},hits:blocks.map((block,i)=>({block,rank:i+1,phrase:false,channels:["Words"]})),coverage:{passages:blocks.length,sources:1,semantic:0,returned:blocks.length,notes:[]},issues:[],status:"retrieved",attempts:0,inputTokens:0,outputTokens:0,model:MODEL,rubric:FIND_RUBRIC};
  writeJson(path.join(local,"find",run.id+".json"),run);
  const engine=new EvidenceEngine(root,local);
  t.after(async()=>{await engine.dispose();fs.rmSync(root,{recursive:true,force:true});});
  let calls=0;
  const options={key:"fixture-placeholder",fetcher:async (_url: string | URL | Request,init?:RequestInit)=>{
    calls++;const request=JSON.parse(String(init?.body));assert.equal(request.model,MODEL);
    if(request.questions.judgment)return Response.json({model:MODEL,answers:{judgment:{type:"choice",choice:"thematic-overlap",confidence:.8,probabilities:Object.fromEntries(RELATIONS.map(l=>[l,l==="thematic-overlap"?.96:.01]))}},usage:{input_tokens:200,output_tokens:30}});
    assert.equal(request.state.query,"gentle answers");assert.ok(request.state.candidate.context);return Response.json(reply());
  }};
  const first=await engine.evaluate(run.id,options);assert.equal(first.status,"complete");assert.equal(calls,blocks.length);
  const second=await engine.evaluate(run.id,options);assert.equal(calls,blocks.length);assert.ok(second.hits.every(h=>h.cached));assert.equal(second.inputTokens,120*blocks.length);
  const connected=await engine.connect(run.id,blocks[0].id,options);assert.ok(connected.connections);
  const dir=path.join(local,"runs",connected.connections!.runId);
  assert.equal(exportReviewed(dir,root).findings.length,0);
  reviewRun(dir,connected.connections!.outcomes[0].unit.id,"accept","Fixture reviewer","Test approval only",root);
  assert.equal(exportReviewed(dir,root).findings.length,1);
  fs.writeFileSync(file,"Changed source.");
  await assert.rejects(engine.evaluate(run.id,options),/Stale source/);assert.throws(()=>exportReviewed(dir,root),/Stale source/);
});
test("missing credentials and invalid replies produce incomplete results",async t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"find-incomplete-")),local=path.join(root,".research");fs.mkdirSync(local);
  const file=path.join(local,"source.txt");fs.writeFileSync(file,"A source paragraph.");
  const [block]=await loadSource({kind:"file",path:file},root);
  const run:EvidenceRun={id:"find-failure",createdAt:"now",request:{query:"source",scope:"text",translation:"web"},hits:[{block,rank:1,phrase:true,channels:["Words"]}],coverage:{passages:1,sources:1,semantic:0,returned:1,notes:[]},issues:[],status:"retrieved",attempts:0,inputTokens:0,outputTokens:0,model:MODEL,rubric:FIND_RUBRIC};
  writeJson(path.join(local,"find",run.id+".json"),run);const engine=new EvidenceEngine(root,local);
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const missing=await engine.evaluate(run.id,{key:"",fetcher:async()=>{throw Error("Must not call");}});
  assert.equal(missing.status,"incomplete");assert.match(missing.hits[0].error!,/missing/);
  const invalid=await engine.evaluate(run.id,{key:"fixture-placeholder",fetcher:async()=>Response.json({model:MODEL})});
  assert.equal(invalid.status,"incomplete");assert.equal(invalid.hits[0].judgment,undefined);
});

test("non-WEB research searches use native edition text without borrowing WEB locations", async t => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"find-native-edition-")),local=path.join(root,".research");
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  // Deliberately omit model/vector files: DRB-only wording search must not load them.
  const drb=JSON.parse(fs.readFileSync("public/scriptures/text/drb/PSA.json","utf8"));
  writeJson(path.join(root,"public/scriptures/text/drb/PSA.json"),drb);
  writeJson(path.join(root,"public/scriptures/canons.json"),JSON.parse(fs.readFileSync("public/scriptures/canons.json","utf8")));
  const engine=new EvidenceEngine(root,local);
  t.after(()=>engine.dispose());
  const run=await engine.search({query:"The Lord ruleth me",scope:"scripture",translation:"drb"});
  assert.equal(run.hits[0]?.block.source.kind,"scripture");
  assert.equal(run.hits[0]?.block.title,"PSA 22:1");
  assert.match(run.hits[0]?.block.text ?? "",/The Lord ruleth me/);
  assert.ok(run.hits.every(h=>h.block.edition.includes("drb") || h.block.source.kind === "scripture" && h.block.source.translation === "drb"));
  assert.equal(run.coverage.semantic,0);
  assert.match(run.coverage.notes.join(" "),/meaning retrieval is unavailable in this edition/);
  assert.deepEqual(run.issues,[]);
});

test("Jev review order agrees with displayed labels even when helpfulness estimates disagree", () => {
  const hit = (rank: number, choice: typeof RELEVANCE[number], useful: number) => ({rank, judgment:{...reply(), answers:{...reply().answers, useful:{type:"noul",noul:useful},relation:{...reply().answers.relation,choice}}}} as EvidenceHit);
  const direct = hit(4,"directly-relevant",.6), indirect = hit(1,"indirectly-relevant",.99);
  const context = hit(3,"insufficient-context",.9), unrelated = hit(2,"unrelated",.98);
  const stronger = hit(5,"directly-relevant",.8);
  const pending = {rank:0} as EvidenceHit;
  assert.deepEqual([pending,indirect,unrelated,direct,context,stronger].sort(compareEvidenceRelevance).map(h=>h.rank),[5,4,1,3,2,0]);
  assert.ok(compareEvidenceRelevance(hit(1,"directly-relevant",.6),direct)<0);
});
