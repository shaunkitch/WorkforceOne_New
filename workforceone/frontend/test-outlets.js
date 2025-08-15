const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testOutlets() {
  console.log('Testing outlets table access...');
  
  try {
    // Test 1: Simple select all
    const { data: allOutlets, error: allError } = await supabase
      .from('outlets')
      .select('*')
      .limit(5);
    
    if (allError) {
      console.error('Error fetching all outlets:', allError);
    } else {
      console.log('All outlets (sample):', allOutlets);
      if (allOutlets && allOutlets.length > 0) {
        console.log('Sample outlet:', allOutlets[0]);
        console.log('Outlet columns:', Object.keys(allOutlets[0]));
      }
    }

    // Test 2: Get specific outlet IDs
    const { data: visits, error: visitsError } = await supabase
      .from('outlet_visits')
      .select('outlet_id')
      .not('outlet_id', 'is', null)
      .limit(5);

    if (!visitsError && visits) {
      const outletIds = visits.map(v => v.outlet_id);
      console.log('Testing with outlet IDs:', outletIds);

      const { data: specificOutlets, error: specificError } = await supabase
        .from('outlets')
        .select('id, name, address')
        .in('id', outletIds);

      if (specificError) {
        console.error('Error fetching specific outlets:', specificError);
      } else {
        console.log('Specific outlets:', specificOutlets);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testOutlets();