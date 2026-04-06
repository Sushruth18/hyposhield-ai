import { motion } from 'framer-motion';
import { User, FileText, Calendar, Stethoscope, Droplets, Upload, Edit2, Activity, Heart, AlertCircle } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EditOnboardingForm } from '@/components/onboarding/EditOnboardingForm';

interface ProfileData {
  // Status
  id?: string;
  onboarding_completed?: boolean;

  // Stage 1
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;

  // Stage 2
  diabetes_type?: string | null;
  diagnosis_date?: string | null;
  years_since_diagnosis?: number | null;
  insulin_usage?: boolean;
  insulin_type?: string | null;
  insulin_dosage_range?: string | null;
  insulin_schedule?: string[];
  hba1c?: number | null;
  insulin_regimen?: string | null;

  // Stage 3
  monitoring_mode?: string | null;
  cgm_brand?: string | null;
  reading_frequency?: string | null;
  last_glucose?: number | null;

  // Stage 4
  meal_times?: Record<string, string> | null;
  skip_meals?: boolean;
  diet_type?: string | null;
  activity_level?: string | null;
  exercise_frequency?: string | null;
  sleep_start_time?: string | null;
  sleep_end_time?: string | null;

  // Stage 5
  hypo_frequency?: string | null;
  hypo_timing?: string[];
  alert_preference?: string | null;
  risk_today?: string | null;

  // Stage 6
  medical_summary?: string | null;
  prescription_summary?: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getRiskColor = (risk: string | null | undefined) => {
    if (!risk) return '';
    if (risk === 'LOW') return 'text-success';
    if (risk === 'MEDIUM') return 'text-warning';
    if (risk === 'HIGH') return 'text-destructive';
    return '';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <main className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <main className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold mb-6">
            <Edit2 className="inline h-6 w-6 text-primary mr-2" />Edit Profile
          </motion.h1>

          <GlassCard>
            <EditOnboardingForm
              userId={user?.id || ''}
              initialData={profile}
              onSuccess={() => {
                setIsEditing(false);
                fetchProfile();
              }}
              onCancel={() => setIsEditing(false)}
            />
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      <main className="pt-20 pb-10 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-bold">
            <User className="inline h-6 w-6 text-primary mr-2" />Profile
          </motion.h1>
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Key Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Personal Details */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4">👤 Personal Details</h2>
              <div className="space-y-3">
                <InfoRow label="Name" value={profile?.full_name || 'Not specified'} />
                <InfoRow label="Age" value={profile?.age ? `${profile.age} years` : 'Not specified'} />
                <InfoRow label="Gender" value={profile?.gender || 'Not specified'} />
                <InfoRow label="Weight" value={profile?.weight ? `${profile.weight} kg` : 'Not specified'} />
                <InfoRow label="Email" value={user?.email || 'Not available'} />
              </div>
            </GlassCard>

            {/* Current Status */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" /> Current Status
              </h2>
              <div className="space-y-3">
                <InfoRow label="Last Glucose" value={profile?.last_glucose ? `${profile.last_glucose} mg/dL` : 'Not recorded'} />
                <InfoRow label="HbA1c" value={profile?.hba1c ? `${profile.hba1c}%` : 'Not recorded'} />
                <InfoRow label="Risk Today" value={profile?.risk_today || 'Not assessed'} valueClass={getRiskColor(profile?.risk_today)} />
              </div>
            </GlassCard>
          </div>

          {/* Middle Column - Health Profile */}
          <div className="lg:col-span-1 space-y-6">
            {/* Diabetes Profile */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" /> Diabetes Profile
              </h2>
              <div className="space-y-3">
                <InfoRow label="Type" value={profile?.diabetes_type || 'Not specified'} />
                <InfoRow label="Years Since Diagnosis" value={profile?.years_since_diagnosis ? `${profile.years_since_diagnosis} years` : 'Not specified'} />
                <InfoRow label="On Insulin" value={profile?.insulin_usage ? 'Yes' : 'No'} />
                {profile?.insulin_usage && (
                  <>
                    <InfoRow label="Insulin Type" value={profile?.insulin_type || 'Not specified'} />
                    <InfoRow label="Daily Dosage" value={profile?.insulin_dosage_range || 'Not specified'} />
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">Injection Times:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile?.insulin_schedule && profile.insulin_schedule.length > 0 ? (
                          profile.insulin_schedule.map((time: string) => (
                            <span key={time} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">
                              {time}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Not specified</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Monitoring Mode */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Monitoring
              </h2>
              <div className="space-y-3">
                <InfoRow label="Mode" value={profile?.monitoring_mode || 'Not specified'} />
                {profile?.monitoring_mode === 'CGM' && (
                  <InfoRow label="CGM Brand" value={profile?.cgm_brand || 'Not specified'} />
                )}
                {profile?.monitoring_mode === 'Manual' && (
                  <InfoRow label="Readings/Day" value={profile?.reading_frequency || 'Not specified'} />
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column - Lifestyle & Risk */}
          <div className="lg:col-span-1 space-y-6">
            {/* Lifestyle */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4">🏃 Lifestyle</h2>
              <div className="space-y-3">
                <InfoRow label="Activity Level" value={profile?.activity_level || 'Not specified'} />
                <InfoRow label="Exercise" value={profile?.exercise_frequency || 'Not specified'} />
                <InfoRow label="Diet Type" value={profile?.diet_type || 'Not specified'} />
                <InfoRow label="Skips Meals" value={profile?.skip_meals ? 'Yes' : 'No'} />
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Sleep:</p>
                  <p className="text-xs">
                    {profile?.sleep_start_time && profile?.sleep_end_time
                      ? `${profile.sleep_start_time} to ${profile.sleep_end_time}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Risk Profile */}
            <GlassCard>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" /> Risk Profile
              </h2>
              <div className="space-y-3">
                <InfoRow label="Hypo Frequency" value={profile?.hypo_frequency || 'Not specified'} />
                {profile?.hypo_timing && profile.hypo_timing.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hypo Timing:</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.hypo_timing.map((timing: string) => (
                        <span key={timing} className="bg-warning/20 text-warning text-xs px-2 py-1 rounded">
                          {timing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <InfoRow label="Alert Preference" value={profile?.alert_preference || 'Not specified'} />
              </div>
            </GlassCard>

            {/* Medical Data */}
            {(profile?.medical_summary || profile?.prescription_summary) && (
              <GlassCard>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Medical Data
                </h2>
                <div className="space-y-3">
                  {profile?.medical_summary && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Diagnosis Summary:</p>
                      <p className="text-xs text-muted-foreground">{profile.medical_summary}</p>
                    </div>
                  )}
                  {profile?.prescription_summary && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Medications:</p>
                      <p className="text-xs text-muted-foreground">{profile.prescription_summary}</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueClass || ''}`}>{value}</span>
    </div>
  );
}
