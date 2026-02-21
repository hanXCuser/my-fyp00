/**
 * Link existing deals to their pamphlets and update pamphlet titles
 * Run this script to populate pamphlet_id in deals table and titles in pamphlets table
 */

import { DatabaseService } from './database';

async function main() {
  console.log('🚀 Starting deal-pamphlet linking process...\n');
  
  const db = new DatabaseService();
  
  try {
    const result = await db.linkDealsTopamphlets();
    
    if (result.dealsUpdated === 0 && result.pamphletsUpdated === 0) {
      console.log('ℹ️  No updates needed - all deals and pamphlets are already linked');
    } else {
      console.log('🎉 Successfully completed linking process!');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

main();
