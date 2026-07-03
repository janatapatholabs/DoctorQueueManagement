-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    is_present BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create queue table
CREATE TABLE public.queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    patient_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    serial_number INTEGER NOT NULL,
    status TEXT CHECK (status IN ('waiting', 'notified', 'completed', 'cancelled')) DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue ENABLE ROW LEVEL SECURITY;

-- Policies for Doctors table
-- Anyone can read doctors
CREATE POLICY "Enable read access for all users" ON public.doctors FOR SELECT USING (true);
-- Only authenticated users (receptionist) can manage doctors
CREATE POLICY "Enable insert for authenticated users only" ON public.doctors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON public.doctors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON public.doctors FOR DELETE TO authenticated USING (true);

-- Policies for Queue table
-- Anyone can read the queue (to see their position)
CREATE POLICY "Enable read access for all users on queue" ON public.queue FOR SELECT USING (true);
-- Anyone can insert into the queue (public registration)
CREATE POLICY "Enable insert for all users on queue" ON public.queue FOR INSERT WITH CHECK (true);
-- Only receptionists (authenticated users in the receptionists table) can update the queue status
CREATE POLICY "Enable update for receptionists only on queue" ON public.queue FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.receptionists WHERE user_id = auth.uid())
);

-- Create receptionists table
CREATE TABLE public.receptionists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for receptionists
ALTER TABLE public.receptionists ENABLE ROW LEVEL SECURITY;

-- Policies for receptionists table
CREATE POLICY "Enable read access for authenticated users" ON public.receptionists FOR SELECT TO authenticated USING (true);

-- Insert some dummy doctors to start with
INSERT INTO public.doctors (name, specialization, is_present) VALUES
('Dr. Smith', 'Gynecologist', false),
('Dr. Patel', 'Pediatrician', false),
('Dr. Lee', 'General Physician', true);
