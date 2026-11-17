import {z} from '../validation'
export const clientIds=['restaurant','clothing','ecommerce'] as const
const projectShape=z.object({version:z.literal(1),clientId:z.enum(clientIds),platform:z.enum(['meta','google']),audience:z.enum(['local','intent','broad']),budget:z.number().int().min(0).max(1_000_000),cpm:z.number().int().min(100).max(100_000),ctrA:z.number().min(0).max(100),ctrB:z.number().min(0).max(100),cvrA:z.number().min(0).max(100),cvrB:z.number().min(0).max(100),brief:z.string().max(10000),targeting:z.string().max(10000),copyA:z.string().max(10000),copyB:z.string().max(10000),landing:z.string().max(10000),analysis:z.string().max(10000),recommendation:z.string().max(10000),checked:z.array(z.number().int().min(0).max(3)).max(4).refine(v=>new Set(v).size===v.length),completed:z.boolean(),updatedAt:z.string().datetime()}).strict()
export type AgencyProject=z.infer<typeof projectShape>
export const agencyFields=['brief','targeting','copyA','copyB','landing','analysis','recommendation'] as const
export function completionIssues(p:AgencyProject){return [...agencyFields.filter(f=>p[f].trim().length<20).map(f=>'أكمل مخرجات المشروع بعشرين حرفًا على الأقل'),...(p.checked.length===4?[]:['أكمل بنود المراجعة الأربعة'])]}
export const agencyProjectSchema=projectShape.superRefine((p,ctx)=>{if(p.completed&&completionIssues(p).length)ctx.addIssue({code:'custom',message:'المشروع المكتمل يحتاج مخرجات وبنود مراجعة محفوظة.'})})
export const agencySchema=z.array(agencyProjectSchema).max(3).refine(rows=>new Set(rows.map(r=>r.clientId)).size===rows.length,'مشروع عميل مكرر')
