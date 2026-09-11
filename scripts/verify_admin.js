const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Failed to read env:', e);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('Connecting to Supabase:', supabaseUrl);
  
  // 1. List users
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error('Error listing auth users:', usersErr);
    return;
  }

  console.log(`Found ${usersData.users.length} auth users:`);
  for (const u of usersData.users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}`);
  }

  const targetUsers = usersData.users;
  console.log(`Verifying all ${targetUsers.length} accounts:`);

  for (const user of targetUsers) {
    console.log(`Processing: ${user.email} (${user.id})`);

    // 2. Update profile
    const { data: prof, error: profErr } = await supabase
      .from('profiles')
      .update({
        verification_status: 'approved',
        trust_level: 'custech_verified',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select();

    if (profErr) {
      console.error(`Error updating profile ${user.email}:`, profErr);
    } else {
      console.log(`Profile verified: ${user.email}`);
    }

    // 3. Upsert super_admin role
    const { data: roleData, error: roleErr } = await supabase
      .from('admin_roles')
      .upsert({
        user_id: user.id,
        role: 'super_admin'
      }, { onConflict: 'user_id,role' })
      .select();

    console.log(`Admin role upserted for ${user.email}:`, roleData, roleErr);

    // 4. Insert verification request
    await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        verification_method: 'manual',
        full_name: user.user_metadata?.full_name || 'Admin',
        phone: 'Admin Account',
        payment_status: 'success',
        payment_amount: 0,
        payment_reference: `WAIVED-ADMIN-${Date.now()}`,
        verification_status: 'approved',
        reviewed_at: new Date().toISOString(),
        student_info: { role: 'super_admin', fee_waived: true }
      });
  }

  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
}

run();
