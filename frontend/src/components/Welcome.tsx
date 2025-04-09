import React, { useEffect, useRef, useState } from 'react';
import {
  FormInput,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Brain,
  FileCheck,
  FileOutput,
  Wand2,
  Megaphone,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Store,
  Leaf,
  Lightbulb,
  Timer,
  Gauge,
  Settings,
  BarChart,
  CheckCircle,
  Zap,
  BarChart3,
  LinkIcon,
  Palette,
  Cpu,
  Globe,
  Menu,
  X,
  PlayCircle,
  Shield,
  Loader
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import Dashboard from './Dashboard';
import { useTheme } from '../lib/theme';
import { useNavigate } from 'react-router-dom';
import '../styles/index.css';


const ScrollNav = ({ activeSection }: { activeSection: string }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate()
  const { user } = useAuth()

  const { loading, themeLoading } = useTheme();

  // If user is logged in, show dashboard instead
  if (user && !themeLoading) {
    return <Dashboard />;
  }

  if (themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-12 w-12 text-secondary animate-spin" />
      </div>
    );
  }


  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-200/20">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-20">
          <div className="text-2xl font-bold text-brand-green flex items-center gap-2">
            <img src="/goformlogo.svg" alt="Logo" className="h-32 w-auto" />
            
          </div>

          <button
            className="md:hidden p-2 text-brand-green"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={`nav-link ${activeSection === 'features' ? 'text-brand-green' : ''}`}>Features</a>
            <a href="#usecases" className={`nav-link ${activeSection === 'usecases' ? 'text-brand-green' : ''}`}>Use Cases</a>
            <a href="#why" className={`nav-link ${activeSection === 'why' ? 'text-brand-green' : ''}`}>Why GoForms</a>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary">
              Get Started
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4`}>
          <div className="flex flex-col gap-4">
            <a href="#features"
              className={`nav-link block py-2 ${activeSection === 'features' ? 'text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}>
              Features
            </a>
            <a href="#usecases"
              className={`nav-link block py-2 ${activeSection === 'usecases' ? 'text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}>
              Use Cases
            </a>
            <a href="#why"
              className={`nav-link block py-2 ${activeSection === 'why' ? 'text-brand-green' : ''}`}
              onClick={() => setIsMenuOpen(false)}>
              Why GoForms
            </a>
            <button className="btn-primary w-full justify-center" onClick={() => setIsMenuOpen(false)}>
              Get Started
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const ProcessSlider = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    {
      number: 1,
      icon: Wand2,
      title: "Design Your Form",
      description: "Create beautiful, intelligent forms with our no-code builder",
      items: [
        "Drag and drop form elements effortlessly",
        "Add conditional logic and scoring rules",
        "Choose from pre-built templates or start fresh"
      ],
      tagline: "No coding required - just pure creativity",
      imageUrl: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=800&q=80"
    },
    {
      number: 2,
      icon: Brain,
      title: "Set Up Smart Processing",
      description: "Define how your form processes and evaluates responses",
      items: [
        "Create custom scoring algorithms",
        "Set up automated response categorization",
        "Configure instant feedback rules"
      ],
      tagline: "Let AI handle the heavy lifting",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
    },
    {
      number: 3,
      icon: FileOutput,
      title: "Configure Outputs",
      description: "Define what happens after form submission",
      items: [
        "Generate custom PDFs and reports",
        "Send personalized email responses",
        "Integrate with your favorite tools"
      ],
      tagline: "From submission to action in seconds",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="relative">
      <div className="absolute top-1/2 -translate-y-1/2 -left-4 z-10">
        <button
          onClick={prevStep}
          className="process-nav-button group"
          aria-label="Previous step"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-4 z-10">
        <button
          onClick={nextStep}
          className="process-nav-button group"
          aria-label="Next step"
        >
          <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="process-slider">
        <div className="flex items-center gap-8">
          <div className="w-1/2 space-y-8 fade-up">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="step-number">{step.number}</div>
                <div className="step-icon-wrapper">
                  <Icon className="text-brand-green" size={24} />
                </div>
              </div>
              <h3 className="text-4xl font-bold leading-tight">{step.title}</h3>
              <p className="text-xl text-gray-600 leading-relaxed">{step.description}</p>
            </div>

            <ul className="space-y-4">
              {step.items.map((item, index) => (
                <li key={index} className="step-list-item group">
                  <div className="step-check-icon">
                    <CheckCircle className="text-brand-green" size={20} />
                  </div>
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>

            <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-4 py-2 rounded-xl text-brand-orange">
              <Sparkles size={16} />
              <p className="text-lg font-medium">{step.tagline}</p>
            </div>
          </div>

          <div className="w-1/2">
            <img
              src={step.imageUrl}
              alt={step.title}
              className="step-image w-full fade-up"
              loading="lazy"
            />
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`process-dot ${index === currentStep ? 'active' : ''}`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, items, tagline }: {
  icon: any;
  title: string;
  description: string;
  items: string[];
  tagline?: string;
}) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 group">
            <div className="bg-brand-green/10 p-1.5 rounded-lg group-hover:bg-brand-green/20 transition-colors duration-300 mt-1">
              <CheckCircle className="text-brand-green" size={14} />
            </div>
            <span className="text-gray-600">{item}</span>
          </li>
        ))}
      </ul>
      {tagline && (
        <p className="mt-6 text-sm font-medium text-brand-orange">{tagline}</p>
      )}
    </div>
  );
};

function Welcome() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            const sectionId = entry.target.getAttribute('id');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-up, .fade-in, section[id]').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-brand-green/5 to-white welcome-layout-wrapper">
        <ScrollNav activeSection={activeSection} />

        <section id="hero" className="relative pt-32 pb-24 overflow-hidden">
          <div className="hero-gradient" />
          <div className='max-w-7xl mx-auto'>
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-brand-green/10 px-6 py-3 rounded-full text-brand-green mb-8 hover-lift">
                  <Sparkles size={20} />
                  <span className="font-medium">From Clicks to Clarity, In Seconds</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 leading-tight fade-up">
                  Say goodbye to boring forms,
                  <span className="text-gradient"> hello to GoForms</span>
                </h1>

                <p className="text-xl text-gray-600 mb-12 leading-relaxed fade-up max-w-3xl mx-auto">
                  Your all-in-one, no-code platform where forms aren't just data collectors.
                  Transform your data collection into an engaging experience.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 fade-up">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary">
                    Get Started Free
                    <ArrowRight size={20} />
                  </button>
                  <button className="btn-secondary">
                    Watch Demo
                    <PlayCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-white">
          <div className='max-w-7xl mx-auto'>
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-brand-green/10 px-6 py-3 rounded-full text-brand-green mb-8 hover-lift">
                  <Brain size={20} />
                  <span className="font-medium">Intelligent Form Processing</span>
                </div>
                <h2 className="section-title fade-up">
                  A mini-brain that scores, evaluates, & delivers customized value. Instantly.
                </h2>
                <p className="section-subtitle fade-up">
                  We turn your everyday form into a smart assistant that knows what to say back.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                  icon={FormInput}
                  title="No-Code Forms"
                  description="Create intelligent forms without writing a single line of code."
                  items={[
                    "Drag-and-drop builder",
                    "Smart conditional logic",
                    "Dynamic field validation",
                    "Custom scoring rules"
                  ]}
                  tagline="Build in minutes, not days"
                />

                <FeatureCard
                  icon={Brain}
                  title="Smart Processing"
                  description="Let AI handle the heavy lifting of form processing."
                  items={[
                    "Automated scoring",
                    "Response categorization",
                    "Intelligent routing",
                    "Pattern recognition"
                  ]}
                  tagline="Intelligence built-in"
                />

                <FeatureCard
                  icon={FileOutput}
                  title="Instant Outputs"
                  description="Generate professional documents automatically."
                  items={[
                    "Custom PDF generation",
                    "Dynamic reports",
                    "Branded templates",
                    "Multi-format export"
                  ]}
                  tagline="From data to documents, instantly"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-32 bg-gradient-to-b from-white to-brand-green/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(36,76,60,0.1),transparent_70%)]" />
          <div className='max-w-7xl mx-auto'>
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-brand-green/10 px-6 py-3 rounded-full text-brand-green mb-8 hover-lift">
                  <Sparkles size={20} />
                  <span className="font-medium">Three Simple Steps</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 fade-up">
                  How GoForms <span className="text-gradient">Works</span>
                </h2>
                <p className="text-xl text-gray-600 mb-4 fade-up max-w-3xl mx-auto">
                  Transform your form-building experience with our intuitive process
                </p>
              </div>

              <div className="max-w-6xl mx-auto px-8">
                <ProcessSlider />
              </div>

              <div className="mt-24 text-center">
                <button className="demo-button group">
                  <PlayCircle className="demo-icon" />
                  <div className="text-left">
                    <h3 className="text-xl font-semibold mb-1">See it in action</h3>
                    <p className="text-gray-600">Watch our 2-minute demo</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="usecases" className="py-24 bg-gradient-to-b from-white to-brand-green/5">
          <div className='max-w-7xl mx-auto'>
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-brand-orange/10 px-6 py-3 rounded-full text-brand-orange mb-8 hover-lift">
                  <Users size={20} />
                  <span className="font-medium">Trusted Across Industries</span>
                </div>
                <h2 className="section-title fade-up">Transform Any Process</h2>
                <p className="section-subtitle fade-up">
                  From HR to Education, Marketing to Healthcare - GoForms adapts to your needs
                </p>
              </div>

              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Megaphone,
                    title: "Marketing",
                    items: ["Lead magnets", "Product match", "Audience profiling"]
                  },
                  {
                    icon: Users,
                    title: "HR",
                    items: ["Candidate screening", "Culture fit", "Onboarding"]
                  },
                  {
                    icon: GraduationCap,
                    title: "Education",
                    items: ["Course assessment", "Student feedback", "Learning paths"]
                  },
                  {
                    icon: Heart,
                    title: "Healthcare",
                    items: ["Patient intake", "Health assessment", "Care planning"]
                  }
                ].map((useCase, index) => (
                  <div key={useCase.title}
                    className="feature-card fade-up"
                    style={{ transitionDelay: `${index * 100}ms` }}>
                    <div className="feature-icon">
                      <useCase.icon className="text-white" size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
                    <ul className="space-y-3">
                      {useCase.items.map(item => (
                        <li key={item} className="flex items-center gap-2">
                          <div className="bg-brand-green/10 p-1.5 rounded-lg">
                            <CheckCircle className="text-brand-green" size={14} />
                          </div>
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="py-24 bg-gradient-to-br from-brand-green to-brand-blue text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-3 rounded-full text-white mb-8 hover-lift">
                  <Sparkles size={20} />
                  <span className="font-medium">Why Choose GoForms?</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 fade-up">
                  Collect info & turn it into impact
                </h2>
                <p className="text-xl text-white/80 fade-up">
                  Because your forms should do more than just collect data
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    description: "From form to insight in seconds"
                  },
                  {
                    icon: Brain,
                    title: "AI-Powered",
                    description: "Smart processing built right in"
                  },
                  {
                    icon: Users,
                    title: "User-Friendly",
                    description: "No technical skills needed"
                  },
                  {
                    icon: Shield,
                    title: "Secure",
                    description: "Enterprise-grade security"
                  }
                ].map((feature, index) => (
                  <div key={feature.title}
                    className="glass-card p-8 fade-up"
                    style={{ transitionDelay: `${index * 100}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="bg-brand-orange w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 hover-scale">
                        <feature.icon className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-white/80">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-16 glass-card p-12 fade-up">
                <h3 className="text-3xl font-bold mb-6">Ready to transform your forms?</h3>
                <p className="text-xl text-white/80 mb-8">
                  Join thousands of businesses already using GoForms to create
                  smarter, more engaging experiences.
                </p>
                <button
                  onClick={() => navigate('/quiz/sample')}
                  className="btn-primary bg-white text-brand-green hover:bg-white/90 mx-auto">
                  Start Free Trial
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
      <footer className="bg-white border-t border-gray-200">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/goformlogo.svg" alt="Logo" className="h-32 w-auto" />
              {/* <span className="text-xl font-bold text-brand-green">GoForms</span> */}
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-gray-600 hover:text-brand-green transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-brand-green transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-brand-green transition-colors">Contact</a>
            </div>
            <div className="text-gray-600">
              © {new Date().getFullYear()} GoForms. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Welcome;







































// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Brain,
//   ArrowRight,
//   CheckCircle2,
//   BarChart3,
//   Target,
//   Users,
//   Star,
//   ArrowUpRight,
//   FileQuestion,
//   ClipboardList,
//   FileEdit
// } from 'lucide-react';
// import { useAuth } from '../lib/auth';
// import Dashboard from './Dashboard';
// import Footer from './Footer';
// import { useTheme } from '../lib/theme';

// export default function Welcome() {
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const {loading, themeLoading} = useTheme();

//   // If user is logged in, show dashboard instead
//   if (user && !themeLoading) {
//     return <Dashboard />;
//   }

// if(themeLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//       </div>
//     );
// }

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section */}
//       <div className="relative bg-gradient-to-r from-primary via-primary to-primary text-white">
//         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=2070')] bg-cover bg-center mix-blend-overlay opacity-20 pointer-events-none"></div>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
//           <div className="text-center max-w-3xl mx-auto">
//             <h1 className="text-4xl md:text-6xl font-bold mb-6">
//               Transform Your Marketing Strategy with Data-Driven Insights
//             </h1>
//             <p className="text-xl md:text-2xl mb-8 text-accent">
//               Get a comprehensive assessment of your marketing performance and unlock actionable strategies for growth.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={() => navigate('/quiz/sample')}
//                 className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors flex items-center justify-center"
//               >
//                 Take Free Assessment
//                 <ArrowRight className="w-5 h-5 ml-2" />
//               </button>
//               <button
//                 className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-secondary transition-colors flex items-center justify-center"
//                 onClick={() => navigate('/auth')}
//               >
//                 Create Account
//                 <ArrowUpRight className="w-5 h-5 ml-2" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Features Section */}
//       <div className="py-24 bg-background">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-text mb-4">
//               All-in-One Platform for Forms & Quizzes
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//               Create, distribute, and analyze forms and quizzes with our comprehensive toolkit
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <FileQuestion className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Interactive Quizzes</h3>
//               <p className="text-gray-600">
//                 Create engaging quizzes with multiple question types, automatic scoring, and detailed analytics.
//               </p>
//               <button
//                 onClick={() => navigate('/admin/quizzes')}
//                 className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
//               >
//                 Explore Quizzes
//                 <ArrowRight className="ml-1 h-4 w-4" />
//               </button>
//             </div>

//             {/* <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <ClipboardList className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Form Templates</h3>
//               <p className="text-gray-600">
//                 Choose from hundreds of professionally designed form templates for any purpose or industry.
//               </p>
//               <button
//                 onClick={() => navigate('/forms/templates')}
//                 className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
//               >
//                 Browse Templates
//                 <ArrowRight className="ml-1 h-4 w-4" />
//               </button>
//             </div> */}

//             <div className="bg-accent rounded-xl p-8 hover:bg-accent transition-colors">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <FileEdit className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Custom Reports</h3>
//               <p className="text-gray-600">
//                 Generate professional reports with customizable templates and dynamic content.
//               </p>
//               <button
//                 onClick={() => navigate('/admin/reports')}
//                 className="mt-4 text-secondary hover:text-primary font-medium inline-flex items-center"
//               >
//                 View Reports
//                 <ArrowRight className="ml-1 h-4 w-4" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Benefits Section */}
//       <div className="py-24 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-text mb-4">
//               Unlock Your Marketing Potential
//             </h2>
//             <p className="text-xl text-gray-600">
//               Get actionable insights and personalized recommendations
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <BarChart3 className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Performance Analysis</h3>
//               <p className="text-gray-600">
//                 Get detailed insights into your marketing metrics and understand what's working and what needs improvement.
//               </p>
//             </div>

//             <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <Target className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Strategic Recommendations</h3>
//               <p className="text-gray-600">
//                 Receive personalized recommendations to optimize your marketing strategy and achieve better results.
//               </p>
//             </div>

//             <div className="bg-background rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow">
//               <div className="bg-secondary w-12 h-12 rounded-lg flex items-center justify-center mb-6">
//                 <Users className="h-6 w-6 text-white" />
//               </div>
//               <h3 className="text-xl font-semibold mb-4">Audience Insights</h3>
//               <p className="text-gray-600">
//                 Understand your target audience better with comprehensive demographic and behavioral analysis.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Assessment Process */}
//       <div className="bg-background py-24">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-text mb-4">
//               How It Works
//             </h2>
//             <p className="text-xl text-gray-600">
//               Get your personalized marketing assessment in three simple steps
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {[
//               {
//                 step: '1',
//                 title: 'Take Assessment',
//                 description: 'Complete our comprehensive marketing assessment questionnaire'
//               },
//               {
//                 step: '2',
//                 title: 'Get Analysis',
//                 description: 'Receive detailed analysis of your marketing performance'
//               },
//               {
//                 step: '3',
//                 title: 'Implement Changes',
//                 description: 'Follow actionable recommendations to improve your strategy'
//               }
//             ].map((item) => (
//               <div key={item.step} className="bg-background p-8 rounded-lg shadow-sm">
//                 <div className="flex items-center mb-4">
//                   <span className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold">
//                     {item.step}
//                   </span>
//                   <div className="h-1 flex-1 bg-accent ml-4"></div>
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
//                 <p className="text-gray-600">{item.description}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Testimonials */}
//       <div className="py-24 bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold text-text mb-4">
//               What Our Clients Say
//             </h2>
//             <p className="text-xl text-gray-600">
//               Join thousands of marketers who've improved their strategy with our assessment
//             </p>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {[1, 2, 3].map((i) => (
//               <div key={i} className="bg-background p-6 rounded-lg shadow-md">
//                 <div className="flex items-center mb-4">
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
//                   ))}
//                 </div>
//                 <p className="text-gray-600 mb-4 italic">
//                   "The marketing assessment provided invaluable insights that helped us optimize our strategy and increase ROI significantly."
//                 </p>
//                 <div className="flex items-center">
//                   <img
//                     src={`https://i.pravatar.cc/40?img=${i}`}
//                     alt="Avatar"
//                     className="w-10 h-10 rounded-full mr-3"
//                   />
//                   <div>
//                     <p className="font-medium text-text">Marketing Director</p>
//                     <p className="text-sm text-gray-500">Tech Company</p>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* CTA Section */}
//       <div className="bg-primary text-white py-24">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">
//             Ready to Transform Your Marketing Strategy?
//           </h2>
//           <p className="text-xl text-accent mb-8">
//             Take our free assessment and get personalized recommendations to improve your marketing performance
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button
//               className="px-8 py-4 bg-background text-primary rounded-lg font-semibold hover:bg-accent transition-colors"
//               onClick={() => navigate('/quiz/sample')}
//             >
//               Start Free Assessment
//             </button>
//             <button
//               className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary transition-colors"
//               onClick={() => navigate('/auth')}
//             >
//               Create Account
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }