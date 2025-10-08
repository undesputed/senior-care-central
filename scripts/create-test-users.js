// Script to create test users for development
// Run with: node scripts/create-test-users.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUsers() {
  console.log('Creating test users...');

  try {
    // Create test family user
    const { data: familyUser, error: familyError } = await supabase.auth.admin.createUser({
      email: 'family@test.com',
      password: 'TestPassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Family',
        role: 'family'
      }
    });

    if (familyError) {
      console.error('Error creating family user:', familyError);
    } else {
      console.log('✅ Family user created:', familyUser.user.email);
      
      // Create family record
      const { error: familyRecordError } = await supabase
        .from('families')
        .insert({
          user_id: familyUser.user.id,
          full_name: 'Test Family',
          phone_number: '+1234567890',
          preferred_contact_method: 'email'
        });

      if (familyRecordError) {
        console.error('Error creating family record:', familyRecordError);
      } else {
        console.log('✅ Family record created');
      }
    }

    // Create test provider user
    const { data: providerUser, error: providerError } = await supabase.auth.admin.createUser({
      email: 'provider@test.com',
      password: 'TestPassword123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Provider',
        role: 'provider'
      }
    });

    if (providerError) {
      console.error('Error creating provider user:', providerError);
    } else {
      console.log('✅ Provider user created:', providerUser.user.email);
      
      // Create agency record
      const { error: agencyRecordError } = await supabase
        .from('agencies')
        .insert({
          owner_id: providerUser.user.id,
          business_name: 'Test Care Agency',
          email: 'provider@test.com',
          status: 'draft'
        });

      if (agencyRecordError) {
        console.error('Error creating agency record:', agencyRecordError);
      } else {
        console.log('✅ Agency record created');
      }
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\nLogin credentials:');
    console.log('Family: family@test.com / TestPassword123');
    console.log('Provider: provider@test.com / TestPassword123');

  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();
