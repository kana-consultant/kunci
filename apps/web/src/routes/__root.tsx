import { createRootRoute, Outlet, Link, useRouterState } from "@tanstack/react-router"
import { LayoutDashboard, Users, UserPlus } from "lucide-react"

const navItems = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/leads", label: "Leads Pipeline", icon: Users },
	{ to: "/capture", label: "Add Lead", icon: UserPlus },
] as const

function RootLayout() {
	const routerState = useRouterState()
	const currentPath = routerState.location.pathname

	return (
		<div className="min-h-screen flex bg-slate-50">
			{/* Sidebar */}
			<aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
				{/* Logo */}
				<div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
					<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
						KUNCI
					</span>
					<span className="text-xs text-slate-400 font-medium tracking-wider">AI SDR</span>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-3 py-4 space-y-1">
					{navItems.map(({ to, label, icon: Icon }) => {
						const isActive = to === "/" ? currentPath === "/" : currentPath.startsWith(to)
						return (
							<Link
								key={to}
								to={to}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
									isActive
										? "bg-blue-50 text-blue-700 shadow-sm"
										: "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
								}`}
							>
								<Icon className={`w-4.5 h-4.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
								{label}
							</Link>
						)
					})}
				</nav>

				{/* Footer */}
				<div className="px-4 py-3 border-t border-slate-200">
					<p className="text-xs text-slate-400">v0.1.0 • KanA Consultant</p>
				</div>
			</aside>

			{/* Main Content */}
			<div className="flex-1 flex flex-col">
				<header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
					<div />
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
							<span className="text-white text-xs font-bold">A</span>
						</div>
					</div>
				</header>

				<main className="flex-1 p-8 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	)
}

export const Route = createRootRoute({
	component: RootLayout,
})
