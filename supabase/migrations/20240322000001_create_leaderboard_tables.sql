-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_active boolean DEFAULT true
);

-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    avatar_url text,
    joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_active boolean DEFAULT true,
    UNIQUE(group_id, user_id)
);

-- Create weekly_challenges table
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    week_start_date date NOT NULL,
    week_end_date date NOT NULL,
    week_number integer NOT NULL,
    year integer NOT NULL,
    title text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    is_active boolean DEFAULT true,
    UNIQUE(group_id, week_number, year)
);

-- Create leaderboard_entries table
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id uuid REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
    participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
    steps integer NOT NULL DEFAULT 0,
    distance_km decimal(10,2) DEFAULT 0,
    points integer NOT NULL DEFAULT 0,
    rank integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(challenge_id, participant_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participants_group_id ON public.participants(group_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_group_id ON public.weekly_challenges(group_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_week ON public.weekly_challenges(week_number, year);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_challenge_id ON public.leaderboard_entries(challenge_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_participant_id ON public.leaderboard_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON public.leaderboard_entries(rank);

-- Enable realtime for all tables
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table weekly_challenges;
alter publication supabase_realtime add table leaderboard_entries;

-- Insert sample data for demo purposes
INSERT INTO public.groups (id, name, description, created_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Step Challenge', 'Sample group for demonstration purposes', now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample participants
INSERT INTO public.participants (id, group_id, name, email, avatar_url) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Sarah Johnson', 'sarah@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Mike Chen', 'mike@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Emma Davis', 'emma@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'James Wilson', 'james@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Lisa Brown', 'lisa@example.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa')
ON CONFLICT (id) DO NOTHING;

-- Insert sample weekly challenge
INSERT INTO public.weekly_challenges (id, group_id, week_start_date, week_end_date, week_number, year, title) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '2024-01-15', '2024-01-21', 3, 2024, 'Week 3 Challenge')
ON CONFLICT (id) DO NOTHING;

-- Insert sample leaderboard entries
INSERT INTO public.leaderboard_entries (challenge_id, participant_id, steps, distance_km, points, rank) VALUES 
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 15847, 12.3, 158, 1),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 14523, 11.8, 145, 2),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 13891, 11.1, 139, 3),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 12456, 9.8, 125, 4),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 11234, 8.9, 112, 5)
ON CONFLICT (challenge_id, participant_id) DO NOTHING;
