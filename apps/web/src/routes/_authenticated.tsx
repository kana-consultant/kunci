import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router"
import { DashboardShell, Sidebar, TopBar, type TNavItem } from "@kana-consultant/ui-kit"
import { LayoutDashboard, Users, UserPlus } from "lucide-react"

const navItems: TNavItem[] = [
	{ id: "/_authenticated", label: "Dashboard", icon: LayoutDashboard },
	{ id: "/_authenticated/leads", label: "Leads Pipeline", icon: Users },
	{ id: "/_authenticated/capture", label: "Add Lead", icon: UserPlus },
]

function AuthenticatedLayout() {
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname
	const navigate = useNavigate()

	const activeId = currentPath === "/"
		? "/_authenticated"
		: navItems.find((n) => n.id !== "/_authenticated" && currentPath.startsWith(n.id.replace("/_authenticated", "")))?.id ?? "/_authenticated"

	return (
		<DashboardShell
			sidebar={
				<Sidebar
					brandName="KUNCI"
					items={navItems}
					activeId={activeId}
					onNavigate={(id) => navigate({ to: id })}
					footer={
						<p className="text-xs text-[var(--color-muted-foreground)]">
							v{__APP_VERSION__} • KanA Consultant
						</p>
					}
				/>
			}
			topBar={
				<TopBar
					title=""
					user={{ name: "Admin", email: "admin@kunci.dev" }}
				/>
			}
		>
			<Outlet />
		</DashboardShell>
	)
}

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
})
