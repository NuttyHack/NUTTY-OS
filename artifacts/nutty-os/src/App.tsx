import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import {
  Activity, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BookOpen, Brain, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, CheckSquare2, ChevronDown, CircleDot, Clock3, Command, Download, Dumbbell,
  GraduationCap, House, KeyRound, LayoutGrid, ListChecks, LogOut, Mail, Menu, MessageSquare,
  Mic, MoreHorizontal, Plus, PlugZap, Search, Send, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Target,
  Trash2, UserRound, WalletCards, X, type LucideIcon,
} from "lucide-react";
import {
  type NuttyData, type Goal, type Task, type CalendarEvent, type Memory, type Integration,
  type Expense, type SocialItem, type NotificationItem, type VoiceTurn,

  getRecommendation, getSetupStatus, integrationCatalog, loadNuttyData,
  makeId, respondToIntent, saveNuttyData,
} from "./lib/nutty-data";
import { JarvisVoice } from "./components/JarvisVoice";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const asset = (path: string) => `${basePath}${path}`;

const primaryNav = [
  { href: "/today", label: "Today", icon: LayoutGrid },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tasks", label: "Tasks", icon: CheckSquare2 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/ai", label: "NUTTY AI", icon: Brain },
];

const lifeModules = [
  ["/fitness", "Fitness", Dumbbell],
  ["/learning", "Learning", GraduationCap],
  ["/work", "Work", BriefcaseBusiness],
  ["/money", "Money", WalletCards],
  ["/life", "Life", House],
  ["/memory", "Memory", Brain],
] as const;

type NuttyStore = {
  data: NuttyData;
  demoMode: boolean;
  update: (updater: (current: NuttyData) => NuttyData) => void;
  setDemoMode: (value: boolean) => void;
};

const StoreContext = createContext<NuttyStore | null>(null);

function useNutty() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("NUTTY data store is not available");
  return context;
}

function NuttyProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const userId = user?.id || "anonymous";
  const modeKey = `nutty-os:${userId}:demo-mode`;
  const [demoMode, setDemoModeState] = useState(() => window.localStorage.getItem(modeKey) === "true");
  const [data, setData] = useState<NuttyData>(() => loadNuttyData(userId, window.localStorage.getItem(modeKey) === "true"));

  useEffect(() => {
    const nextMode = window.localStorage.getItem(modeKey) === "true";
    setDemoModeState(nextMode);
    setData(loadNuttyData(userId, nextMode));
  }, [modeKey, userId]);

  useEffect(() => {
    saveNuttyData(userId, demoMode, data);
  }, [data, demoMode, userId]);

  const update = (updater: (current: NuttyData) => NuttyData) => setData((current) => updater(current));
  const setDemoMode = (value: boolean) => {
    window.localStorage.setItem(modeKey, String(value));
    setDemoModeState(value);
    setData(loadNuttyData(userId, value));
  };

  return <StoreContext.Provider value={{ data, demoMode, update, setDemoMode }}>{children}</StoreContext.Provider>;
}

function LoadingScreen() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background"><div className="text-center"><img src={asset("/nutty-logo.png")} alt="NUTTY" className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-[0_0_50px_rgba(72,143,255,.25)]" /><p className="mono mt-4 text-[10px] uppercase tracking-[.24em] text-muted-foreground">Initializing personal OS</p></div></div>;
}

function DemoBadge() {
  const { demoMode } = useNutty();
  return demoMode ? <span className="mono inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-amber-200"><Activity size={11} /> Demo data</span> : null;
}

function LandingPage() {
  return <div className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(48,113,255,.18),transparent_32rem),radial-gradient(circle_at_10%_60%,rgba(171,53,255,.1),transparent_28rem)]" />
    <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10"><Link href="/" className="flex items-center gap-3"><img src={asset("/nutty-logo.png")} alt="NUTTY OS" className="h-11 w-11 rounded-xl object-cover ring-1 ring-white/10" /><span><span className="display block text-lg font-bold tracking-[-.05em]">NUTTY <span className="text-primary">OS</span></span><span className="mono block text-[9px] uppercase tracking-[.2em] text-muted-foreground">Your Personal AI OS</span></span></Link><div className="flex items-center gap-2"><Link href="/sign-in" className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Log in</Link><Link href="/sign-up" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(72,143,255,.2)]">Create account</Link></div></header>
    <main className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 md:px-10 md:pt-28"><div className="max-w-4xl"><p className="eyebrow text-primary">The connected personal operating system</p><h1 className="display mt-5 text-5xl font-bold leading-[.98] tracking-[-.07em] sm:text-7xl">Make sense of your life.<br /><span className="text-gradient">Move with clarity.</span></h1><p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">NUTTY brings your goals, tasks, time, routines, learning, work, fitness, money, messages, and personal context into one calm system that helps you decide what to do next.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground">Start with a blank slate <ArrowRight size={16} /></Link><a href="#principles" className="rounded-xl border border-border bg-card/60 px-5 py-3.5 text-sm font-bold">See how it works</a></div></div>
      <div className="mt-20 grid gap-4 md:grid-cols-3" id="principles">{[["01", "Earns context", "No invented identity, schedule, goals, health signals, or progress. NUTTY learns only what you provide."], ["02", "One connected system", "Calendar, email, tasks, goals, money, social, fitness, and memory feed one personal life model."], ["03", "You stay in control", "Review, modify, skip, export, disconnect, or delete. Important actions always require your approval."]].map(([num, title, detail]) => <div key={num} className="surface rounded-2xl p-6"><span className="mono text-xs text-primary">{num}</span><h2 className="display mt-8 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detail}</p></div>)}</div>
      <div className="mt-4 surface soft-grid rounded-2xl p-6 sm:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><p className="eyebrow">A calm command layer</p><h2 className="display mt-2 text-2xl font-bold">Ask: “What should I do right now?”</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">NUTTY gathers available context, shows what it used, explains its recommendation, and asks before it acts.</p></div><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Command size={27} /></div></div></div>
    </main>
  </div>;
}

function CommandOverlay({ onClose }: { onClose: () => void }) {
  const [, setLocation] = useLocation();
  const [value, setValue] = useState("");
  const submit = (text = value) => { if (!text.trim()) return; window.localStorage.setItem("nutty-last-command", text.trim()); onClose(); setLocation("/ai"); };
  const commands = ["What should I do?", "Plan my day", "Add a task", "Remember something", "Check my calendar"];
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => event.currentTarget === event.target && onClose()}><div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl animate-rise"><form onSubmit={(event) => { event.preventDefault(); submit(); }} className="flex items-center gap-3 border-b border-border px-5 py-4"><Command size={19} className="text-primary" /><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Tell NUTTY what you need..." className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" /><kbd className="hidden rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground sm:block">ESC</kbd></form><div className="p-4"><p className="eyebrow mb-3">Start with a thought</p><div className="grid gap-2 sm:grid-cols-2">{commands.map((command) => <button key={command} onClick={() => submit(command)} className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-3 text-left text-sm font-semibold hover:border-primary/50 hover:bg-primary/5">{command}<ArrowUpRight size={15} className="text-muted-foreground" /></button>)}</div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Commands are interpreted through the same context layer as NUTTY AI. No external action runs without your approval.</p></div></div></div>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const name = user?.firstName || user?.username || "there";
  useEffect(() => {
    const listener = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); } if (event.key === "Escape") setCommandOpen(false); };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  return <div className="min-h-[100dvh] bg-background text-foreground">
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col border-r border-border bg-[hsl(var(--sidebar))] px-4 py-5 transition-transform md:translate-x-0 ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="mb-8 flex items-center justify-between px-2"><Link href="/today" className="flex items-center gap-2.5"><img src={asset("/nutty-logo.png")} alt="NUTTY OS" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" /><span><span className="display block text-[17px] font-bold tracking-[-.04em]">NUTTY <span className="text-primary">OS</span></span><span className="mono block text-[8px] uppercase tracking-[.18em] text-muted-foreground">Personal AI OS</span></span></Link><button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1 text-muted-foreground md:hidden"><X size={18} /></button></div>
      <button onClick={() => setCommandOpen(true)} className="mb-6 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 text-left text-xs text-muted-foreground hover:border-primary/60 hover:text-foreground"><Command size={15} className="text-primary" /><span className="flex-1">Ask NUTTY anything</span><span className="mono text-[9px]">⌘K</span></button>
      <p className="eyebrow px-3 pb-3">Command center</p><nav className="space-y-1">{primaryNav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setDrawerOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === href ? "bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(70,140,255,.16)]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon size={17} /><span>{label}</span>{location === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current" />}</Link>)}</nav>
      <p className="eyebrow mt-8 px-3 pb-3">Life modules</p><div className="grid grid-cols-2 gap-1">{lifeModules.map(([href, label, Icon]) => <Link href={href} key={label} onClick={() => setDrawerOpen(false)} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold ${location === href ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><Icon size={14} /><span>{label}</span></Link>)}</div>
      <div className="mt-4 grid grid-cols-2 gap-1"><Link href="/email" className="side-mini"><Mail size={14} /> Email</Link><Link href="/social" className="side-mini"><MessageSquare size={14} /> Social</Link><Link href="/voice" className="side-mini"><Mic size={14} /> Voice</Link><Link href="/notifications" className="side-mini"><Bell size={14} /> Alerts</Link></div>
      <div className="mt-auto space-y-2"><div className="rounded-2xl border border-border bg-secondary/60 p-3.5"><div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" /><span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">NUTTY ready</span></div><p className="text-xs leading-relaxed text-muted-foreground">Your context starts empty and grows with your permission.</p></div><Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"><Settings2 size={16} /> Settings</Link></div>
    </aside>
    {drawerOpen && <button aria-label="Close navigation" onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}
    <main className="min-h-[100dvh] md:pl-[268px]"><header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl md:px-9"><button onClick={() => setDrawerOpen(true)} className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground md:hidden"><Menu size={18} /></button><div className="hidden items-center gap-2 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary" /><span className="mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{location === "/ai" ? "Context layer" : "Personal operating system"}</span></div><div className="ml-auto flex items-center gap-3"><DemoBadge /><button onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 sm:flex"><Search size={14} /> What should I do?</button><Link href="/notifications" className="rounded-xl p-2 text-muted-foreground hover:bg-secondary" aria-label="Notifications"><Bell size={17} /></Link><div className="group relative"><button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">{name.slice(0, 2).toUpperCase()}</span><ChevronDown size={14} className="text-muted-foreground" /></button><div className="invisible absolute right-0 top-11 w-44 rounded-xl border border-border bg-card p-1 opacity-0 shadow-2xl transition-all group-hover:visible group-hover:opacity-100"><Link href="/onboarding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary"><SlidersHorizontal size={14} /> Setup center</Link><Link href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-secondary"><Settings2 size={14} /> Settings</Link><button onClick={() => signOut({ redirectUrl: basePath || "/" })} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"><LogOut size={14} /> Log out</button></div></div></div></header><div className="mx-auto max-w-[1500px] px-4 pb-24 pt-6 md:px-9 md:pb-12 md:pt-9">{children}</div></main>
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-border bg-[hsl(225_18%_10%/.96)] p-1.5 shadow-2xl backdrop-blur-xl md:hidden">{primaryNav.slice(0, 4).map(({ href, label, icon: Icon }) => <Link href={href} key={href} className={`flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${location === href ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Icon size={16} /><span>{label}</span></Link>)}<Link href="/ai" className={`flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${location === "/ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}><Brain size={16} /><span>AI</span></Link></nav>
    {commandOpen && <CommandOverlay onClose={() => setCommandOpen(false)} />}
  </div>;
}

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">{eyebrow}</p><h1 className="display text-3xl font-bold tracking-[-.045em] sm:text-[38px]">{title}</h1>{detail && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{detail}</p>}</div>{action}</div>;
}

function EmptyState({ icon: Icon, title, body, actions }: { icon: any; title: string; body: string; actions?: ReactNode }) {
  return <div className="surface flex min-h-[250px] flex-col items-center justify-center rounded-2xl p-8 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon size={24} /></span><h2 className="display mt-5 text-xl font-bold">{title}</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>{actions && <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>}</div>;
}

function SetupStatusCenter() {
  const { data } = useNutty();
  const [, setLocation] = useLocation();
  const statuses = getSetupStatus(data);
  const configured = statuses.filter((item) => item.state === "configured" || item.state === "connected" || item.state === "demo").length;
  return <div className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Setup status center</p><h2 className="display mt-1 text-xl font-bold">{configured}/{statuses.length} areas ready</h2><p className="mt-2 text-xs text-muted-foreground">Progressive setup. Skip anything and return when it helps.</p></div><Link href="/onboarding" className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:border-primary/50">Open setup</Link></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{statuses.slice(0, 10).map((item) => <button key={item.id} onClick={() => setLocation(item.id === "profile" || item.id === "goals" ? "/onboarding" : "/integrations")} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3 text-left hover:border-primary/40"><span className={`h-2.5 w-2.5 rounded-full ${item.state === "demo" ? "bg-amber-300" : item.state === "connected" || item.state === "configured" ? "bg-emerald-300" : item.state === "needs_attention" ? "bg-orange-300" : "bg-muted-foreground/50"}`} /><span className="flex-1 text-xs font-semibold">{item.name}</span><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.state.replace("_", " ")}</span></button>)}</div></div>;
}

function TodayPage() {
  const { user } = useUser();
  const { data } = useNutty();
  const recommendation = getRecommendation(data);
  const openTasks = data.tasks.filter((task) => !task.completed);
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const name = data.profile.name || user?.firstName || "there";
  return <div className="animate-rise"><div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">{today} · personal command center</p><DemoBadge /></div><h1 className="display mt-2 text-3xl font-bold tracking-[-.05em] sm:text-[46px]">Good to meet you, {name}.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">NUTTY uses the context you choose to share. It will never guess your schedule, health, money, priorities, or progress.</p></div><Link href="/ai" className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:-translate-y-0.5"><Brain size={16} /> What should I do? <ArrowRight size={15} /></Link></div>
    <section className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]"><div className="surface soft-grid relative overflow-hidden rounded-2xl p-6 sm:p-8"><p className="eyebrow text-primary">NOW · recommendation</p><h2 className="display mt-5 max-w-[620px] text-2xl font-bold tracking-[-.04em] sm:text-4xl">{recommendation.title}</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{recommendation.reason}</p><div className="mt-6 flex flex-wrap items-center gap-2"><span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Source · {recommendation.source}</span><span className="rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">{recommendation.confidence}</span></div><div className="mt-7 flex flex-wrap gap-2"><Link href="/tasks" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review tasks</Link><Link href="/calendar" className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary/50">Open calendar</Link></div></div><div className="surface rounded-2xl p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow">Personal life model</p><h2 className="display mt-2 text-2xl font-bold">{data.goals.length + data.events.length + data.memories.length} signals</h2></div><Brain size={22} className="text-primary" /></div><div className="mt-6 space-y-3">{[[data.goals.length, "Goals"], [openTasks.length, "Open tasks"], [data.events.length, "Calendar events"], [data.memories.length, "Memories"]].map(([count, label]) => <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3"><CircleDot size={16} className="text-primary" /><span className="text-sm">{count} {label}</span><ArrowRight size={14} className="ml-auto text-muted-foreground" /></div>)}</div><Link href="/memory" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary">Review context <ArrowRight size={14} /></Link></div></section>
    <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]"><SetupStatusCenter /><MorningBriefing /></section>
    <section className="mt-4 grid gap-4 md:grid-cols-3">{[["/calendar", CalendarDays, "TODAY", data.events.length ? `${data.events.length} events available` : "Your timeline is clear", "Review hard commitments, flexible blocks, conflicts, and free time."], ["/goals", Target, "GOALS", data.goals.length ? `${data.goals.length} outcomes defined` : "No goals yet", "Turn an intention into an outcome, milestone, and next action."], ["/notifications", Bell, "ATTENTION", data.notifications.filter((item) => !item.read && !item.snoozed).length ? "Review your attention queue" : "No urgent alerts", "Every item explains its source and can be read, snoozed, or dismissed."]].map(([href, Icon, label, title, detail]) => <Link href={href as string} key={label as string} className="surface group rounded-2xl p-5 hover:border-primary/40"><div className="mb-7 flex items-center justify-between"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={17} /></span><ArrowUpRight size={16} className="text-muted-foreground" /></div><p className="eyebrow">{label as string}</p><h3 className="mt-2 text-lg font-bold">{title as string}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail as string}</p></Link>)}</section>
  </div>;
}

function MorningBriefing() {
  const { data } = useNutty();
  const rec = getRecommendation(data);
  return <div className="surface rounded-2xl p-5 sm:p-6"><div className="flex items-center gap-3"><span className="rounded-lg bg-accent/10 p-2 text-accent"><Sparkles size={17} /></span><div><p className="eyebrow">Morning briefing</p><h2 className="display mt-1 text-lg font-bold">A plan from available context</h2></div></div><div className="mt-5 space-y-3">{[[1, rec.title, rec.source], [2, data.tasks.filter((task) => !task.completed)[0]?.title || "Choose one open action", "Tasks"], [3, data.events[0]?.title || "Protect some unplanned time", "Calendar"]].map(([number, title, source]) => <div key={number} className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-3"><span className="mono text-xs text-primary">0{number}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-[11px] text-muted-foreground">{source}</p></div></div>)}</div><Link href="/evening" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Open evening review <ArrowRight size={14} /></Link></div>;
}

function OnboardingPage() {
  const { data, update, demoMode, setDemoMode } = useNutty();
  const [step, setStep] = useState(1);
  const [goalTitle, setGoalTitle] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("09:00");
  const [routineName, setRoutineName] = useState("");
  const [routineTime, setRoutineTime] = useState("07:00");
  const [, setLocation] = useLocation();
  const complete = () => { update((current) => ({ ...current, onboardingComplete: true })); setLocation("/today"); };
  const saveProfile = (field: keyof NuttyData["profile"], value: string) => update((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  const addGoal = () => { if (!goalTitle.trim()) return; update((current) => ({ ...current, goals: [...current.goals, { id: makeId("goal"), title: goalTitle.trim(), category: "Personal", completed: false }] })); setGoalTitle(""); };
  const addEvent = () => { if (!eventTitle.trim()) return; const date = new Date().toISOString().slice(0, 10); const endHour = `${String(Math.min(23, Number(eventStart.slice(0, 2)) + 1)).padStart(2, "0")}:${eventStart.slice(3)}`; update((current) => ({ ...current, events: [...current.events, { id: makeId("event"), title: eventTitle.trim(), start: `${date}T${eventStart}`, end: `${date}T${endHour}`, category: "Commitment", location: "", notes: "", recurrence: "", priority: "medium", commitment: "hard" }] })); setEventTitle(""); };
  const addRoutine = () => { if (!routineName.trim()) return; update((current) => ({ ...current, routines: [...current.routines, { id: makeId("routine"), name: routineName.trim(), time: routineTime, category: "Personal" }] })); setRoutineName(""); };
  const steps = ["Profile", "Goals", "Schedule", "Routines", "Connections"];
  return <div className="animate-rise"><PageHeading eyebrow="Progressive onboarding" title="Build your personal model at your pace." detail="Add only what helps today. You can skip any step and complete setup later." action={<button onClick={complete} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:border-primary/50">Skip for now</button>} /><div className="mb-5 grid grid-cols-5 gap-2">{steps.map((label, index) => <button key={label} onClick={() => setStep(index + 1)} className={`rounded-xl border p-3 text-left ${step === index + 1 ? "border-primary/50 bg-primary/10" : "border-border bg-card"}`}><span className="mono text-[10px] text-primary">0{index + 1}</span><span className="mt-2 block text-xs font-bold">{label}</span></button>)}</div><div className="surface rounded-2xl p-5 sm:p-8">
    {step === 1 && <div><p className="eyebrow">Step 1 · personal profile</p><h2 className="display mt-2 text-2xl font-bold">Start with what feels useful.</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["name", "Name", "Your name"], ["age", "Age", "Optional"], ["location", "Location", "City or region"], ["timezone", "Timezone", data.profile.timezone], ["situation", "Current situation", "Student, employed, both, or other"], ["occupation", "Occupation or field", "What are you working or learning toward?"], ["wakeTime", "Typical wake time", "Optional"], ["sleepTime", "Typical sleep time", "Optional"]].map(([field, label, placeholder]) => <label key={field} className="text-xs font-semibold text-muted-foreground">{label}<input value={data.profile[field as keyof NuttyData["profile"]]} onChange={(event) => saveProfile(field as keyof NuttyData["profile"], event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm text-foreground outline-none focus:border-primary/60" /></label>)}</div></div>}
    {step === 2 && <div><p className="eyebrow">Step 2 · goals</p><h2 className="display mt-2 text-2xl font-bold">What do you want to move forward?</h2><div className="mt-6 flex gap-2"><input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addGoal()} placeholder="Fitness, health, school, work, career, finance, personal..." className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><button onClick={addGoal} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><ItemList items={data.goals} empty="Add one real outcome. NUTTY will not invent a goal for you." render={(goal) => <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4"><Target size={16} className="text-primary" /><span className="text-sm font-semibold">{goal.title}</span><span className="mono ml-auto text-[9px] uppercase text-muted-foreground">{goal.category}</span></div>} /></div>}
    {step === 3 && <div><p className="eyebrow">Step 3 · schedule</p><h2 className="display mt-2 text-2xl font-bold">Give NUTTY the shape of your day.</h2><div className="mt-6 grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Class, work, training, appointment..." className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><input type="time" value={eventStart} onChange={(event) => setEventStart(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none focus:border-primary/60" /><button onClick={addEvent} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><p className="mt-3 text-xs text-muted-foreground">You can add hard commitments now and make events flexible later in Calendar.</p><ItemList items={data.events} empty="Add a schedule item or skip this step. Your timeline remains yours." render={(event) => <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4"><CalendarDays size={16} className="text-primary" /><span className="text-sm font-semibold">{event.title}</span><span className="mono ml-auto text-[9px] uppercase text-muted-foreground">{event.start.slice(11, 16)}</span></div>} /></div>}
    {step === 4 && <div><p className="eyebrow">Step 4 · routines</p><h2 className="display mt-2 text-2xl font-bold">Add the rhythms you want to protect.</h2><div className="mt-6 grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input value={routineName} onChange={(event) => setRoutineName(event.target.value)} placeholder="Morning reset, study block, meal routine..." className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><input type="time" value={routineTime} onChange={(event) => setRoutineTime(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none focus:border-primary/60" /><button onClick={addRoutine} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><ItemList items={data.routines} empty="Routines are optional. NUTTY can learn them gradually." render={(routine) => <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4"><Clock3 size={16} className="text-primary" /><span className="text-sm font-semibold">{routine.name}</span><span className="mono ml-auto text-[9px] uppercase text-muted-foreground">{routine.time}</span></div>} /></div>}
    {step === 5 && <div><p className="eyebrow">Step 5 · connections</p><h2 className="display mt-2 text-2xl font-bold">Connect later or explore with Demo mode.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Real providers require authorization. Demo mode uses clearly labeled simulated records through the same provider interfaces.</p><div className="mt-5 flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"><div><p className="text-sm font-bold">Demo mode</p><p className="mt-1 text-xs text-muted-foreground">Populate the connected life experience with labeled sample context.</p></div><button onClick={() => setDemoMode(!demoMode)} className={`h-7 w-12 rounded-full p-1 transition ${demoMode ? "bg-amber-300" : "bg-secondary"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${demoMode ? "translate-x-5" : ""}`} /></button></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{data.integrations.slice(0, 6).map((item) => <IntegrationRow key={item.id} integration={item} compact />)}</div></div>}
    <div className="mt-8 flex justify-between border-t border-border pt-5"><button disabled={step === 1} onClick={() => setStep((value) => value - 1)} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold disabled:opacity-40"><ArrowLeft size={15} /> Back</button>{step < 5 ? <button onClick={() => setStep((value) => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Continue <ArrowRight size={15} /></button> : <button onClick={complete} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Finish setup <Check size={15} /></button>}</div>
  </div></div>;
}

function ItemList<T>({ items, empty, render }: { items: T[]; empty: string; render: (item: T) => ReactNode }) {
  return <div className="mt-6 space-y-2">{items.length ? items.map(render) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">{empty}</div>}</div>;
}

function GoalsPage() {
  const { data, update } = useNutty();
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("Personal");
  const add = () => { if (!value.trim()) return; const goal: Goal = { id: makeId("goal"), title: value.trim(), category, completed: false }; update((current) => ({ ...current, goals: [...current.goals, goal] })); setValue(""); };
  const toggle = (goalId: string) => update((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === goalId ? { ...goal, completed: !goal.completed } : goal) }));
  const remove = (goalId: string) => update((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== goalId) }));
  return <div className="animate-rise"><PageHeading eyebrow="Goals · outcomes to actions" title="What matters next?" detail="Goals are user-defined. NUTTY can later decompose them into milestones, projects, tasks, routines, and calendar actions." action={<Link href="/onboarding" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold"><SlidersHorizontal size={15} /> Setup</Link>} /><div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="surface rounded-2xl p-5 sm:p-7"><div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="Add a goal in your own words..." className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none"><option>Personal</option><option>Fitness</option><option>Health</option><option>School</option><option>Work</option><option>Career</option><option>Finance</option><option>Project</option></select><button onClick={add} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><div className="mt-6 space-y-2">{data.goals.length ? data.goals.map((goal) => <div key={goal.id} className={`flex items-center gap-3 rounded-xl border p-4 ${goal.completed ? "border-emerald-300/30 bg-emerald-300/5" : "border-border bg-secondary/40"}`}><button onClick={() => toggle(goal.id)} className={`grid h-7 w-7 place-items-center rounded-lg border ${goal.completed ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-muted-foreground/40"}`}>{goal.completed && <Check size={14} />}</button><span className={`text-sm font-semibold ${goal.completed ? "text-muted-foreground line-through" : ""}`}>{goal.title}</span><span className="mono ml-auto text-[9px] uppercase tracking-wider text-muted-foreground">{goal.category}</span><button onClick={() => remove(goal.id)} aria-label={`Delete ${goal.title}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button></div>) : <EmptyState icon={Target} title="No goals yet" body="NUTTY will not fill this page with sample objectives. Add the first outcome you actually care about." actions={<Link href="/onboarding" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Complete setup</Link>} />}</div></div><div className="surface h-fit rounded-2xl p-5"><p className="eyebrow">Goal architecture</p><div className="mt-5 space-y-3 text-sm text-muted-foreground">{["Outcome", "Milestones", "Projects", "Tasks", "Calendar actions"].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="mono text-xs text-primary">0{index + 1}</span>{item}{index < 4 && <ArrowRight size={13} className="ml-auto" />}</div>)}</div></div></div></div>;
}

function TasksPage() {
  const { data, update } = useNutty();
  const [value, setValue] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const add = () => { if (!value.trim()) return; const task: Task = { id: makeId("task"), title: value.trim(), due: new Date().toISOString().slice(0, 10), priority, completed: false }; update((current) => ({ ...current, tasks: [...current.tasks, task] })); setValue(""); };
  const toggle = (taskId: string) => update((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task) }));
  const remove = (taskId: string) => update((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
  return <div className="animate-rise"><PageHeading eyebrow="Tasks · universal task engine" title="Keep the next move clear." detail="Natural-language capture comes first. Due dates, priority, project links, energy, and dependencies can grow with your model." action={<Link href="/ai" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Brain size={15} /> Ask NUTTY</Link>} /><div className="surface rounded-2xl p-5 sm:p-7"><div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="e.g. Review the proposal tomorrow..." className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><select value={priority} onChange={(event) => setPriority(event.target.value as Task["priority"])} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none"><option value="low">Low priority</option><option value="medium">Medium</option><option value="high">High priority</option></select><button onClick={add} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><div className="mt-6 space-y-2">{data.tasks.length ? data.tasks.map((task) => <div key={task.id} className={`flex items-center gap-3 rounded-xl border p-4 ${task.completed ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/40"}`}><button onClick={() => toggle(task.id)} className={`grid h-6 w-6 place-items-center rounded-full border ${task.completed ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>{task.completed && <Check size={13} />}</button><span className={`text-sm font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</span><span className={`mono ml-auto text-[9px] uppercase tracking-wider ${task.priority === "high" ? "text-orange-300" : "text-muted-foreground"}`}>{task.priority}</span><button onClick={() => remove(task.id)} aria-label={`Delete ${task.title}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></button></div>) : <EmptyState icon={CheckSquare2} title="No tasks in the system" body="Capture a real next action. NUTTY will not manufacture a productivity backlog for you." actions={<Link href="/onboarding" className="rounded-xl border border-border px-4 py-3 text-sm font-bold">Add context</Link>} />}</div></div></div>;
}

function CalendarPage() {
  const { data, update } = useNutty();
  const [view, setView] = useState("Agenda");
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [commitment, setCommitment] = useState<CalendarEvent["commitment"]>("hard");
  const add = () => { if (!title.trim()) return; const date = new Date().toISOString().slice(0, 10); const event: CalendarEvent = { id: makeId("event"), title: title.trim(), start: `${date}T${start}`, end: `${date}T${end}`, category: "Personal", location: "", notes: "", recurrence: "", priority: "medium", commitment }; update((current) => ({ ...current, events: [...current.events, event] })); setTitle(""); };
  const remove = (eventId: string) => update((current) => ({ ...current, events: current.events.filter((event) => event.id !== eventId) }));
  const sorted = [...data.events].sort((a, b) => a.start.localeCompare(b.start));
  const conflict = sorted.some((event, index) => index > 0 && event.start < sorted[index - 1].end);
  return <div className="animate-rise"><PageHeading eyebrow="Calendar OS · universal timeline" title="See the shape of your time." detail="Day, 3-day, week, month, and agenda views share one event model. Conflicts and free time are calculated from what is available." action={<div className="flex gap-2">{["Day", "3-day", "Week", "Month", "Agenda"].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-xl px-3 py-2 text-xs font-bold ${view === item ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{item}</button>)}</div>} /><div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="surface rounded-2xl p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">{view} view</p><p className="mt-1 text-sm text-muted-foreground">{sorted.length ? `${sorted.length} event${sorted.length === 1 ? "" : "s"} in your model` : "No events in your model"}</p></div>{conflict && <span className="rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-semibold text-orange-200">Conflict detected</span>}</div><div className="mt-6 space-y-2">{sorted.length ? sorted.map((event) => <div key={event.id} className="flex gap-3 rounded-xl border border-border bg-secondary/35 p-4"><div className="w-16 shrink-0"><p className="mono text-xs text-primary">{event.start.slice(11, 16)}</p><p className="mono mt-1 text-[10px] text-muted-foreground">{event.end.slice(11, 16)}</p></div><div className="min-w-0 flex-1 border-l border-primary/25 pl-3"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{event.title}</p><span className="mono rounded-full bg-secondary px-2 py-1 text-[9px] uppercase text-muted-foreground">{event.commitment}</span></div><p className="mt-1 text-xs text-muted-foreground">{event.category}{event.location ? ` · ${event.location}` : ""}</p></div><button onClick={() => remove(event.id)} aria-label={`Delete ${event.title}`} className="self-start rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button></div>) : <EmptyState icon={CalendarDays} title="Your timeline is clear" body="Add a commitment or connect a calendar. NUTTY will never imply access to an external calendar you have not authorized." actions={<Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review connections</Link>} />}</div></div><div className="space-y-4"><div className="surface rounded-2xl p-5"><p className="eyebrow">Add time</p><div className="mt-4 space-y-2"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event or commitment" className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none focus:border-primary/60" /><div className="grid grid-cols-2 gap-2"><input type="time" value={start} onChange={(event) => setStart(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none" /><input type="time" value={end} onChange={(event) => setEnd(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none" /></div><select value={commitment} onChange={(event) => setCommitment(event.target.value as CalendarEvent["commitment"])} className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none"><option value="hard">Hard commitment</option><option value="flexible">Flexible block</option></select><button onClick={add} className="w-full rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground">Add event</button></div></div><div className="surface rounded-2xl p-5"><p className="eyebrow">Schedule intelligence</p><div className="mt-5 space-y-4 text-sm">{[["Must happen", "Hard commitments"], ["Should happen", "Important tasks"], ["Could happen", "Flexible actions"], ["Free time", conflict ? "Resolve the overlap first" : "Open space can be protected"]].map(([label, detail]) => <div key={label} className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-primary" /><div><p className="font-bold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></div>)}</div></div></div></div></div>;
}

function AiPage() {
  const { data, update } = useNutty();
  const [messages, setMessages] = useState<Array<{ role: "nutty" | "you"; text: string; intent?: string }>>([{ role: "nutty", text: "I’m here. I can use the context you have shared, explain what informed a recommendation, and ask before taking action." }]);
  const [input, setInput] = useState(() => window.localStorage.getItem("nutty-last-command") || "");
  const send = (text = input) => { if (!text.trim()) return; const reply = respondToIntent(text, data); setMessages((items) => [...items, { role: "you", text }, { role: "nutty", text: reply.text, intent: reply.intent }]); update((current) => ({ ...current, voiceHistory: current.voiceHistory })); setInput(""); window.localStorage.removeItem("nutty-last-command"); };
  return <div className="animate-rise"><PageHeading eyebrow="NUTTY AI · context and decision layer" title="Talk it through." detail="The current provider is deterministic and transparent. It demonstrates the product surface while leaving room for a future real AI provider." /><div className="mx-auto max-w-3xl"><div className="surface soft-grid min-h-[500px] rounded-2xl p-4 sm:p-7"><div className="mb-8 flex items-center gap-3 border-b border-border pb-5"><img src={asset("/nutty-logo.png")} alt="" className="h-10 w-10 rounded-xl object-cover" /><div><p className="text-sm font-bold">NUTTY AI</p><p className="mono text-[10px] uppercase tracking-widest text-primary">Context engine · {data.goals.length + data.tasks.length + data.events.length} signals</p></div><Link href="/memory" className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-secondary"><MoreHorizontal size={19} /></Link></div><div className="space-y-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "you" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "you" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-secondary/70"}`}>{message.text}{message.intent && <span className="mono mt-2 block text-[9px] uppercase tracking-widest opacity-60">{message.intent}</span>}</div></div>)}</div><div className="mt-8 flex flex-wrap gap-2">{["What should I do?", "I’m overwhelmed", "Plan my day", "Check my socials", "What do I need to pay?"].map((prompt) => <button key={prompt} onClick={() => send(prompt)} className="rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground">{prompt}</button>)}</div></div><form onSubmit={(event) => { event.preventDefault(); send(); }} className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 pl-4"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Say anything..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="submit" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Send size={16} /></button></form><p className="mt-3 text-center text-[11px] text-muted-foreground">Recommendations show their intent and source. External actions always require approval.</p></div></div>;
}

function MemoryPage() {
  const { data, update } = useNutty();
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("Preferences");
  const add = () => { if (!value.trim()) return; const memory: Memory = { id: makeId("memory"), category, value: value.trim(), source: "Added by you", createdAt: new Date().toISOString().slice(0, 10), confidence: "high", confirmed: true }; update((current) => ({ ...current, memories: [...current.memories, memory] })); setValue(""); };
  const remove = (memoryId: string) => update((current) => ({ ...current, memories: current.memories.filter((memory) => memory.id !== memoryId) }));
  return <div className="animate-rise"><PageHeading eyebrow="Memory OS · user-controlled context" title="What NUTTY remembers." detail="Every memory has a value, source, timestamp, confidence, and confirmation state. Edit or remove it whenever you want." action={<Link href="/privacy" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Privacy controls</Link>} /><div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="surface rounded-2xl p-5 sm:p-7"><div className="grid gap-2 sm:grid-cols-[150px_1fr_auto]"><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none">{["Identity", "Preferences", "Goals", "Routines", "Important facts", "Fitness", "Food", "School", "Work", "Finance", "Planning", "Communication", "Personal rules"].map((item) => <option key={item}>{item}</option>)}</select><input value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder="Tell NUTTY something you want remembered..." className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none focus:border-primary/60" /><button onClick={add} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"><Plus size={17} /></button></div><div className="mt-6 space-y-2">{data.memories.length ? data.memories.map((memory) => <div key={memory.id} className="rounded-xl border border-border bg-secondary/40 p-4"><div className="flex items-start gap-3"><Brain size={16} className="mt-0.5 text-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{memory.value}</p><span className="mono rounded-full bg-primary/10 px-2 py-1 text-[9px] uppercase text-primary">{memory.category}</span></div><p className="mt-2 text-[11px] text-muted-foreground">Source: {memory.source} · {memory.createdAt} · {memory.confidence} confidence · {memory.confirmed ? "confirmed" : "unconfirmed"}</p></div><button onClick={() => remove(memory.id)} aria-label={`Delete memory ${memory.value}`} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button></div></div>) : <EmptyState icon={Brain} title="Your memory is ready for its first signal" body="NUTTY has not learned anything about you yet. Tell it something, complete setup, or import authorized context." actions={<Link href="/onboarding" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Complete setup</Link>} />}</div></div><div className="surface h-fit rounded-2xl p-5"><p className="eyebrow">Memory rules</p><div className="mt-5 space-y-3 text-sm text-muted-foreground">{["Never invent a memory", "Show the source", "Ask when uncertain", "Keep it editable", "Delete on request"].map((rule) => <div key={rule} className="flex items-center gap-3"><CheckCircle2 size={15} className="text-primary" />{rule}</div>)}</div></div></div></div>;
}

function ModulePage({ eyebrow, title, detail, icon: Icon, titleEmpty, bodyEmpty, actions, children }: { eyebrow: string; title: string; detail: string; icon: any; titleEmpty?: string; bodyEmpty?: string; actions?: ReactNode; children?: ReactNode }) {
  return <div className="animate-rise"><PageHeading eyebrow={eyebrow} title={title} detail={detail} />{children || <EmptyState icon={Icon} title={titleEmpty || "No context yet"} body={bodyEmpty || "Add context or connect an authorized provider. NUTTY will not fabricate personal data."} actions={actions} />}</div>;
}

function FitnessPage() {
  const {data, demoMode} = useNutty();
  return <ModulePage eyebrow="Fitness OS · context-aware training" title="Train with actual context." detail="Fitness can read sleep, schedule, training history, recovery, available time, and goals once those signals exist." icon={Dumbbell} titleEmpty="No fitness data yet" bodyEmpty="Add training context or connect a health source. NUTTY will not fabricate workouts, body metrics, or readiness." actions={<><Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review health connection</Link><Link href="/memory" className="rounded-xl border border-border px-4 py-3 text-sm font-bold">Add a fitness memory</Link></>}>{demoMode ? <div className="grid gap-4 lg:grid-cols-3"><DemoBadge /><div className="surface rounded-2xl p-5"><p className="eyebrow">Today’s context</p><p className="mt-3 text-2xl font-bold">60 min available</p><p className="mt-1 text-xs text-muted-foreground">Flexible training block after your commitments.</p></div><div className="surface rounded-2xl p-5"><p className="eyebrow">Suggested session</p><p className="mt-3 text-2xl font-bold">Upper body</p><p className="mt-1 text-xs text-muted-foreground">Demo recommendation · approval required.</p></div><div className="surface rounded-2xl p-5"><p className="eyebrow">Recovery signal</p><p className="mt-3 text-2xl font-bold">Needs input</p><p className="mt-1 text-xs text-muted-foreground">Sleep and recent workload are not real data yet.</p></div></div> : undefined}</ModulePage>;
}

function LearningPage() { return <ModulePage eyebrow="Learning OS" title="Learn on purpose." detail="Courses, notes, flashcards, practice, and revision can share context with your goals and calendar." icon={BookOpen} titleEmpty="No learning context yet" bodyEmpty="Add a learning goal, class, assignment, or study routine to begin." actions={<Link href="/goals" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Add a learning goal</Link>} />; }
function WorkPage() { return <ModulePage eyebrow="Work OS" title="Work with less friction." detail="Projects, meetings, focus blocks, follow-ups, and career goals belong in one connected system." icon={BriefcaseBusiness} titleEmpty="No work context yet" bodyEmpty="Add a work goal, project, meeting, or commitment when you are ready." actions={<Link href="/calendar" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Add work time</Link>} />; }
function LifePage() { return <ModulePage eyebrow="Life OS" title="Make room for life." detail="Home, errands, habits, routines, travel, and personal commitments can live alongside work and goals." icon={House} titleEmpty="No life context yet" bodyEmpty="Add a routine, errand, trip, or personal commitment to make this space useful." actions={<Link href="/onboarding" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Add a routine</Link>} />; }

function EmailPage() {
  const { data } = useNutty();
  const [filter, setFilter] = useState("All");
  const categories = ["All", "requires_action", "financial", "work", "school", "informational"];
  const items = data.emails.filter((email) => filter === "All" || email.category === filter);
  return <ModulePage eyebrow="Email OS · provider abstraction" title="Know what needs attention." detail="Inbox, important, unread, reply-needed, deadlines, receipts, bills, and subscriptions stay separate from personal assumptions." icon={Mail} actions={<Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Connect email</Link>}>{data.emails.length ? <div className="surface rounded-2xl p-5 sm:p-7"><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{item.replace("_", " ")}</button>)}</div><div className="mt-5 space-y-2">{items.map((email) => <div key={email.id} className={`flex gap-3 rounded-xl border p-4 ${email.unread ? "border-primary/25 bg-primary/5" : "border-border bg-secondary/30"}`}><Mail size={16} className={`mt-1 ${email.unread ? "text-primary" : "text-muted-foreground"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{email.subject}</p><span className="mono rounded-full bg-secondary px-2 py-1 text-[9px] uppercase text-muted-foreground">{email.category.replace("_", " ")}</span></div><p className="mt-1 text-xs text-muted-foreground">{email.sender} · {email.preview}</p></div>{email.needsReply && <span className="mono self-start text-[9px] uppercase text-orange-300">Reply</span>}</div>)}</div></div> : <EmptyState icon={Mail} title="Email is not connected" body="Connect a provider or enable Demo mode to see a clearly labeled inbox. NUTTY will never invent email content." actions={<Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review connections</Link>} />}</ModulePage>;
}

function MoneyPage() {
  const { data, update } = useNutty();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const addExpense = () => { const value = Number(amount); if (!name.trim() || !value) return; const expense: Expense = { id: makeId("expense"), name: name.trim(), amount: value, category: "Other", date: new Date().toISOString().slice(0, 10) }; update((current) => ({ ...current, expenses: [...current.expenses, expense] })); setName(""); setAmount(""); };
  const total = data.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return <div className="animate-rise"><PageHeading eyebrow="Money OS · optional and permissioned" title="Make money visible." detail="Track user-entered or authorized income, expenses, budgets, savings goals, bills, subscriptions, and purchases. NUTTY never accesses financial data silently." action={<Link href="/integrations" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Money permissions</Link>} /><div className="grid gap-4 md:grid-cols-3"><div className="surface rounded-2xl p-5"><p className="eyebrow">Recorded expenses</p><p className="mt-3 text-3xl font-bold">R {total.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">{data.expenses.length} user-entered record{data.expenses.length === 1 ? "" : "s"}</p></div><div className="surface rounded-2xl p-5"><p className="eyebrow">Active bills</p><p className="mt-3 text-3xl font-bold">{data.bills.length}</p><p className="mt-1 text-xs text-muted-foreground">Review due dates and renewals below.</p></div><div className="surface rounded-2xl p-5"><p className="eyebrow">Monthly recurring</p><p className="mt-3 text-3xl font-bold">R {data.bills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">From available bill context.</p></div></div><div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]"><div className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="eyebrow">Bills & subscriptions</p><h2 className="display mt-1 text-xl font-bold">What needs attention?</h2></div><DemoBadge /></div>{data.bills.length ? <div className="mt-5 space-y-2">{data.bills.map((bill) => <div key={bill.id} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/35 p-4"><WalletCards size={16} className="text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-bold">{bill.name}</p><p className="mt-1 text-xs text-muted-foreground">{bill.provider} · {bill.frequency} · next {bill.nextPayment}</p></div><span className="text-sm font-bold">{bill.currency} {bill.amount}</span></div>)}</div> : <EmptyState icon={WalletCards} title="No bills or subscriptions yet" body="Add a recurring payment or connect an authorized finance source. Nothing is inferred." />}</div><div className="surface h-fit rounded-2xl p-5"><p className="eyebrow">Manual expense</p><div className="mt-4 space-y-2"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="What did you spend on?" className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none" /><input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0" step="0.01" placeholder="Amount" className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none" /><button onClick={addExpense} className="w-full rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground">Add expense</button></div></div></div></div>;
}

function SocialPage() {
  const { data } = useNutty();
  return <ModulePage eyebrow="Social OS · provider abstraction" title="Keep your social attention intentional." detail="LinkedIn, Instagram, and WhatsApp use separate provider interfaces. NUTTY summarizes available items but never claims account access without authorization." icon={MessageSquare} actions={<Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Review social permissions</Link>}>{data.social.length ? <div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="eyebrow">Social digest</p><h2 className="display mt-1 text-xl font-bold">What is important?</h2></div><DemoBadge /></div><div className="mt-5 space-y-2">{data.social.map((item: SocialItem) => <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-secondary/35 p-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">{item.provider === "LinkedIn" ? <BriefcaseBusiness size={15} /> : item.provider === "Instagram" ? <Activity size={15} /> : <MessageSquare size={15} />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-bold">{item.title}</p><span className="mono text-[9px] uppercase text-muted-foreground">{item.provider}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div></div>)}</div></div><div className="surface h-fit rounded-2xl p-5"><p className="eyebrow">Ask NUTTY</p><div className="mt-5 space-y-2">{["Summarize my socials", "What's important?", "Do I need to reply?", "What's trending?"].map((prompt) => <Link href={`/ai?prompt=${encodeURIComponent(prompt)}`} key={prompt} className="flex items-center justify-between rounded-xl border border-border p-3 text-xs font-semibold hover:border-primary/50">{prompt}<ArrowUpRight size={14} /></Link>)}</div></div></div> : <EmptyState icon={MessageSquare} title="Social is not connected" body="Connect an account or enable Demo mode. Demo Social Data will always be labeled and separated from your real account." actions={<Link href="/integrations" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Open connections</Link>} />}</ModulePage>;
}

function VoicePage() {
  const { data, update } = useNutty();
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("Ready for a mock voice command");
  const [turns, setTurns] = useState<VoiceTurn[]>(data.voiceHistory);
  const run = (command: string) => { if (!command.trim()) return; const result = respondToIntent(command, data); const next = [...turns, { id: makeId("voice"), speaker: "you" as const, text: command, intent: result.intent }, { id: makeId("voice"), speaker: "nutty" as const, text: result.text }]; setTurns(next); update((current) => ({ ...current, voiceHistory: next })); setText(""); setStatus(`Intent detected · ${result.intent}`); setListening(false); };
  const listen = () => { setListening(true); setStatus("Listening"); window.setTimeout(() => { setListening(false); setStatus("Processing"); window.setTimeout(() => { setStatus("Ready for a mock voice command"); }, 500); }, 1000); };
  return <div className="animate-rise"><PageHeading eyebrow="Voice OS · MockVoiceProvider" title="Speak to your personal OS." detail="This mock provider demonstrates microphone, listening, processing, transcript, response, history, and intent mapping without claiming access to a real speech service." action={<Link href="/settings" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Voice settings</Link>} /><div className="grid gap-4 lg:grid-cols-[320px_1fr]"><div className="surface flex flex-col items-center justify-center rounded-2xl p-8 text-center"><button onClick={listen} className={`grid h-28 w-28 place-items-center rounded-full border ${listening ? "border-primary bg-primary/20 text-primary shadow-[0_0_50px_rgba(90,150,255,.35)]" : "border-border bg-secondary text-muted-foreground"} transition`}><Mic size={34} /></button><p className="mt-5 text-sm font-bold">{status}</p><p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">Try “Hey NUTTY, what should I do today?” or choose a command below.</p><div className="mt-5 flex flex-wrap justify-center gap-2">{["What do I have today?", "Check my socials", "What do I need to pay?", "Plan my afternoon"].map((prompt) => <button key={prompt} onClick={() => run(prompt)} className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/50">{prompt}</button>)}</div></div><div className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="eyebrow">Conversation history</p><h2 className="display mt-1 text-xl font-bold">Voice intent system</h2></div><span className="mono rounded-full bg-primary/10 px-2 py-1 text-[9px] uppercase text-primary">Mock provider</span></div><form onSubmit={(event) => { event.preventDefault(); run(text); }} className="mt-5 flex gap-2"><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Type the transcript to simulate..." className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm outline-none" /><button className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Run</button></form><div className="mt-5 space-y-3">{turns.length ? turns.map((turn) => <div key={turn.id} className={`rounded-xl border p-4 ${turn.speaker === "you" ? "border-primary/25 bg-primary/5" : "border-border bg-secondary/35"}`}><p className="mono text-[9px] uppercase tracking-widest text-muted-foreground">{turn.speaker === "you" ? "Transcript" : "NUTTY response"}{turn.intent ? ` · ${turn.intent}` : ""}</p><p className="mt-2 text-sm leading-relaxed">{turn.text}</p></div>) : <p className="py-8 text-center text-sm text-muted-foreground">No voice turns yet.</p>}</div></div></div></div>;
}

function NotificationsPage() {
  const { data, update } = useNutty();
  const active = data.notifications.filter((item) => !item.snoozed);
  const markRead = (id: string) => update((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item) }));
  const snooze = (id: string) => update((current) => ({ ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, snoozed: true } : item) }));
  return <div className="animate-rise"><PageHeading eyebrow="Notification OS · attention center" title="Review what deserves your attention." detail="Urgent, action-required, reminder, calendar, fitness, school, work, finance, social, recommendation, and news items explain their source." action={<Link href="/settings" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Notification preferences</Link>} /><div className="surface rounded-2xl p-5 sm:p-7">{active.length ? <div className="space-y-2">{active.map((item: NotificationItem) => <div key={item.id} className={`rounded-xl border p-4 ${item.read ? "border-border bg-secondary/25" : "border-primary/25 bg-primary/5"}`}><div className="flex items-start gap-3"><Bell size={16} className="mt-1 text-primary" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold">{item.title}</p><span className="mono rounded-full bg-secondary px-2 py-1 text-[9px] uppercase text-muted-foreground">{item.category}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p><p className="mt-2 text-[10px] text-muted-foreground">Why you are seeing this: {item.source}</p></div><div className="flex gap-1">{!item.read && <button onClick={() => markRead(item.id)} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold">Read</button>}<button onClick={() => snooze(item.id)} className="rounded-lg border border-border px-2 py-1.5 text-[10px] font-bold">Snooze</button></div></div></div>)}</div> : <EmptyState icon={Bell} title="Your attention queue is clear" body="NUTTY will show recommendations only when they come from available context." />}</div></div>;
}

function EveningPage() {
  const { data } = useNutty();

  const reviewStats: [string, string | number, LucideIcon][] = [
    ["Completed tasks", data.tasks.filter((task) => task.completed).length, CheckCircle2],
    ["Open tasks", data.tasks.filter((task) => !task.completed).length, ListChecks],
    ["Calendar items", data.events.length, CalendarDays],
    ["Goals", data.goals.length, Target],
    ["Memories", data.memories.length, Brain],
    ["Tomorrow preview", data.events[0]?.title || "No events available", Clock3],
  ];

  return (
    <div className="animate-rise">
      <PageHeading
        eyebrow="Evening review · close the loop"
        title="What changed today?"
        detail="Review completed work, missed tasks, calendar context, goals, notifications, and tomorrow's first signal."
        action={
          <Link href="/ai" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">
            Talk it through
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviewStats.map(([label, value, Icon]) => (
          <div key={label} className="surface rounded-2xl p-5">
            <Icon size={18} className="text-primary" />
            <p className="eyebrow mt-5">{label}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 surface rounded-2xl p-6">
        <p className="eyebrow">Review prompts</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {["What changed today?", "What should move to tomorrow?", "Anything you want me to remember?"].map((prompt) => (
            <Link
              href={`/ai?prompt=${encodeURIComponent(prompt)}`}
              key={prompt}
              className="rounded-xl border border-border bg-secondary/35 p-4 text-sm font-semibold hover:border-primary/50"
            >
              {prompt}
              <ArrowUpRight size={14} className="mt-3 text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
// Real Browser Integration Handlers
async function requestRealIntegration(id: string): Promise<boolean> {
  switch (id) {
    case "notifications": {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return false;
      }
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("NUTTY OS Connected", {
          body: "Real-time system notifications are now active.",
        });
        return true;
      }
      alert("Notification permissions were denied.");
      return false;
    }

    case "voice": {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop stream immediately after confirming hardware permission
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch {
        alert("Microphone access was denied or no microphone was found.");
        return false;
      }
    }

    case "calendar":
    case "email": {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        const scopes = id === "calendar" 
          ? "https://www.googleapis.com/auth/calendar.readonly" 
          : "https://www.googleapis.com/auth/gmail.readonly";

        alert(`Google OAuth requires VITE_GOOGLE_CLIENT_ID in your .env file.\n\nRequired Scope:\n${scopes}`);
        return false;
      }

      // Standard Google OAuth 2.0 Implicit Grant / Auth Code Flow
      const redirectUri = `${window.location.origin}/oauth/callback`;
      const scope = id === "calendar"
        ? "https://www.googleapis.com/auth/calendar.readonly"
        : "https://www.googleapis.com/auth/gmail.readonly";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

      window.open(authUrl, "GoogleAuth", "width=500,height=600");
      return true;
    }

    default:
      alert(`Connecting to real backend for '${id}' requires external API credentials.`);
      return false;
  }
}
function IntegrationRow({ integration, compact = false }: { integration: Integration; compact?: boolean }) {
  const { update, setDemoMode } = useNutty();

  const handleConnect = async () => {
    const success = await requestRealIntegration(integration.id);
    if (success) {
      update((current) => ({
        ...current,
        integrations: current.integrations.map((item) =>
          item.id === integration.id
            ? { ...item, status: "connected", lastTested: new Date().toISOString().slice(0, 10) }
            : item
        ),
      }));
    } else {
      update((current) => ({
        ...current,
        integrations: current.integrations.map((item) =>
          item.id === integration.id ? { ...item, status: "needs_attention" } : item
        ),
      }));
    }
  };

  const disconnect = () =>
    update((current) => ({
      ...current,
      integrations: current.integrations.map((item) =>
        item.id === integration.id ? { ...item, status: "not_configured", lastTested: undefined } : item
      ),
    }));

  const test = async () => {
    if (integration.id === "notifications" && Notification.permission === "granted") {
      new Notification("NUTTY OS Test", { body: "Integration test successful!" });
    }
    update((current) => ({
      ...current,
      integrations: current.integrations.map((item) =>
        item.id === integration.id ? { ...item, lastTested: new Date().toISOString().slice(0, 10) } : item
      ),
    }));
  };

  const demo = () => {
    setDemoMode(true);
    update((current) => ({
      ...current,
      integrations: current.integrations.map((item) =>
        item.id === integration.id
          ? { ...item, status: "demo", lastTested: new Date().toISOString().slice(0, 10) }
          : item
      ),
    }));
  };

  return (
    <div className={`rounded-xl border border-border bg-secondary/30 p-4 ${compact ? "" : "surface"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
          {integration.id === "calendar" ? (
            <CalendarDays size={16} />
          ) : integration.id === "email" ? (
            <Mail size={16} />
          ) : integration.id === "voice" ? (
            <Mic size={16} />
          ) : (
            <PlugIcon id={integration.id} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{integration.name}</p>
            <span
              className={`mono rounded-full px-2 py-1 text-[9px] uppercase ${
                integration.status === "demo"
                  ? "bg-amber-300/10 text-amber-200"
                  : integration.status === "connected"
                  ? "bg-emerald-300/10 text-emerald-200"
                  : integration.status === "needs_attention"
                  ? "bg-orange-300/10 text-orange-200"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {integration.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{integration.description}</p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 rounded-xl border border-border/70 bg-background/30 p-3">
          <p className="mono text-[9px] uppercase tracking-wider text-muted-foreground">Permission information</p>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {integration.permissions.map((permission) => (
              <li key={permission}>· {permission}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(integration.status === "not_configured" || integration.status === "needs_attention") && (
          <button
            onClick={handleConnect}
            className="rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
          >
            {integration.status === "needs_attention" ? "Authorize permission" : "Connect"}
          </button>
        )}

        {integration.status === "connected" && (
          <button onClick={test} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">
            Test connection
          </button>
        )}

        <button onClick={demo} className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold">
          Use demo
        </button>

        {integration.status !== "not_configured" && (
          <button
            onClick={disconnect}
            className="rounded-lg border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground"
          >
            Disconnect
          </button>
        )}
      </div>

      {integration.lastTested && (
        <p className="mt-2 text-[10px] text-muted-foreground">Last active {integration.lastTested}</p>
      )}
    </div>
  );
}

function PlugIcon({ id }: { id: string }) {
  if (id === "health") return <Dumbbell size={16} />;
  if (id === "finance") return <WalletCards size={16} />;
  if (id === "social") return <MessageSquare size={16} />;
  if (id === "notifications") return <Bell size={16} />;
  return <PlugZap size={16} />;
}

function IntegrationsPage() {
  const { data } = useNutty();
  return <div className="animate-rise"><PageHeading eyebrow="Integrations · permissions center" title="Connect only what helps." detail="Every provider shows what it accesses, why it accesses it, what it can do, what it cannot do, and how to disconnect. Unavailable real providers remain honest." action={<Link href="/onboarding" className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Setup checklist</Link>} /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{(data.integrations.length ? data.integrations : integrationCatalog).map((integration) => <IntegrationRow key={integration.id} integration={integration} />)}</div></div>;
}

function SettingsPage() {
  const { data, update, demoMode, setDemoMode } = useNutty();
  const autonomy = [["manual", "Manual", "NUTTY recommends only."], ["assisted", "Assisted", "NUTTY prepares actions for approval."], ["proactive", "Proactive", "NUTTY can perform low-risk actions within configured permissions."], ["automated", "Automated", "NUTTY can perform explicitly authorized recurring workflows."]]; 
  return <div className="animate-rise"><PageHeading eyebrow="Settings · your operating system" title="Make NUTTY yours." detail="Choose how NUTTY communicates, plans, notifies, and asks for approval." /><div className="grid gap-4 lg:grid-cols-2"><div className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRound size={18} /></span><div><p className="eyebrow">Account</p><p className="text-sm font-bold">{data.profile.name || "Your profile is not configured"}</p></div></div><div className="mt-6 space-y-3"><Link href="/onboarding" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-semibold hover:border-primary/50">Profile and onboarding <ArrowRight size={15} /></Link><Link href="/privacy" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-semibold hover:border-primary/50">Privacy and export <ArrowRight size={15} /></Link><Link href="/integrations" className="flex items-center justify-between rounded-xl border border-border p-3 text-sm font-semibold hover:border-primary/50">Integrations and permissions <ArrowRight size={15} /></Link></div></div><div className="surface rounded-2xl p-5 sm:p-7"><p className="eyebrow">Autonomy levels</p><div className="mt-5 space-y-2">{autonomy.map(([value, label, detail]) => <button key={value} onClick={() => update((current) => ({ ...current, autonomy: value as NuttyData["autonomy"] }))} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${data.autonomy === value ? "border-primary/50 bg-primary/5" : "border-border bg-secondary/30"}`}><span className={`mt-1 h-2.5 w-2.5 rounded-full ${data.autonomy === value ? "bg-primary" : "bg-muted-foreground/50"}`} /><span><span className="block text-sm font-bold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{detail}</span></span></button>)}</div></div><div className="surface rounded-2xl p-5 sm:p-7"><p className="eyebrow">Demo mode</p><div className="mt-4 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">{demoMode ? "Demo data is active" : "Real-user mode"}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{demoMode ? "All simulated records are labeled Demo Data and come through mock providers." : "Your account starts blank. Only user input or authorized providers can add personal context."}</p></div><button onClick={() => setDemoMode(!demoMode)} className={`h-7 w-12 shrink-0 rounded-full p-1 transition ${demoMode ? "bg-amber-300" : "bg-secondary"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${demoMode ? "translate-x-5" : ""}`} /></button></div></div><div className="surface rounded-2xl p-5 sm:p-7"><p className="eyebrow">Response and attention</p><div className="mt-5 space-y-4">{[["Appearance", "Dark · premium"], ["Response length", "Concise by default"], ["Planning style", "Context first"], ["Approval policy", "Ask before acting"]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>)}</div></div></div></div>;
}

function PrivacyPage() {
  const { data } = useNutty();
  const exportData = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "nutty-data-export.json"; link.click(); URL.revokeObjectURL(url); };
  return <div className="animate-rise"><PageHeading eyebrow="Privacy · control center" title="Your data stays yours." detail="Permissions, memory, exports, deletion, autonomy, and AI boundaries should remain understandable." /><div className="grid gap-4 md:grid-cols-2"><div className="surface rounded-2xl p-5 sm:p-7"><ShieldCheck className="text-primary" size={20} /><h2 className="display mt-5 text-lg font-bold">Data permissions</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">External services remain disconnected until you authorize them. Each provider shows its read and action boundaries.</p><Link href="/integrations" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary">Review permissions <ArrowRight size={14} /></Link></div><div className="surface rounded-2xl p-5 sm:p-7"><Download className="text-primary" size={20} /><h2 className="display mt-5 text-lg font-bold">Export your context</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Download the current locally stored NUTTY context as JSON. Server export can replace this when database persistence is connected.</p><button onClick={exportData} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground">Download export <Download size={14} /></button></div><div className="surface rounded-2xl p-5 sm:p-7"><KeyRound className="text-primary" size={20} /><h2 className="display mt-5 text-lg font-bold">AI boundaries</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Recommendations show their source and confidence. External actions require approval unless you deliberately configure an autonomy level.</p></div><div className="surface rounded-2xl p-5 sm:p-7"><Trash2 className="text-primary" size={20} /><h2 className="display mt-5 text-lg font-bold">Deletion and disconnect</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Disconnect providers from Integrations. Delete individual memories, goals, tasks, events, and expenses from their modules.</p><Link href="/integrations" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-primary">Manage connections <ArrowRight size={14} /></Link></div></div></div>;
}

function ProtectedArea() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/" />;
  return <NuttyProvider><ProtectedRoutes /></NuttyProvider>;
}
function ProtectedRoutes() {
  const { data, update } = useNutty();
  const [location] = useLocation();

  if (!data.onboardingComplete && location !== "/onboarding") {
    return <Redirect to="/onboarding" />;
  }

  return (
    <AppShell>
      {/* Universal Floating/Header Voice Engine */}
      <div className="p-4 border-b border-border bg-card/30 backdrop-blur flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Hands-Free Voice Hub
        </span>
        <JarvisVoice data={data} onUpdateData={update} />
      </div>

      <Switch>
        <Route path="/today" component={TodayPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/goals" component={GoalsPage} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/timeline" component={CalendarPage} />
        <Route path="/ai" component={AiPage} />
        <Route path="/memory" component={MemoryPage} />
        <Route path="/email" component={EmailPage} />
        <Route path="/social" component={SocialPage} />
        <Route path="/voice" component={VoicePage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/evening" component={EveningPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/fitness" component={FitnessPage} />
        <Route path="/train" component={FitnessPage} />
        <Route path="/learning" component={LearningPage} />
        <Route path="/learn" component={LearningPage} />
        <Route path="/work" component={WorkPage} />
        <Route path="/money" component={MoneyPage} />
        <Route path="/life" component={LifePage} />
        <Route
          component={() => (
            <ModulePage
              eyebrow="NUTTY OS"
              title="This space is ready."
              detail="Choose a module from the command center."
              icon={CircleDot}
              titleEmpty="Nothing here yet"
              bodyEmpty="This route is reserved for your connected personal system."
            />
          )}
        />
      </Switch>
    </AppShell>
  );
}
function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/today" /> : <LandingPage />;
}

function SignInPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>; }
function SignUpPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>; }

const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: { logoPlacement: "inside" as const, logoLinkUrl: basePath || "/", logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: { colorPrimary: "#6ca8ff", colorForeground: "#f5f7fb", colorMutedForeground: "#9ca8bb", colorDanger: "#ff7d86", colorBackground: "#111827", colorInput: "#172033", colorInputForeground: "#f5f7fb", colorNeutral: "#2a3852", fontFamily: "Manrope, sans-serif", borderRadius: "0.85rem" },
  elements: { rootBox: "w-full flex justify-center", cardBox: "bg-[#111827] rounded-2xl w-[440px] max-w-full overflow-hidden", card: "!shadow-none !border-0 !bg-transparent !rounded-none", footer: "!shadow-none !border-0 !bg-transparent !rounded-none", headerTitle: "text-white", headerSubtitle: "text-slate-300", socialButtonsBlockButtonText: "text-white", formFieldLabel: "text-slate-200", footerActionLink: "text-blue-300", footerActionText: "text-slate-400", dividerText: "text-slate-400", formFieldSuccessText: "text-emerald-300", alertText: "text-red-200", logoBox: "h-14", logoImage: "rounded-xl", socialButtonsBlockButton: "!border-slate-700 !bg-slate-900", formButtonPrimary: "!bg-[#6ca8ff] !text-slate-950", formFieldInput: "!border-slate-700 !bg-slate-900 !text-white", footerAction: "text-slate-300", dividerLine: "!bg-slate-700", alert: "!border-red-500/30 !bg-red-500/10", otpCodeFieldInput: "!border-slate-700 !bg-slate-900 !text-white", formFieldRow: "text-slate-200", main: "text-white" },
};

function App() {
  if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
  return <WouterRouter base={basePath}><ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: "Welcome back", subtitle: "Sign in to your personal operating system" } }, signUp: { start: { title: "Create your NUTTY account", subtitle: "Start with a blank slate" } } }}><Switch><Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route component={ProtectedArea} /></Switch></ClerkProvider></WouterRouter>;
}

export default App;
