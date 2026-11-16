import {lessons} from '../lessons'
import {activitiesFor} from '../interactive/content'
import {activityResult} from '../interactive/model'
import {ready,type Attempt,type LessonState} from '../domain'
export function skillEvidence(id:string,states:LessonState[],attempts:Attempt[]){
 const lesson=lessons.find(l=>l.id===id);if(!lesson)throw new Error('مهارة غير معروفة')
 const state=states.find(s=>s.id===id),activities=activitiesFor(lesson)
 const practice=activities.filter(a=>state?.interactions?.[a.id]&&activityResult(a,state.interactions[a.id]).complete).length
 const scores=attempts.filter(a=>a.lessonId===id).map(a=>a.score),best=scores.length?Math.max(...scores):0
 const application=!!state&&ready(state.assignment,state.checked,lesson.rubric)
 return {id,practice,totalActivities:activities.length,best,hasAttempt:!!scores.length,application,earnedCompletion:!!state?.completed,percent:Math.round(best*.4+(practice/activities.length)*40+(application?20:0)),trained:best>=70&&practice===activities.length&&application}
}
