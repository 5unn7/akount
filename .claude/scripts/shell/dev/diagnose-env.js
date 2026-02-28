const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing .env file issue...\n');

const envPath = path.join(__dirname, '..', '..', '.env');

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found at:', envPath);
  process.exit(1);
}

console.log('✅ .env file exists at:', envPath);

// Read the file
const content = fs.readFileSync(envPath, 'utf-8');
const lines = content.split('\n');

console.log(`📄 File has ${lines.length} lines\n`);

// Check for LINEAR_API_KEY
const linearLines = lines.filter(line => line.includes('LINEAR'));
console.log(`🔎 Lines containing "LINEAR": ${linearLines.length}`);

if (linearLines.length === 0) {
  console.error('\n❌ NO lines contain "LINEAR"');
  console.error('   The LINEAR_API_KEY variable is NOT in the .env file');
  console.error('\n   Please add this line to your .env file:');
  console.error('   LINEAR_API_KEY=lin_api_your_actual_key_here\n');
  process.exit(1);
}

// Check each LINEAR line
linearLines.forEach((line, idx) => {
  const lineNum = lines.indexOf(line) + 1;
  console.log(`\n  Line ${lineNum}:`);
  console.log(`    Length: ${line.length} chars`);
  console.log(`    Starts with #: ${line.trimStart().startsWith('#')}`);
  console.log(`    Has equals: ${line.includes('=')}`);

  if (line.trimStart().startsWith('#')) {
    console.log(`    ⚠️  This line is COMMENTED OUT (remove the #)`);
  }

  if (!line.includes('=')) {
    console.log(`    ⚠️  This line has NO equals sign (invalid format)`);
  }

  // Check for the specific variable
  if (line.trim().startsWith('LINEAR_API_KEY=')) {
    const value = line.split('=')[1];
    console.log(`    ✅ Found LINEAR_API_KEY`);
    console.log(`    Value length: ${value ? value.length : 0} chars`);
    console.log(`    Starts with "lin_api_": ${value?.trimStart().startsWith('lin_api_')}`);

    if (!value || value.trim() === '') {
      console.log(`    ❌ Value is EMPTY`);
    } else if (value.includes('"') || value.includes("'")) {
      console.log(`    ⚠️  Value has QUOTES (remove them)`);
    } else if (!value.trimStart().startsWith('lin_api_')) {
      console.log(`    ❌ Value doesn't start with "lin_api_" (wrong format)`);
    } else {
      console.log(`    ✅ Format looks correct!`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n💡 SOLUTION:\n');
console.log('Your .env file should have this EXACT format:\n');
console.log('LINEAR_API_KEY=lin_api_abc123xyz...');
console.log('LINEAR_TEAM_ID=\n');
console.log('Rules:');
console.log('  ✓ No quotes around the value');
console.log('  ✓ No spaces around the = sign');
console.log('  ✓ No # at the start of the line');
console.log('  ✓ Key must start with "lin_api_"');
console.log('  ✓ No trailing spaces or comments on the same line\n');
