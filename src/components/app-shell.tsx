"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/logout-button";
import type { AppUser } from "@/modules/orders/types";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-6 9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/ordenes",
    label: "Ordenes",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    ),
  },
  {
    href: "/aprobaciones",
    label: "Aprobaciones",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
      </svg>
    ),
  },
  {
    href: "/configuracion",
    label: "Configuracion",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ),
  },
];

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: AppUser;
}) {
  const pathname = usePathname();
  const visibleNavigation =
    currentUser.role === "ADMIN"
      ? navigation
      : navigation.filter(
          (item) =>
            item.href !== "/usuarios" &&
            item.href !== "/configuracion" &&
            item.href !== "/aprobaciones",
        );

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <aside className="sidebar">
          <div className="sidebar__brand">
            <div className="sidebar__logo-wrap">
              <Image
                src="/brand/logo-pacifico.jpeg"
                alt="Pacifico"
                width={92}
                height={92}
                className="sidebar__logo"
                style={{ height: "auto" }}
                priority
              />
            </div>
          </div>

          <nav className="sidebar__nav">
            {visibleNavigation.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`))
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                <span className="sidebar__icon">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar__footer">
            <LogoutButton />
          </div>
        </aside>

        <main className="content">
          <header className="topbar">
            <div className="topbar__search">
              <span className="topbar__search-icon">⌕</span>
              <input type="text" placeholder="Buscar..." />
            </div>

            <div className="topbar__user">
              <div className="topbar__user-block">
                <p className="topbar__user-name">{currentUser.name}</p>
                <p className="topbar__user-role">{currentUser.role}</p>
              </div>
              <div className="topbar__avatar">
                {currentUser.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            </div>
          </header>

          <div className="content__body">{children}</div>
        </main>
      </div>
    </div>
  );
}
