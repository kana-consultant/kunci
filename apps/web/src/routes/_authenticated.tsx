import {
  DashboardShell,
  Sidebar,
  type TNavItem,
  TopBar,
} from "@kana-consultant/ui-kit"
import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router"
import { LayoutDashboard, UserPlus, Users } from "lucide-react"

const navItems: TNavItem[] = [
  { id: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "/leads", label: "Leads Pipeline", icon: Users },
  { id: "/capture", label: "Add Lead", icon: UserPlus },
]

function AuthenticatedLayout() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const navigate = useNavigate()

  const activeId =
    currentPath === "/"
      ? "/"
      : (navItems.find((n) => n.id !== "/" && currentPath.startsWith(n.id))
          ?.id ?? "/")

  return (
    <DashboardShell
      sidebar={
        <Sidebar
          brandName="KUNCI"
          items={navItems}
          activeId={activeId}
          onNavigate={(id) => navigate({ to: id as any })}
          footer={
            <p className="text-xs text-[var(--color-muted-foreground)]">
              v{__APP_VERSION__} • KanA Consultant
            </p>
          }
        />
      }
      topBar={
        <TopBar title="" user={{ name: "Admin", email: "admin@kunci.dev" }} />
      }
    >
      <Outlet />
    </DashboardShell>
  )
}

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
})
