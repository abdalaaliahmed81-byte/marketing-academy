export interface Question {
  id:string
  prompt:string
  options:{id:string; label:string}[]
  answer:string
  why:string
}

export const reviewDate = '2026-11-15'
export const sources = {
  analytics:{title:'Google Analytics · إعداد القياس',url:'https://support.google.com/analytics/answer/9304153'},
  consent:{title:'Google · سياسة موافقة المستخدم الأوروبي',url:'https://www.google.com/about/company/user-consent-policy/'},
  ads:{title:'Google Ads · تعريف معدل النقر',url:'https://support.google.com/google-ads/answer/2615875'},
  email:{title:'Google · إرشادات مرسلي البريد',url:'https://support.google.com/a/answer/81126'},
  ftc:{title:'FTC · الإفصاح عن العلاقة الإعلانية',url:'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers'},
  accessible:{title:'W3C · كتابة محتوى متاح للجميع',url:'https://www.w3.org/WAI/tips/writing/'},
  google:{title:'Google · Digital Marketing & E-commerce — Foundations',url:'https://grow.google/certificates/digital-marketing-ecommerce/'},
  hub:{title:'HubSpot Academy · Digital Marketing',url:'https://academy.hubspot.com/courses/digital-marketing'},
  meta:{title:'Meta Blueprint · دليل الجمهور',url:'https://www.facebookblueprint.com/student/catalog/'},
  skill:{title:'Google Skillshop · التدريب على القياس والإعلانات',url:'https://skillshop.withgoogle.com/'},
  seo:{title:'Google Search Central · دليل بدء تحسين البحث',url:'https://developers.google.com/search/docs/fundamentals/seo-starter-guide'},
  sem:{title:'Semrush Academy · البحث وتحليل المنافسين',url:'https://www.semrush.com/academy/'}
}
type Source = keyof typeof sources
export const modules = ['أساسيات التسويق الرقمي','بحث الجمهور والسوق','التعاطف والتموضع والعلامة','القصص وكتابة الإعلان','استراتيجية التواصل الاجتماعي','تسويق المحتوى','تحسين الظهور في البحث','البريد والاحتفاظ بالعملاء','الإعلانات المدفوعة','القياس والتحليلات','الاختبار والتحسين والأخلاقيات','الحملة وملف الأعمال']
export const books = {
  plan:'آلان ديب، خطة تسويقية في صفحة واحدة',
  marketing:'سيث جودين، هذا هو التسويق',
  stories:'سيث جودين، كل المسوقون يسردون قصصًا'
}
export const bookLinks = {
  plan:'https://allandib.com/',
  marketing:'https://www.penguinrandomhouse.com/books/600458/this-is-marketing-by-seth-godin/',
  stories:'https://seths.blog/2013/09/qa-all-marketers-and-the-challenge-of-telling-the-right-story/'
}
type Book = keyof typeof books
export interface Lesson {
  id:string
  module:1|2|3|4|5|6|7|8|9|10|11|12
  title:string
  goal:string
  reading:string[]
  example:string
  glossary:[string,string][]
  miniCase:string
  summary:string
  assignment:string
  mission:string
  rubric:string[]
  questions:Question[]
  refs:{book:Book;section:string}[]
  online:Source[]
}
type QuestionInput = [prompt:string,correct:string,wrong1:string,wrong2:string,why:string]
export type LessonInput = Omit<Lesson,'questions'> & {questions:QuestionInput[]}
export function lesson({questions,...data}:LessonInput):Lesson {
  return {...data,questions:questions.map(([prompt,correct,wrong1,wrong2,why],index)=>{
    const id = data.id + '-q' + (index+1)
    const options = [correct,wrong1,wrong2].map((label,i)=>({id:id+'-'+(i+1),label}))
    return {id,prompt,options,answer:options[0].id,why}
  })}
}
