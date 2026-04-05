import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Brain, Clock, Utensils, Syringe, ChevronRight, BarChart3, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';

const features = [
  { icon: Brain, title: 'AI Prediction Engine', desc: 'Multi-mode prediction using CGM, manual, or lifestyle data with explainable AI.' },
  { icon: Activity, title: 'Real-Time Monitoring', desc: 'Track glucose trends, insulin timing, and meal patterns in one dashboard.' },
  { icon: Clock, title: 'Early Warning', desc: 'Get alerts 30-90 minutes before a hypoglycaemic event occurs.' },
  { icon: Utensils, title: 'Smart Meal Tracking', desc: 'Indian-optimized food database with automatic carb calculation.' },
  { icon: Syringe, title: 'Insulin Intelligence', desc: 'Log rapid & long-acting insulin with timing-aware risk analysis.' },
  { icon: BarChart3, title: 'Weekly Risk Logs', desc: 'Detailed explanations for each daily risk event, not just charts.' },
];

const steps = [
  { num: '01', title: 'Input Your Data', desc: 'Log glucose, insulin, meals, and activity through our intuitive interface.' },
  { num: '02', title: 'AI Analyzes Risk', desc: 'Our engine calculates risk scores across 6 clinical factors in real-time.' },
  { num: '03', title: 'Get Predictions', desc: 'Receive 30/60/90-minute forecasts with confidence levels and explanations.' },
  { num: '04', title: 'Take Action', desc: 'Follow personalized recommendations to prevent hypoglycaemia.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            <span className="text-lg font-bold text-gradient">HypoShield AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gradient-primary text-primary-foreground font-semibold rounded-xl">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-primary mb-6">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Hypoglycaemia Prevention
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Predict Hypo
              <br />
              <span className="text-gradient">Before It Happens</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              HypoShield AI uses glucose trends, insulin timing, meal patterns, and activity data
              to predict and prevent low blood sugar events — up to 90 minutes in advance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gradient-primary text-primary-foreground font-semibold rounded-xl px-8 text-base">
                  Start Free <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-xl px-8 text-base border-border text-foreground hover:bg-secondary">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-16 glass rounded-3xl p-1 glow max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DemoCard icon={<Heart className="h-5 w-5 text-success" />} label="Risk Level" value="LOW" sub="Score: 3/15" color="text-success" />
              <DemoCard icon={<Activity className="h-5 w-5 text-primary" />} label="Glucose" value="112 mg/dL" sub="Stable trend" color="text-primary" />
              <DemoCard icon={<Brain className="h-5 w-5 text-warning" />} label="Next 30 min" value="SAFE" sub="87% confidence" color="text-warning" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-center mb-4"
          >
            Intelligent <span className="text-gradient">Features</span>
          </motion.h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Everything you need to stay ahead of hypoglycaemia, powered by explainable AI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="h-full">
                  <f.icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
            How It <span className="text-gradient">Works</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <GlassCard>
                  <span className="text-3xl font-bold text-primary/30">{s.num}</span>
                  <h3 className="text-lg font-semibold mt-2 mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <GlassCard glow className="py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Protect Yourself?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of diabetic patients using AI to prevent hypoglycaemia before it happens.
            </p>
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-primary-foreground font-semibold rounded-xl px-10 text-base">
                Get Started Free
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>HypoShield AI</span>
          </div>
          <p>© {new Date().getFullYear()} HypoShield AI. Predictive healthcare for everyone.</p>
        </div>
      </footer>
    </div>
  );
}

function DemoCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="glass rounded-xl p-4 text-left">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
