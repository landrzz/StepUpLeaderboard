import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyaddbjgwxwlmaybfvvw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95YWRkYmpnd3h3bG1heWJmdnZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE1NDg1MSwiZXhwIjoyMDY5NzMwODUxfQ.iCwKkJfYOSdOHKnQjKFhfhWVzOUUjGjkKKmPdEHGGEI'; // This is the service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: 'Test User'
      }
    });

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: testpassword123');
      console.log('User ID:', data.user.id);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestUser();
