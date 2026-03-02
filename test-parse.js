function parseTaskLine(line) {
  // Simple check: does line have strikethrough AND checkmark?
  const isCompleted = line.includes('~~') && line.includes('✅');

  if (!isCompleted) {
    console.log('Not completed');
    return null; //  Not a completed task
  }

  // Extract ID (first ~~ID~~ pattern)
  const idMatch = line.match(/~~([A-Z]+-\d+)~~/);
  if (!idMatch) {
    console.log('No ID match');
    return null;
  }

  const id = idMatch[1];

  // Split by pipes and clean up (DON'T filter empty parts!)
  const parts = line.split('|').map(p => p.trim());

  console.log('Parts length:', parts.length);
  if (parts.length < 7) {
    console.log('Too few parts');
    return null;
  }

  const description = parts[2].replace(/~~/g, ''); // Remove strikethrough markers
  const commit = parts[6] || '';
  const source = parts[7] || '';

  return {
    id,
    description,
    effort: parts[3],
    priority: parts[4],
    commit,
    source,
    isComplete: true
  };
}

const line = '| ~~DEV-1~~ | ~~Onboarding middleware fix (middleware.ts TODO — disabled, blocks resume)~~ | 1h | 🔴 Critical | ✅ | | audit:smooth-floating-mountain |';
const result = parseTaskLine(line);
console.log('Result:', JSON.stringify(result, null, 2));
