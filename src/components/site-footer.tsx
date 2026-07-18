import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              CrestVest Inc. — the premium digital banking platform built for the modern global economy.
            </p>
          </div>
          <FooterCol title="Product" links={[["Features","/features"],["Cards","/cards"],["Investments","/investments"],["Savings","/savings"],["Transfers","/transfers"]]} />
          <FooterCol title="Company" links={[["About Us","/about"],["Careers","/careers"],["Press","/press"],["Blog","/blog"],["Contact","/contact"]]} />
          <FooterCol title="Legal" links={[["Privacy Policy","/privacy"],["Terms of Service","/terms"],["Cookie Policy","/cookies"],["Compliance","/compliance"]]} />
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 opacity-60">
          {["VISA","Mastercard","Plaid","Stripe","Zelle","SWIFT"].map((p) => (
            <span key={p} className="text-sm font-semibold tracking-widest">{p}</span>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2025 CrestVest Inc. All rights reserved. Funds insured up to $250,000 · FDIC Member · Equal Housing Lender
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}><Link to={href} className="hover:text-primary">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}