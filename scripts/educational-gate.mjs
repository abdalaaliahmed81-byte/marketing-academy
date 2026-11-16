import assert from 'node:assert/strict'
export function assertEducationalReadiness(readiness){
 assert.equal(readiness?.reviewedLessons,60,'G12: all60 lessons need recorded review.')
 assert.equal(readiness?.independentArabicReview,'completed','G12 remains OPEN: independent Arabic instructional review has not been evidenced.')
 assert.equal(readiness?.learnerValidation,'completed','G12 remains OPEN: learner validation has not been evidenced.')
 assert.equal(readiness?.professionalApproval,true,'G12 remains OPEN: agent review is not professional educational approval.')
 assert(typeof readiness?.independentReviewEvidence==='string'&&readiness.independentReviewEvidence.trim(),'G12: independent review evidence is required.')
}
export function assertPublicationReadiness(readiness,channel){
 assert(['preview','stable'].includes(channel),'Unknown release channel.')
 assert.equal(readiness?.agentEditorialReview,'completed','Agent editorial review is incomplete.')
 assert.equal(readiness?.reviewedLessons,60,'All60 lessons require recorded review.')
 // A preview discloses unverified educational approval; it never implies professional completion.
 if(channel==='stable')assertEducationalReadiness(readiness)
}
