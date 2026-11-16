import {describe,expect,it} from 'vitest'
import {lessons} from '../lessons'
import {artifactFields,markdown} from '../domain'
import {businessCases,caseExamples,caseMetrics} from './cases'
import {miniProject,moduleGuide,projectMarkdown,capstoneMilestones,clientReport,learningPortfolioMarkdown} from './model'
describe('project-based curriculum and honest worked evidence',()=>{
 it('provides twelve complete guides and sixty worked mini-projects without paid prerequisites',()=>{
  for(let i=0;i<12;i++){
   const p=moduleGuide(i);expect(p.steps).toHaveLength(6);expect(p.worked.join(' ').length).toBeGreaterThan(1000);expect(p.prerequisites.length).toBeGreaterThan(20);expect(p.materials.length).toBeGreaterThan(20);expect(p.deliverables).toHaveLength(4);expect(p.rubric).toHaveLength(4);expect(p.mistakes).toHaveLength(2);expect(p.template).toContain(p.deliverables[0]);expect(projectMarkdown(i)).toContain('لا نتائج عميل حقيقية');expect(p.offlineProof).toContain('غير مطلوبة')
  }
  for(const lesson of lessons){const p=miniProject(lesson);expect(p.solution.length,lesson.id).toBeGreaterThan(180);expect(p.steps).toHaveLength(4);expect(p.deliverables).toHaveLength(2);expect(p.rubric).toEqual(lesson.rubric);expect(p.template).toContain(lesson.assignment);expect(p.materials).toContain('لا حساب إعلان');expect(p.mistakes).toHaveLength(3)}
 })
 it('gives all three business cases every portfolio field and traceable simulated economics',()=>{
  expect(caseExamples).toHaveLength(3)
  const results=businessCases.map(c=>caseMetrics(c).map(r=>[r.revenue,r.contribution,r.sensitivity]))
  expect(results).toEqual([[[48000,7200,4320],[64000,13600,9760]],[[100000,24000,18000],[150000,42000,33000]],[[54000,12000,8700],[108000,27000,20400]]])
  for(const example of caseExamples){expect(Object.keys(example.fields).sort()).toEqual(artifactFields.map(([id])=>id).sort());expect(example.fields.report).toContain('لم أنشر حملة فعلية');expect(example.fields.kpis).toContain('محاكاة');expect(markdown(example)).toContain('ليست أداءً حقيقيًا');expect(clientReport(example)).toContain('ليست نتائج عميل حقيقية')}
  const portfolio=learningPortfolioMarkdown(caseExamples[0],[{id:'m01-l01',assignment:'تطبيق خاص محفوظ',completed:false}],[{id:'module-1',response:'تسليم وحدة محفوظ',completed:true}]);expect(portfolio).toContain('تطبيق خاص محفوظ');expect(portfolio).toContain('تسليم وحدة محفوظ');expect(portfolio).toContain('مراجعة ذاتية')
  expect([...new Set(capstoneMilestones.flatMap(([,keys])=>[...keys]))].sort()).toEqual(artifactFields.map(([id])=>id).sort())
 })
})
