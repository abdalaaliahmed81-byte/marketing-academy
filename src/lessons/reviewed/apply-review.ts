import type {Lesson} from '../../curriculum'
import m01 from './module01.json' with {type:'json'}
import m02 from './module02.json' with {type:'json'}
import m04 from './module04.json' with {type:'json'}
import m05 from './module05.json' with {type:'json'}
import m06 from './module06.json' with {type:'json'}
import m07 from './module07.json' with {type:'json'}
import m08 from './module08.json' with {type:'json'}
import m09 from './module09.json' with {type:'json'}
import m10 from './module10.json' with {type:'json'}
import m11 from './module11.json' with {type:'json'}
import m12 from './module12.json' with {type:'json'}
import assessment from './assessment-v2.json' with {type:'json'}
type Depth={extension:string[];miniCase:string;summary:string}
const depth:Record<string,Depth>={...m01,...m02,...m04,...m05,...m06,...m07,...m08,...m09,...m10,...m11,...m12}
const revisions:Record<string,{prompt?:string;options:string[];why?:string}>=assessment
export function applyEditorialReview(item:Lesson):Lesson{
 const extra=depth[item.id]
 return {...item,...(extra?{reading:[...item.reading,...extra.extension],miniCase:extra.miniCase,summary:extra.summary}:{}),
  // All examples are original simulations, including examples that previously omitted this label.
  example:'محاكاة تعليمية عراقية — '+item.example,
  reading:[...item.reading,...(extra?.extension??[])].map(p=>p.replace('العنوان القانوني canonical','الرابط الأساسي canonical')),
  questions:item.questions.map(q=>{const revision=revisions[q.id];return revision?{...q,prompt:revision.prompt??q.prompt,why:revision.why??q.why,options:q.options.map((o,i)=>({...o,label:revision.options[i]}))}:q})
 }
}
