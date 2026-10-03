import test from 'node:test';
import assert from 'node:assert/strict';
import {metrics,validateCaseKinds,type RetrievalCase} from '../scripts/benchmarks/run-retrieval';
import {semanticCandidateBooks,type SemanticManifest} from '../src/lib/scriptures/semantic';
test('unsupported benchmark groups fail before they can be counted as misses',()=>{
 const cases=[{id:'early-p',corpus:'early',kind:'paraphrase'},{id:'early-tail',corpus:'early',kind:'exact-tail'},{id:'web-p',corpus:'web',kind:'paraphrase'}] as RetrievalCase[];
 assert.doesNotThrow(()=>validateCaseKinds(cases));
 for(const entry of [{id:'web-tail',corpus:'web',kind:'exact-tail'},{id:'unknown-corpus',corpus:'other',kind:'paraphrase'},{id:'unknown-kind',corpus:'early',kind:'other'}]){
  assert.throws(()=>validateCaseKinds([entry] as RetrievalCase[]),/Unsupported evaluation corpus\/kind/);
 }
});
test('known-target metrics count missing and below-cutoff targets as failures',()=>{
 assert.deepEqual(metrics([1,2,10,11,null]),{cases:5,hitAt1:1,hitAt5:2,hitAt10:3,mrrAt10:0.32});
 assert.equal(metrics([]).mrrAt10,0);
});
test('legacy diagnostic funnel selects at most fourteen books from the top forty-eight chapters',()=>{
 const chapterIndex=Array.from({length:60},(_,i)=>[`B${Math.floor(i/4)}`,i%4+1] as [string,number]);
 const manifest={dims:1,chapterIndex} as SemanticManifest;
 assert.equal(semanticCandidateBooks([1],manifest,new Int8Array(60).fill(1),"narrow").length,12);
 const distinct={dims:1,chapterIndex:chapterIndex.map(([,c],i)=>[`B${i}`,c])} as SemanticManifest;
 assert.equal(semanticCandidateBooks([1],distinct,new Int8Array(60).fill(1),"narrow").length,14);
 assert.throws(()=>semanticCandidateBooks([1],manifest,new Int8Array(1)));
});

test('public default covers every indexed book, independently of centroid rank', () => {
 const verseCounts=Object.fromEntries(Array.from({length:81},(_,i)=>[`B${i}`,10]));
 const manifest={dims:1,chapterIndex:Object.keys(verseCounts).map(b=>[b,1]),verseCounts} as SemanticManifest;
 assert.deepEqual(semanticCandidateBooks([1],manifest,new Int8Array(81).fill(1)),Object.keys(verseCounts));
});
