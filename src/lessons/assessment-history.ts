import previous from './assessment-v2-snapshot.json' with {type:'json'}
import legacy from './assessment-v1.json' with {type:'json'}
import type {Question} from '../curriculum'
export const CURRENT_ASSESSMENT=3 as const
export type AssessmentVersion=1|2|3
export function assessmentQuestions(lesson:{id:string;questions:Question[]},version:AssessmentVersion=CURRENT_ASSESSMENT):Question[]{
 if(version===3)return lesson.questions
 const questions=((version===2?previous:legacy) as Record<string,Question[]>)[lesson.id]
 if(!questions)throw new Error('نسخة التقييم غير معروفة.')
 return questions
}
