import {advanced} from './advanced'
import {foundations} from './foundations'
import {research} from './research'
export const lessons=[...foundations,...research,...advanced]
export const moduleReview=[
 'اختر مشروعًا وحدد جمهوره وهدفًا أسبوعيًا. اشرح قناة مجانية واحدة وماذا يحدث قبل الطلب وأثناءه وبعده. اختتم بقرار تحسين له مقياس.',
 'اجمع أدلة أو استخدم محاكاة موسومة. قارن شرائح وبدائل، واختر شخصية عميل. اكتب قرارًا يستند إلى دليل وفرضية تحتاج اختبارًا.'
,...Array.from({length:10},(_,i)=>'راجع أخطاء الوحدة '+(i+3)+'، ثم طبّق المفاهيم في مشروع الوحدة وقارن قرارك بالنموذج المحلول.')
]
