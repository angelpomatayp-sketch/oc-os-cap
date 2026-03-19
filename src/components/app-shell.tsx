"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/logout-button";
import type { AppUser } from "@/modules/orders/types";

const navigation = [
  { href: "/dashboard", label: "Dashboard", badge: "DS" },
  { href: "/proveedores", label: "Proveedores", badge: "PR" },
  { href: "/ordenes", label: "Ordenes", badge: "OC" },
  { href: "/aprobaciones", label: "Aprobaciones", badge: "AP" },
  { href: "/usuarios", label: "Usuarios", badge: "US" },
  { href: "/configuracion", label: "Configuracion", badge: "CF" },
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
            {visibleNavigation.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}`))
                    ? "sidebar__link sidebar__link--active"
                    : "sidebar__link"
                }
              >
                <span className="sidebar__badge">{badge}</span>
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
