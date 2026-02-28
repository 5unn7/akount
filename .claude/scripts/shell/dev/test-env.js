const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root
const envPath = path.join(__dirname, '..', '..', '.env');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('❌ Failed to load .env:', result.error.message);
  process.exit(1);
}

console.log('✅ .env loaded successfully');
console.log('');
console.log('LINEAR_API_KEY exists:', !!process.env.LINEAR_API_KEY);
console.log('LINEAR_API_KEY length:', process.env.LINEAR_API_KEY?.length || 0);
console.log('LINEAR_API_KEY starts with "lin_api_":', process.env.LINEAR_API_KEY?.startsWith('lin_api_'));
console.log('');

if (!process.env.LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY not found in .env file');
  console.error('   Please add: LINEAR_API_KEY=lin_api_...');
  process.exit(1);
}

if (!process.env.LINEAR_API_KEY.startsWith('lin_api_')) {
  console.error('❌ LINEAR_API_KEY format looks wrong');
  console.error('   Should start with: lin_api_');
  process.exit(1);
}

console.log('✅ LINEAR_API_KEY is valid!');
