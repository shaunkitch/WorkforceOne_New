const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationSystem() {
  try {
    console.log('🔄 Testing Notification System');
    console.log('='.repeat(50));
    
    // 1. Test database connection
    console.log('\n1. Testing database connection...');
    const { data: connectionTest, error: connError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (connError) {
      console.error('❌ Database connection failed:', connError);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check if notifications table exists and get schema
    console.log('\n2. Checking notifications table...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
      
    if (notifications && notifications.length > 0) {
      console.log('Current notification table columns:', Object.keys(notifications[0]));
      console.log('Sample notification:', notifications[0]);
    } else {
      console.log('No existing notifications found');
    }
      
    if (notifError) {
      console.error('❌ Notifications table access failed:', notifError);
      console.log('Note: You may need to create the notifications table first');
      return;
    }
    console.log('✅ Notifications table accessible');
    
    // 3. Get test user and organization
    console.log('\n3. Getting test user and organization...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, organization_id, email')
      .limit(5);
      
    if (profileError || !profiles || profiles.length === 0) {
      console.error('❌ No test profiles found:', profileError);
      return;
    }
    
    const testUser = profiles[0];
    console.log(`✅ Using test user: ${testUser.full_name} (${testUser.email})`);
    console.log(`   Organization ID: ${testUser.organization_id}`);
    
    // 4. Create a test notification directly
    console.log('\n4. Creating test notification...');
    const testNotification = {
      recipient_id: testUser.id,
      organization_id: testUser.organization_id,
      title: '🧪 Test Task Assignment',
      message: 'This is a test notification for the notification system implementation.',
      type: 'attendance',  // Using valid type from existing data
      priority: 'normal',
      metadata: {
        task_id: 'test_task_123',
        task_title: 'Test Task for Notification System',
        priority: 'normal',
        assigned_by: 'System Test',
        assignee_id: testUser.id,
        action_type: 'test_notification',
        notification_category: 'task_management'
      },
      is_read: false
    };
    
    const { data: createdNotification, error: createError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Failed to create test notification:', createError);
      return;
    }
    console.log('✅ Test notification created successfully');
    console.log(`   Notification ID: ${createdNotification.id}`);
    
    // 5. Test fetching unread notifications
    console.log('\n5. Testing fetch unread notifications...');
    const { data: unreadNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', testUser.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
      
    if (fetchError) {
      console.error('❌ Failed to fetch notifications:', fetchError);
      return;
    }
    console.log(`✅ Found ${unreadNotifications.length} unread notifications`);
    
    // 6. Test marking notification as read
    console.log('\n6. Testing mark notification as read...');
    const { error: markReadError } = await supabase
      .from('notifications')
      .update({ 
        is_read: true
      })
      .eq('id', createdNotification.id);
      
    if (markReadError) {
      console.error('❌ Failed to mark notification as read:', markReadError);
      return;
    }
    console.log('✅ Notification marked as read successfully');
    
    // 7. Test notification count
    console.log('\n7. Testing unread notification count...');
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', testUser.id)
      .eq('is_read', false);
      
    if (countError) {
      console.error('❌ Failed to get notification count:', countError);
      return;
    }
    console.log(`✅ Unread notification count: ${count}`);
    
    // 8. Check device tokens table
    console.log('\n8. Checking device tokens table...');
    const { data: deviceTokens, error: tokenError } = await supabase
      .from('device_tokens')
      .select('*')
      .eq('user_id', testUser.id)
      .limit(1);
      
    if (tokenError) {
      console.log('⚠️ Device tokens table not accessible or doesn\'t exist:', tokenError.message);
      console.log('   This is expected if the table hasn\'t been created yet');
    } else {
      console.log(`✅ Device tokens table accessible, found ${deviceTokens.length} tokens for user`);
    }
    
    // 9. Clean up test notification
    console.log('\n9. Cleaning up test notification...');
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', createdNotification.id);
      
    if (deleteError) {
      console.error('⚠️ Failed to clean up test notification:', deleteError);
    } else {
      console.log('✅ Test notification cleaned up');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Notification System Test Summary:');
    console.log('✅ Database connection working');
    console.log('✅ Notifications table accessible');
    console.log('✅ Can create notifications');
    console.log('✅ Can fetch unread notifications'); 
    console.log('✅ Can mark notifications as read');
    console.log('✅ Can get notification counts');
    console.log('\n💡 Next Steps:');
    console.log('1. Apply the database migration (072_task_assignment_notifications.sql) in Supabase Dashboard');
    console.log('2. Test task assignment scenarios');
    console.log('3. Test mobile app notification display');
    console.log('4. Verify push notification delivery');
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

// Run the test
testNotificationSystem();