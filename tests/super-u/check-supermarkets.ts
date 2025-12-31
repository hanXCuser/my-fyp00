import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSupermarkets() {
  console.log('🔍 Checking supermarkets in database...\n');
  
  const { data, error } = await supabase
    .from('supermarkets')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${data.length} supermarkets:\n`);
  data.forEach(s => {
    console.log(`  ID: ${s.id} - ${s.name} (${s.retailer})`);
    if (s.location) console.log(`     Location: ${s.location}`);
  });
}

checkSupermarkets().catch(console.error);
