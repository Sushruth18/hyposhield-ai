-- Add onboarding fields to profiles table
alter table public.profiles
add column if not exists gender text,
add column if not exists weight numeric(6,1),
add column if not exists diabetes_type text,
add column if not exists years_since_diagnosis integer,
add column if not exists insulin_usage boolean,
add column if not exists insulin_type text,
add column if not exists insulin_dosage_range text,
add column if not exists insulin_schedule text[],
add column if not exists monitoring_mode text,
add column if not exists cgm_brand text,
add column if not exists reading_frequency text,
add column if not exists meal_times jsonb,
add column if not exists diet_type text,
add column if not exists skip_meals boolean,
add column if not exists activity_level text,
add column if not exists exercise_frequency text,
add column if not exists sleep_start_time text,
add column if not exists sleep_end_time text,
add column if not exists hypo_frequency text,
add column if not exists hypo_timing text[],
add column if not exists alert_preference text,
add column if not exists medical_summary text,
add column if not exists prescription_summary text,
add column if not exists onboarding_completed boolean default false;

-- Add constraints for new fields
alter table public.profiles
add constraint profiles_gender_check check (gender in ('Male', 'Female', 'Other', null)),
add constraint profiles_diabetes_type_check check (diabetes_type in ('Type 1', 'Type 2', null)),
add constraint profiles_insulin_type_check check (insulin_type in ('Rapid-acting', 'Long-acting', 'Both', null)),
add constraint profiles_monitoring_mode_check check (monitoring_mode in ('CGM', 'Manual', 'Lifestyle only', null)),
add constraint profiles_reading_frequency_check check (reading_frequency in ('1-2', '3-4', '5+', null)),
add constraint profiles_diet_type_check check (diet_type in ('Veg', 'Non-veg', 'Mixed', null)),
add constraint profiles_activity_level_check check (activity_level in ('Low', 'Moderate', 'High', null)),
add constraint profiles_exercise_frequency_check check (exercise_frequency in ('Daily', 'Few times a week', 'Rare', null)),
add constraint profiles_hypo_frequency_check check (hypo_frequency in ('Rare', 'Weekly', 'Frequent', null)),
add constraint profiles_alert_preference_check check (alert_preference in ('Early warnings', 'Balanced', 'Minimal alerts', null));

-- Create index for onboarding_completed for faster queries
create index if not exists profiles_onboarding_completed_idx on public.profiles (onboarding_completed);
