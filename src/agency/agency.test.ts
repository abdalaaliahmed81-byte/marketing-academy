import {afterEach,expect,it} from 'vitest'
import {agencyClients,agencyMarkdown,newAgencyProject,simulateCampaign,workedAgencyProject} from './model'
import {agencyProjectSchema,agencySchema} from './schema'
import {AcademyDB,appendModuleToPortfolio,exportBackup,restoreBackup,saveAgencyProject,saveProject} from '../db'
import {normalizeState} from '../data-schema'
import {learningPortfolioMarkdown} from '../project-learning/model'
let a:AcademyDB|undefined,b:AcademyDB|undefined
afterEach(async()=>{await a?.delete();await b?.delete();a=undefined;b=undefined})
it('computes the worked restaurant scenario with exact money and explicit synthetic totals',()=>{
 const r=simulateCampaign(newAgencyProject('restaurant'))
 expect(r.synthetic).toBe(true);expect(r.variants[0]).toMatchObject({spend:12000,impressions:3000,clicks:60,orders:6,revenue:48000,contribution:7200,cpc:200,cpa:2000,roas:4})
 expect(r.variants[1]).toMatchObject({spend:12000,impressions:3000,clicks:45,orders:9,revenue:72000,contribution:16800})
 expect(r.total).toMatchObject({spend:24000,orders:15,revenue:120000,variableCost:72000,contribution:24000,roas:5});expect(r.candidate).toBe('B');expect(r.ctrDifferencePoints).toBeCloseTo(-.5)
 for(const k of ['spend','impressions','clicks','orders'] as const)expect(r.days.reduce((sum,d)=>sum+d[k],0)).toBe(r.total[k])
})
it('handles zero/odd budgets, rounding, capacity and invalid inputs without invented results',()=>{
 const p=newAgencyProject('clothing'),r=simulateCampaign(p);expect(r.variants[1]).toMatchObject({orders:12,uncappedOrders:13,capacityLimited:true});expect(r.total.orders).toBeLessThanOrEqual(24)
 const zero=simulateCampaign({...p,budget:0});expect(zero.total).toMatchObject({orders:0,spend:0,cpa:null,cpc:null,roas:null,ctr:null});expect(zero.ctrDifferencePoints).toBeNull()
 expect(simulateCampaign({...p,ctrA:0,ctrB:0}).total).toMatchObject({orders:0,cpc:null,cpa:null,roas:0,contribution:-36000})
 expect(simulateCampaign({...p,budget:1}).variants.map(v=>v.spend)).toEqual([0,1])
 for(const patch of [{budget:-1},{budget:1.5},{cpm:0},{ctrA:101},{cvrB:NaN},{clientId:'real-client'}])expect(()=>simulateCampaign({...p,...patch})).toThrow()
 // Platform/targeting describe a plan; they do not secretly change numerical assumptions.
 expect(simulateCampaign({...p,platform:'google',audience:'intent'})).toEqual(r)
})
it('provides three original worked clients and bounded completion without automatic awards',()=>{
 for(const c of agencyClients){const p=workedAgencyProject(c.id);expect(p.copyA.split('\n').slice(1)).toEqual(p.copyB.split('\n').slice(1));expect(p.completed).toBe(false);expect(p.checked).toEqual([]);expect(agencyProjectSchema.parse({...p,checked:[0,1,2,3],completed:true}).completed).toBe(true);const report=agencyMarkdown(p);expect(report).toContain('بيانات اصطناعية');expect(report).toContain('لا عشوائية');expect(report).toContain('الاستهداف والاستبعاد')}
 expect(()=>agencyProjectSchema.parse({...newAgencyProject('restaurant'),completed:true})).toThrow();expect(()=>agencySchema.parse([newAgencyProject('restaurant'),newAgencyProject('restaurant')])).toThrow()
})
it('isolates client/account drafts, preserves capstone writes and includes agency in backup and portfolio',async()=>{
 a=new AcademyDB('agency-a-'+crypto.randomUUID());b=new AcademyDB('agency-b-'+crypto.randomUUID())
 const first=workedAgencyProject('restaurant');await saveAgencyProject(first,a);await saveAgencyProject(workedAgencyProject('clothing'),a)
 expect((await a.projects.get('portfolio'))!.agency).toHaveLength(2);expect(await b.projects.get('portfolio')).toBeUndefined()
 const base=(await a.projects.get('portfolio'))!;await saveProject({name:base.name,business:base.business,fields:{story:'قصة متعلم محفوظة'}},base,a)
 await a.moduleProjects.put({id:'module-1',response:'تسليم أصلي محفوظ',checked:[],completed:false});await appendModuleToPortfolio('module-1','research',a)
 const project=(await a.projects.get('portfolio'))!;expect(project.agency).toHaveLength(2);expect(project.fields.story).toBe('قصة متعلم محفوظة');expect(learningPortfolioMarkdown(project,[],[])).toContain('ملحق الوكالة الافتراضية')
 const snapshot=await exportBackup(a);expect(normalizeState(snapshot).projects[0].agency).toHaveLength(2)
 a.close();await a.open();expect((await a.projects.get('portfolio'))!.agency![0].brief).toBe(first.brief)
 await restoreBackup(snapshot,b);expect((await b.projects.get('portfolio'))!.agency).toEqual(project.agency)
})
it('does not erase a completed project with an invalid later edit',async()=>{
 a=new AcademyDB('agency-complete-'+crypto.randomUUID());const p={...workedAgencyProject('ecommerce'),checked:[0,1,2,3],completed:true};await saveAgencyProject(p,a)
 await expect(saveAgencyProject({...p,completed:false,analysis:''},a)).rejects.toThrow();expect((await a.projects.get('portfolio'))!.agency![0].completed).toBe(true)
})

it('exports user text as escaped Markdown while keeping editable source text intact',()=>{
 const p={...workedAgencyProject('restaurant'),brief:'<script>alert(1)</script> [link](javascript:alert(1))'}
 const report=agencyMarkdown(p);expect(report).not.toContain('<script>');expect(report).not.toContain('[link](javascript:');expect(p.brief).toContain('<script>')
})
