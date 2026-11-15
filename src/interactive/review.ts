import type {Lesson,Question} from '../curriculum'
import {baghdadDay,type Attempt,type LessonState} from '../domain'
export interface ReviewItem {lesson:Lesson;question:Question;due:string;interval:number;streak:number;lastAt:string}
export function plusDays(day:string,count:number){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+count);return date.toISOString().slice(0,10)}
/** Wrong answers become due today. Successful retrieval spaces at1/3/7/14/30 days. */
export function reviewSchedule(lessons:Lesson[],attempts:Attempt[],states:LessonState[],now=new Date()):ReviewItem[]{
 const tracked=new Map<string,ReviewItem>(),questions=new Map(lessons.flatMap(lesson=>lesson.questions.map(question=>[question.id,{lesson,question}] as const)))
 const events=[...attempts.flatMap(a=>Object.entries(a.answers).map(([questionId,answer])=>({questionId,answer,at:a.at}))),...states.flatMap(s=>s.reviews??[])].sort((a,b)=>a.at.localeCompare(b.at))
 for(const event of events){const found=questions.get(event.questionId);if(!found)continue;const {lesson,question}=found
  const previous=tracked.get(question.id),correct=event.answer===question.answer
  if(correct&&(!previous||previous.due>baghdadDay(new Date(event.at))))continue
  const streak=correct?(previous?.streak??0)+1:0,interval=correct?[1,3,7,14,30][Math.min(streak-1,4)]:0
  tracked.set(question.id,{lesson,question,due:plusDays(baghdadDay(new Date(event.at)),interval),interval,streak,lastAt:event.at})
 }
 return [...tracked.values()].sort((a,b)=>a.due.localeCompare(b.due)||a.question.id.localeCompare(b.question.id))
}

export function reviewQueue(lessons:Lesson[],attempts:Attempt[],states:LessonState[],now=new Date()){return reviewSchedule(lessons,attempts,states,now).filter(item=>item.due<=baghdadDay(now))}
