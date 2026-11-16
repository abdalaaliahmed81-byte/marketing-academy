import type {Lesson} from '../curriculum'
import {miniProject} from './model'
import {download} from '../ui'
export function MiniProjectBrief({lesson,onTemplate}:{lesson:Lesson;onTemplate:(text:string)=>void}){
 const p=miniProject(lesson)
 return <details className="worked-example"><summary>مشروع الدرس المصغر · سيناريو وقالب وحل</summary><div className="stack reading">
  <h3>{p.title}</h3><p>تمرين تمهيدي للتكليف الأصلي؛ لا يكفي نسخ النموذج لإكمال متطلباته.</p><p><b>سيناريو محاكاة:</b> {p.scenario.name} — {p.scenario.offer}. {p.scenario.limit}.</p>
  <p><b>الهدف:</b> {p.task}</p><p><b>المتطلبات:</b> {p.prerequisites}</p><p><b>المواد:</b> {p.materials}</p><p>المفاهيم: {lesson.glossary.map(([term])=>term).join(' · ')}</p>
  <h4>المخرجات</h4><ul>{p.deliverables.map(d=><li key={d}>{d}</li>)}</ul><ol>{p.steps.map(s=><li key={s}>{s}</li>)}</ol>
  <details><summary>الحل المصغر الكامل</summary><p>{p.solution}</p></details>
  <button type="button" className="secondary" onClick={()=>onTemplate(p.template)}>أضف قالب المشروع المصغر إلى تطبيقي</button>
  <button type="button" className="secondary" onClick={()=>download(lesson.id+'-mini-project.md',['# '+p.title,'محاكاة تدريبية أصلية، وليست أداءً حقيقيًا.',p.task,p.prerequisites,p.materials,'## الخطوات',...p.steps,'## المخرجات',...p.deliverables,'## الحل',p.solution,'## القالب',p.template,'## التقييم الذاتي',...p.rubric,'## أخطاء وتحسين',...p.mistakes,p.advice].join('\n\n'),'text/markdown;charset=utf-8')}>نزّل دليل المشروع المصغر</button>
  <h4>معيار المراجعة الذاتية</h4><ul>{p.rubric.map(s=><li key={s}>{s}</li>)}</ul><h4>أخطاء وتحسين</h4><ul>{p.mistakes.map(s=><li key={s}>{s}</li>)}</ul><p>{p.advice}</p>
 </div></details>
}
