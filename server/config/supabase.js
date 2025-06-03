const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase Configuration Error:');
  console.error('Missing required environment variables.');
  console.error('\nPlease create a .env file in the root directory with the following variables:');
  console.error(`
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
JWT_SECRET=your_jwt_secret_here
PORT=4000
NODE_ENV=development

You can find these values in your Supabase project settings:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Project Settings > API
4. Copy the "Project URL" as SUPABASE_URL
5. Copy the "anon public" key as SUPABASE_ANON_KEY
`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; 