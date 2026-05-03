"use client";

import { useEffect, useMemo, useState } from "react";
import { getLocalDateKey, formatTime } from "@/lib/date";
import { readJson, writeJson } from "@/lib/storage";

type Category = "Breakfast" | "Lunch" | "Snacks" | "Drinks";

type Preset = {
  id: string;
  name: string;
  kcal: number;
  category: Category;
};

type LogItem = {
  id: string;
  name: string;
  kcal: number;
  ts: number;
};

const STORAGE = {
  goal: "calorie.goal.v1",
  presets: "calorie.presets.v1",
  logPrefix: "calorie.log.v1."
} as const;

const DEFAULT_GOAL = 2000;

const DEFAULT_PRESETS: Preset[] = [
  { id: "p_banana", name: "Banaan", kcal: 89, category: "Breakfast" },
  { id: "p_egg", name: "Gekookt ei", kcal: 78, category: "Breakfast" },
  { id: "p_oats", name: "Havermout (40g)", kcal: 150, category: "Breakfast" },
  { id: "p_yogurt", name: "Griekse yoghurt (150g)", kcal: 160, category: "Breakfast" },

  { id: "p_rice", name: "Witte rijst 100g", kcal: 130, category: "Lunch" },
  { id: "p_chicken", name: "Kipfilet 150g", kcal: 248, category: "Lunch" },
  { id: "p_salad", name: "Salade + dressing", kcal: 220, category: "Lunch" },
  { id: "p_sandwich", name: "Ham sandwich", kcal: 320, category: "Lunch" },

  { id: "p_proteinbar", name: "Eiwitreep", kcal: 200, category: "Snacks" },
  { id: "p_almonds", name: "Amandelen (30g)", kcal: 174, category: "Snacks" },
  { id: "p_chocolate", name: "Donkere chocolade (20g)", kcal: 110, category: "Snacks" },
  { id: "p_apple", name: "Appel", kcal: 95, category: "Snacks" },

  { id: "p_cappuccino", name: "Cappuccino", kcal: 120, category: "Drinks" },
  { id: "p_orangejuice", name: "Sinaasappelsap (250ml)", kcal: 110, category: "Drinks" },
  { id: "p_soda", name: "Frisdrank (330ml)", kcal: 139, category: "Drinks" },
  { id: "p_water", name: "Water", kcal: 0, category: "Drinks" }
];

const CATEGORY_LABEL: Record<Category, string> = {
  Breakfast: "Ontbijt",
  Lunch: "Lunch",
  Snacks: "Snacks",
  Drinks: "Dranken"
};

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ringColor(consumed: number, goal: number) {
  const pct = goal > 0 ? consumed / goal : 0;
  if (pct < 0.75) return "text-[#6366f1] dark:text-[#a78bfa]";
  if (pct < 0.95) return "text-amber";
  return "text-danger";
}

function formatKcal(n: number) {
  return new Intl.NumberFormat("nl-NL").format(Math.round(n));
}

function ProgressRing({ consumed, goal }: { consumed: number; goal: number }) {
  const size = 176;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pct = goal > 0 ? clamp(consumed / goal, 0, 1.25) : 0;
  const dash = c * clamp(pct, 0, 1);
  const over = consumed - goal;
  const remaining = goal - consumed;
  const statusClass = ringColor(consumed, goal);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="block">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(241,245,249,0.10)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className={`${statusClass} drop-shadow`}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm text-[#6b7280] dark:text-slate-300">Vandaag</div>
          <div className="mt-0.5 text-3xl font-semibold tracking-tight">{formatKcal(consumed)}</div>
          <div className="mt-1 text-xs text-slate-400">/ {formatKcal(goal)} kcal</div>
        </div>
      </div>

      <div className="mt-4 text-center">
        {remaining >= 0 ? (
          <>
            <div className="text-sm text-[#6b7280] dark:text-slate-300">Resterend</div>
            <div className={`mt-1 text-2xl font-semibold ${statusClass.replace("text-", "text-")}`}>
              {formatKcal(remaining)} kcal
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-[#6b7280] dark:text-slate-300">Boven doel</div>
            <div className="mt-1 text-2xl font-semibold text-danger">{formatKcal(over)} kcal</div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({
  title,
  right,
  children
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(99,102,241,0.07)] ring-1 ring-[rgba(99,102,241,0.1)] dark:bg-[#1e1030]/95 dark:shadow-soft dark:ring-[rgba(167,139,250,0.12)]">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-[#1e1b4b] dark:text-slate-200">{title}</h2>
        {right ? <div>{right}</div> : null}
      </header>
      {children}
    </section>
  );
}

function PillButton({
  children,
  onClick,
  variant = "default"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  const cls =
    variant === "danger"
      ? "bg-danger/15 text-danger hover:bg-danger/20 ring-danger/30"
      : "bg-[#6366f1]/10 text-[#1e1b4b] hover:bg-[#6366f1]/15 ring-[rgba(99,102,241,0.1)] dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:ring-[rgba(167,139,250,0.12)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${cls}`}
    >
      {children}
    </button>
  );
}

export default function CalorieTracker() {
  const [dateKey, setDateKey] = useState<string>(() => getLocalDateKey());
  const [goal, setGoal] = useState<number>(DEFAULT_GOAL);
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [log, setLog] = useState<LogItem[]>([]);

  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState<number | "">("");

  const logStorageKey = `${STORAGE.logPrefix}${dateKey}`;

  useEffect(() => {
    setGoal(readJson<number>(STORAGE.goal, DEFAULT_GOAL));
    setPresets(readJson<Preset[]>(STORAGE.presets, DEFAULT_PRESETS));
  }, []);

  useEffect(() => {
    setLog(readJson<LogItem[]>(logStorageKey, []));
  }, [logStorageKey]);

  useEffect(() => {
    writeJson(STORAGE.goal, goal);
  }, [goal]);

  useEffect(() => {
    writeJson(STORAGE.presets, presets);
  }, [presets]);

  useEffect(() => {
    writeJson(logStorageKey, log);
  }, [logStorageKey, log]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const nowKey = getLocalDateKey();
      setDateKey((prev) => (prev === nowKey ? prev : nowKey));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const consumed = useMemo(() => log.reduce((sum, it) => sum + it.kcal, 0), [log]);

  const groupedPresets = useMemo(() => {
    const g: Record<Category, Preset[]> = {
      Breakfast: [],
      Lunch: [],
      Snacks: [],
      Drinks: []
    };
    for (const p of presets) g[p.category].push(p);
    return g;
  }, [presets]);

  const addLog = (name: string, kcal: number) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const cleanKcal = Math.max(0, Math.round(kcal));
    setLog((prev) => [{ id: uid(), name: cleanName, kcal: cleanKcal, ts: Date.now() }, ...prev]);
  };

  const addPresetIfMissing = (name: string, kcal: number, category: Category) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const exists = presets.some(
      (p) => p.name.toLowerCase() === cleanName.toLowerCase() && p.kcal === Math.round(kcal)
    );
    if (exists) return;
    setPresets((prev) => [
      { id: `u_${uid()}`, name: cleanName, kcal: Math.max(0, Math.round(kcal)), category },
      ...prev
    ]);
  };

  const onQuickAdd = (p: Preset) => addLog(p.name, p.kcal);

  const onSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const kcal = typeof customKcal === "number" ? customKcal : NaN;
    if (!customName.trim() || !Number.isFinite(kcal)) return;
    addLog(customName, kcal);
    addPresetIfMissing(customName, kcal, "Snacks");
    setCustomName("");
    setCustomKcal("");
  };

  const onDeleteItem = (id: string) => setLog((prev) => prev.filter((x) => x.id !== id));

  const onResetDay = () => {
    if (!window.confirm("Weet je het zeker? Dit verwijdert alle items van vandaag.")) return;
    setLog([]);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-[#6b7280] dark:text-slate-400">
              DAGELIJKSE CALORIE TRACKER
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1e1b4b] dark:text-text">
              Calorie App
            </h1>
            <p className="mt-1 text-sm text-[#6b7280] dark:text-slate-400">
              {dateKey} · Alles wordt lokaal opgeslagen (localStorage).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-xs ring-1 ring-[rgba(99,102,241,0.1)] dark:bg-white/5 dark:ring-white/10">
              <span className="font-semibold text-[#1e1b4b] dark:text-slate-200">Dagelijks doel</span>
              <input
                value={goal}
                onChange={(e) => setGoal(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                inputMode="numeric"
                className="w-20 bg-transparent text-right font-semibold text-[#1e1b4b] outline-none placeholder:text-[#6b7280] dark:text-text dark:placeholder:text-slate-500"
                aria-label="Dagelijks calorie doel"
              />
              <span className="text-[#6b7280] dark:text-slate-400">kcal</span>
            </label>
            <PillButton variant="danger" onClick={onResetDay}>
              Dag resetten
            </PillButton>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Card title="Dagelijks doel">
              <ProgressRing consumed={consumed} goal={goal} />
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card title="Snel toevoegen (presets)">
              <div className="grid gap-5">
                {(Object.keys(groupedPresets) as Category[]).map((cat) => (
                  <div key={cat}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-[#1e1b4b] dark:text-slate-300">
                        {CATEGORY_LABEL[cat]}
                      </div>
                      <div className="text-xs text-[#6b7280] dark:text-slate-500">
                        {groupedPresets[cat].length} items
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {groupedPresets[cat].map((p) => (
                        <div
                          key={p.id}
                          className="group flex items-center justify-between rounded-xl bg-white/70 p-3 ring-1 ring-[rgba(99,102,241,0.1)] transition hover:bg-white dark:bg-white/5 dark:ring-[rgba(167,139,250,0.12)] dark:hover:bg-white/7"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[#1e1b4b] dark:text-slate-200">
                              {p.name}
                            </div>
                            <div className="mt-0.5 text-xs text-[#6b7280] dark:text-slate-400">
                              {formatKcal(p.kcal)} kcal
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onQuickAdd(p)}
                            className="ml-3 grid h-9 w-9 place-items-center rounded-full bg-[#6366f1]/15 text-[#6366f1] ring-1 ring-[rgba(99,102,241,0.1)] transition hover:bg-[#6366f1]/20 dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] dark:ring-[rgba(167,139,250,0.12)] dark:hover:bg-[#a78bfa]/20"
                            aria-label={`Voeg ${p.name} toe`}
                            title="Toevoegen"
                          >
                            <span className="text-lg font-semibold leading-none">+</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card title="Handmatig toevoegen (wordt ook preset)">
              <form onSubmit={onSubmitCustom} className="grid gap-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-[#1e1b4b] dark:text-slate-300">Productnaam</label>
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="bijv. Zelfgemaakte pasta"
                      className="mt-1 w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[#1e1b4b] ring-1 ring-[rgba(99,102,241,0.1)] outline-none placeholder:text-[#6b7280] focus:ring-[#6366f1]/30 dark:bg-white/5 dark:text-text dark:ring-[rgba(167,139,250,0.12)] dark:placeholder:text-slate-500 dark:focus:ring-[#a78bfa]/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1e1b4b] dark:text-slate-300">Calorieën</label>
                    <input
                      value={customKcal}
                      onChange={(e) => setCustomKcal(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      inputMode="numeric"
                      className="mt-1 w-full rounded-xl bg-white/70 px-3 py-2 text-sm text-[#1e1b4b] ring-1 ring-[rgba(99,102,241,0.1)] outline-none placeholder:text-[#6b7280] focus:ring-[#6366f1]/30 dark:bg-white/5 dark:text-text dark:ring-[rgba(167,139,250,0.12)] dark:placeholder:text-slate-500 dark:focus:ring-[#a78bfa]/40"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-[#6366f1]/15 px-4 py-2 text-sm font-semibold text-[#6366f1] ring-1 ring-[rgba(99,102,241,0.1)] transition hover:bg-[#6366f1]/20 dark:bg-[#a78bfa]/15 dark:text-[#a78bfa] dark:ring-[rgba(167,139,250,0.12)] dark:hover:bg-[#a78bfa]/20"
                >
                  Toevoegen
                </button>

                <p className="text-xs text-[#6b7280] dark:text-slate-500">
                  Handmatige items worden toegevoegd aan je log én opgeslagen als nieuwe quick-add preset (categorie:
                  Snacks).
                </p>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card
              title="Logboek vandaag"
              right={<div className="text-xs text-[#6b7280] dark:text-slate-500">{log.length} items</div>}
            >
              <div className="max-h-[360px] overflow-auto pr-1">
                {log.length === 0 ? (
                  <div className="rounded-xl bg-white/70 p-4 text-sm text-[#6b7280] ring-1 ring-[rgba(99,102,241,0.1)] dark:bg-white/5 dark:text-slate-400 dark:ring-[rgba(167,139,250,0.12)]">
                    Nog niets toegevoegd vandaag.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {log.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/70 p-3 ring-1 ring-[rgba(99,102,241,0.1)] dark:bg-white/5 dark:ring-[rgba(167,139,250,0.12)]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#1e1b4b] dark:text-slate-200">
                            {it.name}
                          </div>
                          <div className="mt-0.5 text-xs text-[#6b7280] dark:text-slate-500">
                            {formatKcal(it.kcal)} kcal · {formatTime(new Date(it.ts))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(it.id)}
                          className="grid h-9 w-9 place-items-center rounded-full bg-danger/10 text-danger ring-1 ring-danger/25 transition hover:bg-danger/15"
                          aria-label={`Verwijder ${it.name}`}
                          title="Verwijderen"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-end justify-between rounded-xl bg-white/70 p-4 ring-1 ring-[rgba(99,102,241,0.1)] dark:bg-white/5 dark:ring-[rgba(167,139,250,0.12)]">
                <div>
                  <div className="text-xs font-semibold text-[#6b7280] dark:text-slate-300">Totaal</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-[#1e1b4b] dark:text-text">
                    {formatKcal(consumed)} kcal
                  </div>
                </div>
                <div className="text-right text-xs text-[#6b7280] dark:text-slate-500">
                  Tip: alles blijft bewaard in je browser.
                </div>
              </div>
            </Card>
          </div>
        </div>

        <footer className="mt-10 text-xs text-[#6b7280] dark:text-slate-600">
          Kleurenpalet: bg{" "}
          <span className="text-[#1e1b4b] dark:text-slate-300">
            #f0f4ff → #ffffff (licht) / #1a0a2e → #0d0d0d (donker)
          </span>
          , surface <span className="text-[#1e1b4b] dark:text-slate-300">#ffffff / #1e1030</span>, accent{" "}
          <span className="text-[#1e1b4b] dark:text-slate-300">#6366f1 / #a78bfa</span>, danger{" "}
          <span className="text-[#1e1b4b] dark:text-slate-300">#f87171</span>, text{" "}
          <span className="text-[#1e1b4b] dark:text-slate-300">#1e1b4b / #f1f5f9</span>.
        </footer>
      </div>
    </div>
  );
}

