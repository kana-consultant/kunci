import {
	Avatar,
	AvatarFallback,
	Button,
	DashboardShell,
	Separator,
	Sidebar,
	Skeleton,
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
import {
	FileSpreadsheet,
	LayoutDashboard,
	LogOut,
	ScrollText,
	Settings,
	UserPlus,
	Users,
} from "lucide-react"
import { authClient } from "~/libs/auth/client"

const navItems: TNavItem[] = [
	{ id: "/", label: "Dashboard", icon: LayoutDashboard },
	{ id: "/leads", label: "Leads Pipeline", icon: Users },
	{ id: "/capture", label: "Add Lead", icon: UserPlus },
	{ id: "/bulk-capture", label: "Bulk Import", icon: FileSpreadsheet },
	{ id: "/logs", label: "Logs", icon: ScrollText },
	{ id: "/settings", label: "Settings", icon: Settings },
]

function SidebarFooter() {
	const navigate = useNavigate()
	const session = authClient.useSession()

	const handleLogout = async () => {
		await authClient.signOut()
		navigate({ to: "/auth/login" })
	}

	const name = session.data?.user?.name ?? "Admin"
	const email = session.data?.user?.email ?? ""
	const fallback = name[0]?.toUpperCase() ?? "A"

	return (
		<div className="space-y-1">
			<Separator />

			{/* Profile block */}
			{session.isPending ? (
				<div className="flex items-center gap-3 px-1 py-3">
					<Skeleton className="w-8 h-8 rounded-full shrink-0" />
					<div className="flex-1 space-y-1.5">
						<Skeleton className="h-3 w-24" />
						<Skeleton className="h-3 w-32" />
					</div>
				</div>
			) : (
				<div className="flex items-center gap-2.5 px-1 py-3">
					<Avatar size="sm" className="shrink-0">
						<AvatarFallback>{fallback}</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold leading-tight truncate">
							{name}
						</p>
						{email && (
							<p
								className="text-xs leading-tight truncate mt-0.5"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{email}
							</p>
						)}
					</div>
				</div>
			)}

			{/* Logout button */}
			<Button
				variant="ghost"
				className="w-full justify-start gap-2 text-sm"
				onClick={handleLogout}
			>
				<LogOut className="w-4 h-4" />
				Sign out
			</Button>

			{/* Version */}
			<p
				className="text-xs px-2 pt-1"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				v{__APP_VERSION__} • KanA Consultant
			</p>
		</div>
	)
}

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
					footer={<SidebarFooter />}
				/>
			}
			topBar={<TopBar title="" />}
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
