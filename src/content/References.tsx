import registry from './provenance.json' with {type:'json'}
export {registry as sourceRegistry}
export function LessonReferences({lessonId}:{lessonId:string}){
 const record=registry.lessons.find(item=>item.id===lessonId)
 if(!record)return null
 return <details><summary>المراجع وحدود استخدامها</summary>
  <p>مراجعة تحريرية آلية ثانية بتاريخ {record.reviewedAt}. لم تنفذ مراجعة بشرية مستقلة. الأمثلة عراقية افتراضية وليست نتائج سوق موثقة.</p>
  <ul>{record.references.map(ref=>{const source=registry.sources.find(item=>item.id===ref.sourceId)!;return <li key={ref.sourceId}>
   <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.author}
   <p>{ref.claim} · {ref.locator}</p><small>{source.access} · فحص {source.checkedAt}</small>
   <details><summary>الحقوق والنطاق</summary><p>{source.rights}</p><p>{source.use}</p><a href={source.rightsURL} target="_blank" rel="noreferrer">شروط استخدام {source.title}</a></details>
  </li>})}</ul>
  <p>التطبيق الأصلي في هذا الدرس: {record.originalWork}. الصياغة والحسابات والأنشطة ليست نقلًا للكتب أو ترجمة معتمدة للمراجع، ولا تعني الإحالة تأييد الجهات للأكاديمية.</p>
  <details><summary>موارد تعلم إضافية</summary><p>روابط للتصفح البشري؛ ليست مصادر مستوردة لتأليف المنهج. قد يتطلب المورد تسجيلًا، وتختلف شروط إتاحته واستخدامه.</p><ul>{registry.sources.filter(s=>s.scope.startsWith('مورد إضافي')).map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><p>{s.rights}</p></li>)}</ul></details>
 </details>
}
