import ts from 'typescript'
import {execFileSync} from 'node:child_process'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\.(ts|tsx|js|mjs|cjs)$/.test(f)),issues=[]
for(const file of files){
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true)
 for(const error of source.parseDiagnostics)issues.push({file,rule:'syntax',message:ts.flattenDiagnosticMessageText(error.messageText,' ')})
 if(!/^(src|backend|electron)\//.test(file)||/\.test\./.test(file))continue
 const flag=(node,rule)=>issues.push({file,line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,rule})
 function visit(node){
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='eval')flag(node,'no-eval')
  if(ts.isNewExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='Function')flag(node,'no-function-constructor')
  if(ts.isJsxAttribute(node)&&node.name.getText(source)==='dangerouslySetInnerHTML')flag(node,'no-raw-react-html')
  if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isPropertyAccessExpression(node.left)&&['innerHTML','outerHTML'].includes(node.left.name.text))flag(node,'no-raw-dom-html')
  ts.forEachChild(node,visit)
 }visit(source)
}
mkdirSync('artifacts',{recursive:true});const report={status:issues.length?'FAIL':'PASS',files:files.length,rules:['syntax','no-eval','no-function-constructor','no-raw-react-html','no-raw-dom-html'],scope:'Repository safety lint; not comprehensive ESLint/style or data-flow analysis',issues};writeFileSync('artifacts/lint.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(issues.length)process.exitCode=1
