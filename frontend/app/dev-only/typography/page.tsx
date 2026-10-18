import { notFound } from "next/navigation";
import { DM_Sans, Manrope, Outfit, Sora } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-lab-manrope" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-lab-dm-sans" });
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-lab-outfit" });
const sora = Sora({ subsets: ["latin"], display: "swap", variable: "--font-lab-sora" });

const previews = [
  { name: "Plus Jakarta Sans", family: "var(--font-plus-jakarta)" },
  { name: "Manrope", family: "var(--font-lab-manrope)" },
  { name: "DM Sans", family: "var(--font-lab-dm-sans)" },
  { name: "Outfit", family: "var(--font-lab-outfit)" },
  { name: "Sora", family: "var(--font-lab-sora)" },
];

export default function TypographyComparisonPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main
      className={`${manrope.variable} ${dmSans.variable} ${outfit.variable} ${sora.variable} min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--text-primary)] sm:px-8`}
    >
      <header className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
          Development-only typography lab
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">CampusVita font comparison</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
          Same CampusVita copy, scale, and surface treatment for each candidate. Compare letterforms,
          spacing, mixed punctuation, and number shapes without card styling differences.
        </p>
      </header>

      <div className="mx-auto mt-8 grid max-w-7xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {previews.map(({ name, family }) => (
          <article
            key={name}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
            style={{ fontFamily: `${family}, system-ui, sans-serif` }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-text)]">
              {name}
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight">
              Less waiting. More campus life.
            </h2>
            <h3 className="mt-5 text-lg font-bold">Your Campus, Your Cravings</h3>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="font-semibold">Campus Burger Corner</p>
              <span className="rounded-full bg-[var(--success-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--success)]">
                AVAILABLE NOW
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Freshly prepared food, ready when you are. Browse participating campus stalls, choose
              your favorites, and collect your order when it is ready.
            </p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold tabular-nums">₹199.00</p>
              <button
                type="button"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--on-primary)]"
              >
                View Menu
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-muted)]">
              <span>Preparing your order</span>
              <span>0123456789 · 10:45 AM · (₹199.00)</span>
            </div>

            <nav aria-label={`${name} navigation preview`} className="mt-4 flex gap-4 text-sm font-medium">
              <span>Home</span><span>Stalls</span><span>My orders</span>
            </nav>

            <form className="mt-4 border-t border-[var(--border)] pt-4">
              <label htmlFor={`email-${name.replaceAll(" ", "-")}`} className="text-sm font-semibold">
                Email address
              </label>
              <input
                id={`email-${name.replaceAll(" ", "-")}`}
                type="email"
                placeholder="name@campus.edu"
                className="mt-1.5 h-10 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input)] px-3 text-sm"
              />
              <p className="mt-1.5 text-xs text-[var(--danger)]">
                Please enter a valid email address.
              </p>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
