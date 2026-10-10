import Link from "next/link";

const explore = [
  { label: "Browse Food", href: "/" },
  { label: "Categories", href: "/#" },
  { label: "Stalls", href: "/" },
];

const campus = [
  { label: "My Orders", href: "/orders" },
  { label: "Profile", href: "/profile" },
  { label: "Cart", href: "/cart" },
];

const support = [
  { label: "Help Center", href: "/about" },
  { label: "Contact", href: "/about" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-black tracking-tight text-[var(--text-primary)]">
              CampusVita
            </Link>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-6">
              Smart campus food ordering.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Explore</h3>
            <ul className="space-y-2">
              {explore.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Campus</h3>
            <ul className="space-y-2">
              {campus.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Support</h3>
            <ul className="space-y-2">
              {support.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} CampusVita</p>
        </div>
      </div>
    </footer>
  );
}
