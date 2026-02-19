const fs = require('fs');
const content = fs.readFileSync('TASKS.md', 'utf8');
const lines = content.split('\n');

let active = 0, done = 0;
let critical = 0, high = 0, medium = 0, low = 0;
let ready = 0, backlog = 0, blocked = 0;
let doneTable = 0;

for (const line of lines) {
  const isStruck = /^\| ~~[A-Z]+-\d+/.test(line);
  const isDoneRow = /^\| ✅/.test(line);
  const isTaskRow = /^\| [A-Z]+-\d+/.test(line);

  if (isTaskRow && !isStruck && !isDoneRow) {
    active++;
    if (line.includes('🔴')) critical++;
    if (line.includes('🟠')) high++;
    if (line.includes('🟡')) medium++;
    if (line.includes('⚪')) low++;
    if (line.includes('🟢')) ready++;
    if (line.includes('📦')) backlog++;
    if (line.includes('🔒')) blocked++;
  }
  if (isStruck) done++;
  if (isDoneRow) doneTable++;
}

console.log('Active:', active, '| Done/Merged inline:', done, '| Done table:', doneTable);
console.log('Priority - Critical:', critical, '| High:', high, '| Medium:', medium, '| Low:', low, '| Sum:', critical+high+medium+low);
console.log('Status - Ready:', ready, '| Backlog:', backlog, '| Blocked:', blocked, '| Sum:', ready+backlog+blocked);
console.log('Grand total (active + inline done):', active + done);
