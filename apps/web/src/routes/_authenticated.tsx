import {
	DashboardShell,
	Sidebar,
	type TNavItem,
	TopBar,
} from "@kana-consultant/ui-kit"
import {
	createFileRoute,
	Outlet,
	redirect,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router"
import { LayoutDashboard, FileSpreadsheet, UserPlus, Users } from "lucide-react"
import { authClient } from "~/libs/auth/client"

const navItems: TNavItem[] = [
	{ id: "/", label: "Dashboard", icon: LayoutDashboard },
	{ id: "/leads", label: "Leads Pipeline", icon: Users },
	{ id: "/capture", label: "Add Lead", icon: UserPlus },
	{ id: "/bulk-capture", label: "Bulk Import", icon: FileSpreadsheet },
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
					onNavigate={(id) => navigate({ to: id as string })}
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
	beforeLoad: async ({ location }) => {
		const { data: session } = await authClient.getSession()
		if (!session) {
			throw redirect({
				to: "/auth/login",
				search: {
					redirect: location.href,
				},
			})
		}
	},
	component: AuthenticatedLayout,
})
