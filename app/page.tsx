import {
  FileText,
  Upload,
  Send,
  Shield,
  Clock,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Users,
  Building2,
  TrendingUp,
  Zap,
  Lock,
  Star,
  Camera,
  Mail,
  Briefcase,
  Calculator,
  Check,
  PenLine,
  FolderOpen,
  Palette,
  TableProperties,
  CalendarClock,
  FileSignature,
  LayoutDashboard,
  Layers,
} from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#141609] overflow-x-hidden">
      <Nav />
      <Hero />
      <LogoBar />
      <HowItWorks />
      <WorkflowTypes />
      <PhoneMockup />
      <Features />
      <Pricing />
      <PartnerCTA />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ─── Navigation ─── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#e5e7eb]/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#136334] flex items-center justify-center">
            <FileText className="h-[18px] w-[18px] text-white" />
          </div>
          <span className="font-bold text-[1.15rem] tracking-tight">
            Filezy
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[0.9rem] text-[#59626d]">
          <a href="#how-it-works" className="hover:text-[#141609] transition-colors">How it works</a>
          <a href="#features" className="hover:text-[#141609] transition-colors">Features</a>
          <a href="#pricing" className="hover:text-[#141609] transition-colors">Pricing</a>
          <a href="#partners" className="hover:text-[#141609] transition-colors">Partners</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-[0.9rem] font-medium text-[#59626d] hover:text-[#141609] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#136334] px-5 py-2.5 text-[0.875rem] font-medium text-white hover:bg-[#0f5029] transition-all active:scale-[0.98]"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative pt-20 pb-28 md:pt-28 md:pb-36">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#136334]/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#36c973]/[0.07] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#136334]/[0.08] px-4 py-1.5 mb-8">
            <div className="h-1.5 w-1.5 rounded-full bg-[#36c973] animate-pulse" />
            <span className="text-[0.8rem] font-medium text-[#136334]">
              Trusted by 500+ small businesses
            </span>
          </div>

          <h1 className="text-[3.25rem] md:text-[4.25rem] font-bold leading-[1.05] tracking-tight mb-6">
            Stop Chasing{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Onboarding{" "}
                <span className="relative inline-block">
                  Paperwork
                  <span className="absolute -bottom-[3px] -left-2 -right-2 h-4 bg-[#36c973]/20 -z-0 rounded-sm md:hidden" />
                </span>
              </span>
              <span className="absolute -bottom-[3px] -left-2 -right-2 h-4 bg-[#36c973]/20 -z-0 rounded-sm hidden md:block" />
            </span>
          </h1>

          <p className="text-[1.2rem] md:text-[1.35rem] leading-relaxed text-[#59626d] max-w-2xl mx-auto mb-10">
            Onboard new hires, collect client documents, or place workers at scale - with e-signatures, PDF fill, document vault, and white-label branding built in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#136334] px-8 py-4 text-[1rem] font-semibold text-white hover:bg-[#0f5029] transition-all active:scale-[0.98] shadow-lg shadow-[#136334]/20"
            >
              Start free
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-[1rem] font-semibold text-[#2d343d] border border-[#e5e7eb] hover:border-[#136334]/30 hover:bg-[#f3f5f8] transition-all"
            >
              See how it works
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-6 text-[0.8rem] text-[#59626d]">
            No credit card required &middot; Pay per onboarding &middot; Setup in 2 minutes
          </p>
        </div>

        {/* Hero visual -floating cards */}
        <div className="mt-20 relative max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#e5e7eb] shadow-2xl shadow-black/[0.06] p-6 md:p-10">
            {/* Mock dashboard header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[0.8rem] font-medium text-[#136334] mb-1">Acme Landscaping LLC</p>
                <h3 className="text-xl font-bold">Recent Activity</h3>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#136334] px-4 py-2.5 text-[0.85rem] font-medium text-white">
                <Users className="h-4 w-4" />
                Add New
              </div>
            </div>

            {/* Mock table rows */}
            <div className="space-y-3">
              {[
                { name: "Maria Garcia", role: "Crew Supervisor", status: "complete", pct: 100, badge: "W-4 e-signed" },
                { name: "James Wilson", role: "Equipment Operator", status: "progress", pct: 75, badge: "2 of 4 docs" },
                { name: "Sarah Chen", role: "Office Manager", status: "pending", pct: 0, badge: "Invite sent" },
              ].map((hire, i) => (
                <div key={i} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb]/60">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[0.8rem] font-semibold ${
                      hire.status === "complete" ? "bg-[#136334]/10 text-[#136334]" : "bg-[#f3f5f8] text-[#59626d]"
                    }`}>
                      {hire.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-semibold text-[0.9rem]">{hire.name}</p>
                      <p className="text-[0.8rem] text-[#59626d]">{hire.role}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-6">
                    <span className="text-[0.7rem] text-[#59626d] bg-[#f3f5f8] px-2.5 py-1 rounded-full">{hire.badge}</span>
                    <div className="w-32">
                      <div className="h-2 rounded-full bg-[#e5e7eb] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${hire.status === "complete" ? "bg-[#136334]" : hire.status === "progress" ? "bg-[#36c973]" : "bg-[#e5e7eb]"}`}
                          style={{ width: `${hire.pct}%` }}
                        />
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-medium ${
                      hire.status === "complete" ? "bg-[#136334]/10 text-[#136334]" :
                      hire.status === "progress" ? "bg-amber-50 text-amber-700" :
                      "bg-[#f3f5f8] text-[#59626d]"
                    }`}>
                      {hire.status === "complete" && <CheckCircle2 className="h-3 w-3" />}
                      {hire.status === "complete" ? "Complete" : hire.status === "progress" ? "In Progress" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating notification card */}
          <div className="absolute -right-4 md:-right-8 top-8 bg-white rounded-2xl border border-[#e5e7eb] shadow-xl shadow-black/[0.06] p-4 max-w-[220px] animate-[slideIn_0.6s_ease-out]">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-[#136334]/10 flex items-center justify-center shrink-0">
                <PenLine className="h-4 w-4 text-[#136334]" />
              </div>
              <div>
                <p className="text-[0.8rem] font-semibold">W-4 E-Signed</p>
                <p className="text-[0.7rem] text-[#59626d] mt-0.5">Maria completed her W-4 online</p>
              </div>
            </div>
          </div>

          {/* Floating email card */}
          <div className="absolute -left-4 md:-left-8 bottom-8 bg-white rounded-2xl border border-[#e5e7eb] shadow-xl shadow-black/[0.06] p-4 max-w-[240px]">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <FolderOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[0.8rem] font-semibold">Vault Updated</p>
                <p className="text-[0.7rem] text-[#59626d] mt-0.5">3 documents stored with version history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Logo / Trust Bar ─── */
function LogoBar() {
  return (
    <section className="py-16 border-y border-[#e5e7eb]/60">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-[0.8rem] font-medium text-[#59626d] mb-8 uppercase tracking-widest">
          Built for businesses that move fast
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
          {["Landscaping Co.", "Metro Plumbing", "Sunrise Dental", "Peak Roofing", "Valley Staffing", "Harbor CPA"].map((name) => (
            <span key={name} className="text-[1.1rem] font-bold text-[#2d343d] tracking-tight whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Users,
      title: "Add your people",
      desc: "Enter a name and email - or bulk-import hundreds via CSV. Filezy generates a unique, secure upload link for each person instantly.",
    },
    {
      num: "02",
      icon: FileSignature,
      title: "They fill, sign & upload",
      desc: "Your people open the link on any device, fill out forms online with e-sign, snap photos of documents, and upload - all in under 5 minutes.",
    },
    {
      num: "03",
      icon: FolderOpen,
      title: "Everything lands in your vault",
      desc: "Documents are stored securely with version history, expiration tracking, and auto-forwarding. Download, review, or share anytime.",
    },
  ]

  return (
    <section id="how-it-works" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight leading-tight">
            Three steps. Five minutes.
            <br />
            <span className="text-[#59626d]">Zero paperwork headaches.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="group relative bg-white rounded-3xl border border-[#e5e7eb] p-8 hover:border-[#136334]/20 hover:shadow-lg hover:shadow-[#136334]/[0.04] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[3rem] font-bold text-[#f3f5f8] leading-none group-hover:text-[#136334]/10 transition-colors">
                  {step.num}
                </span>
                <div className="h-12 w-12 rounded-2xl bg-[#136334]/[0.06] flex items-center justify-center group-hover:bg-[#136334] transition-colors">
                  <step.icon className="h-5 w-5 text-[#136334] group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="text-[1.2rem] font-bold mb-3">{step.title}</h3>
              <p className="text-[0.95rem] text-[#59626d] leading-relaxed">{step.desc}</p>
              {i < 2 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-[#e5e7eb]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Workflow Types ─── */
function WorkflowTypes() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            Three workflows, one platform
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight">
            Built for how you work
          </h2>
          <p className="mt-4 text-[1.1rem] text-[#59626d] max-w-2xl mx-auto">
            Choose your workflow at signup. Get purpose-built templates, adapted terminology, and the right document set for your business.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Employer Card */}
          <div className="bg-[#f9fafb] rounded-3xl p-8 border border-gray-100 hover:border-[#136334]/20 hover:shadow-lg hover:shadow-[#136334]/[0.04] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-[#136334]/10 flex items-center justify-center mb-6">
              <Briefcase className="h-6 w-6 text-[#136334]" />
            </div>
            <h3 className="text-xl font-bold text-[#141609] mb-2">For Employers</h3>
            <p className="text-[0.95rem] text-[#59626d] mb-6">Onboard new hires with tax forms, direct deposit, offer letters, and e-signatures - all completed online.</p>
            <ul className="space-y-2.5 text-[0.9rem] text-[#59626d]">
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> W-4 & I-9 e-sign and PDF fill</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Auto-detect state tax forms</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Direct deposit & offer letter</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Accountant auto-forwarding</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Document vault with versioning</li>
            </ul>
          </div>
          {/* Accountant Card */}
          <div className="bg-[#f9fafb] rounded-3xl p-8 border border-gray-100 hover:border-[#136334]/20 hover:shadow-lg hover:shadow-[#136334]/[0.04] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-[#136334]/10 flex items-center justify-center mb-6">
              <Calculator className="h-6 w-6 text-[#136334]" />
            </div>
            <h3 className="text-xl font-bold text-[#141609] mb-2">For Accountants</h3>
            <p className="text-[0.95rem] text-[#59626d] mb-6">Collect W-9s, EIN letters, bank details, payroll records, and census data from your business clients.</p>
            <ul className="space-y-2.5 text-[0.9rem] text-[#59626d]">
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> W-9 e-sign and PDF fill</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> EIN & bank document collection</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Employee census data capture</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Recurring document requests</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> White-label client portals</li>
            </ul>
          </div>
          {/* Staffing Agency Card */}
          <div className="bg-[#f9fafb] rounded-3xl p-8 border border-gray-100 hover:border-[#136334]/20 hover:shadow-lg hover:shadow-[#136334]/[0.04] transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-[#136334]/10 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-[#136334]" />
            </div>
            <h3 className="text-xl font-bold text-[#141609] mb-2">For Staffing Agencies</h3>
            <p className="text-[0.95rem] text-[#59626d] mb-6">High-volume worker onboarding with bulk invites, real-time progress tracking, and assignment-specific templates.</p>
            <ul className="space-y-2.5 text-[0.9rem] text-[#59626d]">
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> CSV bulk invites (500+ at once)</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Background check & drug test consent</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Certification expiration tracking</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> Assignment-specific agreements</li>
              <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#136334] shrink-0" /> White-label branding</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Phone Mockup -What the recipient sees ─── */
function PhoneMockup() {
  return (
    <section className="py-16 md:py-20 bg-[#136334] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left -text */}
          <div>
            <p className="text-[0.8rem] font-semibold text-[#60e198] uppercase tracking-widest mb-3">
              The recipient experience
            </p>
            <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight leading-tight text-white mb-6">
              Fill out forms, sign & upload - all from their phone
            </h2>
            <p className="text-[1.1rem] text-white/70 leading-relaxed mb-10">
              No app downloads. No account creation. Just a link that opens on any device, lets them complete tax forms with e-sign, snap document photos, and see exactly what&apos;s left.
            </p>

            <div className="space-y-5">
              {[
                "Fill out W-4, I-9, W-9 forms online with e-signature",
                "Camera capture for instant document photos",
                "Validation tips prevent bad uploads and re-work",
                "Clear progress bar - they know exactly what's left",
                "White-label option - your brand, not ours",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#36c973]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#36c973]" />
                  </div>
                  <span className="text-white/90 text-[0.95rem]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right -phone mockup */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Phone frame */}
              <div className="w-[280px] bg-[#1c2026] rounded-[2.5rem] p-3 shadow-2xl shadow-black/30">
                <div className="bg-[#f9fafb] rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-white px-5 py-2 flex items-center justify-between">
                    <span className="text-[0.65rem] font-medium">9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-[#141609] rounded-sm" />
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-white/90 border-b border-[#e5e7eb] px-4 py-2.5 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-[#136334] flex items-center justify-center">
                      <FileText className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[0.75rem] font-bold">Acme Landscaping</span>
                  </div>

                  {/* Content */}
                  <div className="px-4 py-4 space-y-3">
                    <div>
                      <p className="text-[0.6rem] font-medium text-[#136334]">Welcome back</p>
                      <p className="text-[0.85rem] font-bold">Maria Garcia</p>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[0.6rem] font-medium">3 of 4 documents</span>
                        <span className="text-[0.6rem] font-medium text-[#136334]">75%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#e5e7eb]">
                        <div className="h-full rounded-full bg-[#136334] w-3/4" />
                      </div>
                    </div>

                    {/* Doc cards */}
                    {[
                      { name: "W-4 Tax Form", done: true, method: "E-signed" },
                      { name: "I-9 Verification", done: true, method: "Filled online" },
                      { name: "Direct Deposit", done: true, method: "Uploaded" },
                      { name: "Offer Letter", done: false, method: null },
                    ].map((doc, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${doc.done ? "border-[#136334]/20 bg-[#136334]/[0.02]" : "border-[#e5e7eb]"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {doc.done ? (
                              <CheckCircle2 className="h-4 w-4 text-[#136334]" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-[#e5e7eb]" />
                            )}
                            <span className="text-[0.7rem] font-semibold">{doc.name}</span>
                          </div>
                          {doc.method && (
                            <span className="text-[0.5rem] text-[#136334] bg-[#136334]/10 px-1.5 py-0.5 rounded-full">{doc.method}</span>
                          )}
                        </div>
                        {!doc.done && (
                          <div className="mt-2 ml-6 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-[#136334] rounded-lg px-3 py-1.5 w-fit">
                              <PenLine className="h-3 w-3 text-white" />
                              <span className="text-[0.6rem] font-medium text-white">Fill online</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-[#e5e7eb] rounded-lg px-3 py-1.5 w-fit">
                              <Camera className="h-3 w-3 text-[#59626d]" />
                              <span className="text-[0.6rem] font-medium text-[#59626d]">Upload</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-10 bg-[#36c973]/10 rounded-full blur-[60px] pointer-events-none -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features ─── */
function Features() {
  const features = [
    {
      icon: PenLine,
      title: "E-sign & PDF fill",
      desc: "W-4, I-9, W-9 and more - completed and signed online in the browser. No printing, no scanning. Generates audit-trailed PDFs automatically.",
    },
    {
      icon: FolderOpen,
      title: "Document vault",
      desc: "Every document stored securely with full version history. Approve, reject, or request re-uploads. Download individually or bulk-export as ZIP.",
    },
    {
      icon: Palette,
      title: "White-label branding",
      desc: "Upload your logo, set your brand colors. Your clients and employees see your brand on upload pages and emails - not ours.",
    },
    {
      icon: TableProperties,
      title: "CSV bulk invites",
      desc: "Upload a spreadsheet with hundreds of names and emails. Filezy creates records, sends invite links, and tracks progress for each one.",
    },
    {
      icon: CalendarClock,
      title: "Expiration tracking",
      desc: "Set expiration dates on certifications, licenses, and documents. Get automatic alerts at 30 days, 7 days, and on expiry.",
    },
    {
      icon: Shield,
      title: "Bank-grade security",
      desc: "All documents encrypted in transit and at rest. Signed URLs expire automatically. Full audit log of every view, download, and signature.",
    },
    {
      icon: Layers,
      title: "Role templates",
      desc: "Create document sets for different roles or assignments. Each new person gets exactly the right forms for their position.",
    },
    {
      icon: Clock,
      title: "Automatic reminders",
      desc: "Configurable email reminders at 3, 7, and 14 days. Never chase someone for missing paperwork again.",
    },
    {
      icon: LayoutDashboard,
      title: "Real-time dashboard",
      desc: "See who's complete, who's missing documents, and what's expiring soon - all at a glance. Filter by location, status, or role.",
    },
  ]

  return (
    <section id="features" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight">
            Everything you need.
            <br />
            <span className="text-[#59626d]">On every plan.</span>
          </h2>
          <p className="text-[1.1rem] text-[#59626d] mt-4 max-w-xl mx-auto">
            No feature gates. No tier-locked upgrades. Every plan includes every feature - you only pay based on volume.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group bg-white rounded-3xl border border-[#e5e7eb] p-7 hover:border-[#136334]/20 hover:shadow-lg hover:shadow-[#136334]/[0.04] transition-all duration-300">
              <div className="h-12 w-12 rounded-2xl bg-[#136334]/[0.06] flex items-center justify-center mb-5 group-hover:bg-[#136334] transition-colors duration-300">
                <f.icon className="h-5 w-5 text-[#136334] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-[1.1rem] font-bold mb-2">{f.title}</h3>
              <p className="text-[0.9rem] text-[#59626d] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$3",
      period: "/per",
      desc: "Pay as you go",
      features: ["All features included", "$3 per completed onboarding", "No monthly commitment", "Unlimited team members", "Cancel anytime"],
      cta: "Get started",
      popular: false,
    },
    {
      name: "Growth",
      price: "$49",
      period: "/mo",
      desc: "25 included per month",
      features: ["All features included", "25 onboardings/mo included", "$2 per additional onboarding", "Unlimited team members", "Cancel anytime"],
      cta: "Start free trial",
      popular: true,
    },
    {
      name: "Pro",
      price: "$99",
      period: "/mo",
      desc: "75 included per month",
      features: ["All features included", "75 onboardings/mo included", "$1.50 per additional onboarding", "Unlimited team members", "Priority support"],
      cta: "Start free trial",
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight">
            Simple, usage-based pricing
          </h2>
          <p className="text-[1.1rem] text-[#59626d] mt-4 max-w-xl mx-auto">
            Every feature on every plan. You only pay based on how many onboardings you complete each month.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-3xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-[#136334] bg-[#136334]/[0.02] shadow-xl shadow-[#136334]/[0.08]"
                  : "border-[#e5e7eb] bg-white"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#136334] text-white text-[0.7rem] font-semibold px-4 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-[1.1rem] font-bold mb-1">{plan.name}</h3>
                <p className="text-[0.85rem] text-[#59626d]">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <span className="text-[3rem] font-bold leading-none">{plan.price}</span>
                <span className="text-[#59626d] text-[0.9rem] ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-[0.9rem]">
                    <CheckCircle2 className="h-4 w-4 text-[#136334] shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`w-full inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-[0.9rem] font-semibold transition-all active:scale-[0.98] ${
                  plan.popular
                    ? "bg-[#136334] text-white hover:bg-[#0f5029] shadow-lg shadow-[#136334]/20"
                    : "bg-[#f3f5f8] text-[#2d343d] hover:bg-[#e5e7eb]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[0.85rem] text-[#59626d] mt-8">
          No credit card required to sign up. You&apos;re only billed when an onboarding is marked complete.
        </p>
      </div>
    </section>
  )
}

/* ─── Partner Program CTA ─── */
function PartnerCTA() {
  return (
    <section id="partners" className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative bg-[#136334] rounded-[2rem] p-10 md:p-16 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNCkiLz48L3N2Zz4=')] pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#36c973]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-6">
                <TrendingUp className="h-3.5 w-3.5 text-[#60e198]" />
                <span className="text-[0.8rem] font-medium text-white/90">Partner Program</span>
              </div>
              <h2 className="text-[2.25rem] md:text-[2.75rem] font-bold text-white leading-tight mb-4">
                Refer businesses, earn recurring revenue
              </h2>
              <p className="text-white/70 text-[1.05rem] leading-relaxed mb-8">
                Accountants, consultants, and advisors - earn 20-30% recurring commission on every business you refer. The more you refer, the higher your rate.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { rate: "20%", label: "1–50 referrals" },
                  { rate: "25%", label: "51–200 referrals" },
                  { rate: "30%", label: "200+ referrals" },
                ].map((tier, i) => (
                  <div key={i} className="text-center bg-white/10 rounded-2xl p-4">
                    <p className="text-[1.5rem] font-bold text-[#60e198]">{tier.rate}</p>
                    <p className="text-[0.75rem] text-white/60">{tier.label}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/join-accountant"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-[0.95rem] font-semibold text-[#136334] hover:bg-white/90 transition-all active:scale-[0.98]"
              >
                Join the Partner Program
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
                <p className="text-white/60 text-[0.8rem] font-medium mb-4 uppercase tracking-widest">
                  Example earnings
                </p>
                {[
                  { clients: 10, rate: "20%", monthly: "$98–198", annual: "$1,176–2,376" },
                  { clients: 25, rate: "20%", monthly: "$245–495", annual: "$2,940–5,940" },
                  { clients: 75, rate: "25%", monthly: "$919–1,856", annual: "$11,025–22,275" },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? "border-b border-white/10" : ""}`}>
                    <div>
                      <p className="text-white font-semibold text-[0.9rem]">{row.clients} referrals</p>
                      <p className="text-white/50 text-[0.75rem]">at {row.rate} commission</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#60e198] font-bold text-[0.95rem]">{row.monthly}/mo</p>
                      <p className="text-white/40 text-[0.7rem]">{row.annual}/yr</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ─── */
function Testimonials() {
  const quotes = [
    {
      text: "We used to chase new hires for paperwork for weeks. Now they fill out the W-4 and I-9 on their phone before they even start. The e-sign feature is a game-changer.",
      name: "Mike Rodriguez",
      title: "Owner, Rodriguez Plumbing",
      initials: "MR",
    },
    {
      text: "I collect W-9s and EIN letters from 40+ clients. Before Filezy, it was endless email chains. Now I send a link and everything lands in my vault, organized and versioned.",
      name: "Sarah Kim, CPA",
      title: "Kim & Associates",
      initials: "SK",
    },
    {
      text: "We place 200+ workers a month. The CSV bulk invite and background check consent forms save us hours every week. Plus our clients love the white-label branding.",
      name: "Rachel Torres",
      title: "VP Operations, Valley Staffing",
      initials: "RT",
    },
  ]

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            Testimonials
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight">
            People actually love this
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <div key={i} className="bg-[#f9fafb] rounded-3xl border border-[#e5e7eb] p-8">
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#136334] text-[#136334]" />
                ))}
              </div>
              <p className="text-[0.95rem] text-[#2d343d] leading-relaxed mb-6">
                &ldquo;{q.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#136334]/10 flex items-center justify-center text-[0.8rem] font-semibold text-[#136334]">
                  {q.initials}
                </div>
                <div>
                  <p className="text-[0.85rem] font-semibold">{q.name}</p>
                  <p className="text-[0.75rem] text-[#59626d]">{q.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FAQ ─── */
function FAQ() {
  const faqs = [
    {
      q: "Who is Filezy for?",
      a: "Filezy is built for three audiences: employers onboarding new hires, accountants collecting documents from business clients, and staffing agencies placing workers at scale. You choose your workflow at signup and get purpose-built templates.",
    },
    {
      q: "Do people need to create an account to submit documents?",
      a: "No. They just click the link you send them and start filling out forms or uploading files. No account, no app download, no password to remember. Works on any phone, tablet, or computer.",
    },
    {
      q: "What documents can Filezy collect?",
      a: "Over 15 document types including W-4, I-9, W-9, direct deposit, offer letters, EIN letters, bank details, background check consent, drug test consent, certifications, emergency contacts, and more. You can also request any custom document via file upload.",
    },
    {
      q: "How does the e-sign and PDF fill work?",
      a: "For supported forms (W-4, I-9, W-9, and others), recipients can fill out the form fields directly in the browser and sign electronically - either by typing or drawing their signature. Filezy generates a signed PDF with a complete audit trail.",
    },
    {
      q: "What if someone doesn't have a printer or scanner?",
      a: "They don't need one. Most forms can be filled out and e-signed directly online. For documents that require a physical copy, they can take a photo with their phone camera. The upload page even shows tips to ensure photo quality.",
    },
    {
      q: "Is it secure?",
      a: "Yes. All files are encrypted in transit (TLS) and at rest. Download links expire automatically. Every view, download, and signature is recorded in a full audit log. We never share data with anyone except who you designate.",
    },
    {
      q: "What does the document vault include?",
      a: "Every document is stored with full version history. You can see who uploaded what, when, and approve or reject submissions. Documents can have expiration dates with automatic alerts. You can download individually or bulk-export as a ZIP.",
    },
    {
      q: "Can I use my own branding?",
      a: "Yes. Upload your logo and set your brand colors. Your clients and employees will see your brand on upload pages and in emails - Filezy stays in the background.",
    },
    {
      q: "How does pricing work?",
      a: "Every feature is included on every plan - no tier-locked upgrades. Starter is pay-as-you-go at $3 per completed onboarding with no monthly fee. Growth ($49/mo) includes 25 onboardings, and Pro ($99/mo) includes 75. You're only charged when someone completes all their documents.",
    },
    {
      q: "How does the partner program work?",
      a: "Sign up as a partner, get your referral link, and share it with businesses. You earn 20–30% recurring commission on every referral's subscription and usage charges for as long as they stay active. The more you refer, the higher your rate.",
    },
  ]

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[0.8rem] font-semibold text-[#136334] uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-[2.5rem] md:text-[3rem] font-bold tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-white rounded-2xl border border-[#e5e7eb] overflow-hidden">
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[1rem] font-semibold list-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown className="h-5 w-5 text-[#59626d] shrink-0 ml-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-6 pb-5 text-[0.9rem] text-[#59626d] leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative bg-[#f9fafb] rounded-[2rem] border border-[#e5e7eb] p-12 md:p-20 text-center overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#36c973]/[0.06] rounded-full blur-[80px] pointer-events-none" />

          <div className="relative">
            <h2 className="text-[2.5rem] md:text-[3.5rem] font-bold tracking-tight leading-tight mb-6">
              Stop chasing paperwork.
              <br />
              <span className="text-[#136334]">Start with Filezy today.</span>
            </h2>
            <p className="text-[1.15rem] text-[#59626d] max-w-xl mx-auto mb-10">
              Set up your account in 2 minutes. Send your first upload link. Watch documents, signatures, and forms come back - organized and secure.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-[#136334] px-10 py-4.5 text-[1.05rem] font-semibold text-white hover:bg-[#0f5029] transition-all active:scale-[0.98] shadow-xl shadow-[#136334]/20"
            >
              Get started for free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-5 text-[0.8rem] text-[#59626d]">
              No credit card required &middot; Pay only when onboardings complete
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="py-12 border-t border-[#e5e7eb]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#136334] flex items-center justify-center">
                <FileText className="h-[18px] w-[18px] text-white" />
              </div>
              <span className="font-bold text-[1.15rem] tracking-tight">Filezy</span>
            </div>
            <p className="text-[0.85rem] text-[#59626d] leading-relaxed">
              Document onboarding, simplified.
            </p>
          </div>

          <div>
            <p className="font-semibold text-[0.85rem] mb-4">Product</p>
            <ul className="space-y-2.5 text-[0.85rem] text-[#59626d]">
              <li><a href="#how-it-works" className="hover:text-[#141609] transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-[#141609] transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-[#141609] transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[0.85rem] mb-4">Partners</p>
            <ul className="space-y-2.5 text-[0.85rem] text-[#59626d]">
              <li><Link href="/join-accountant" className="hover:text-[#141609] transition-colors">Partner Program</Link></li>
              <li><Link href="/login" className="hover:text-[#141609] transition-colors">Partner Portal</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-[0.85rem] mb-4">Company</p>
            <ul className="space-y-2.5 text-[0.85rem] text-[#59626d]">
              <li><Link href="/login" className="hover:text-[#141609] transition-colors">Sign In</Link></li>
              <li><a href="mailto:james@filezy.com" className="hover:text-[#141609] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#e5e7eb] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[0.8rem] text-[#59626d]">
            &copy; {new Date().getFullYear()} Filezy. All rights reserved.
          </p>
          <div className="flex gap-6 text-[0.8rem] text-[#59626d]">
            <a href="#" className="hover:text-[#141609] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#141609] transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
