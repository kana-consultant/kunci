import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import { Users, Mail, MessageCircle, TrendingUp } from "lucide-react"
import { StatCard, Card, CardHeader, CardTitle, CardContent } from "@kana-consultant/ui-kit"

export const Route = createFileRoute("/")({
	component: DashboardPage,
})

const statCards = [
	{ key: "totalLeads", label: "Total Leads", icon: Users, tone: "primary" },
	{ key: "awaiting", label: "Awaiting Reply", icon: Mail, tone: "warning" },
	{ key: "replied", label: "Replied", icon: MessageCircle, tone: "success" },
	{ key: "conversionRate", label: "Conversion Rate", icon: TrendingUp, tone: "info", suffix: "%" } as any,
] as const

function DashboardPage() {
	const query = useQuery((orpc as any).campaign.getStats.queryOptions())
	const stats = (query.data as any) ?? {}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
				<p className="text-sm text-slate-500 mt-1">Overview of your AI SDR campaigns.</p>
			</div>

			{query.isPending ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-32 animate-pulse">
							<div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
							<div className="h-7 bg-slate-200 rounded w-1/3" />
						</div>
					))}
				</div>
			) : query.error ? (
				<div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
					Failed to load dashboard stats. Make sure the API server is running.
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					{statCards.map(({ key, label, icon, tone, suffix }: any) => {
						const value = stats[key] ?? 0
						return (
							<StatCard
								key={key}
								id={key}
								label={label}
								value={suffix ? `${value}${suffix}` : value}
								icon={icon}
								tone={tone}
							/>
						)
					})}
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>How it works</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap mt-2">
						{["Capture Lead", "Research Company", "AI Analysis", "Generate 3-Email Sequence", "Auto-Send", "Follow-Up"].map((step, i) => (
							<div key={step} className="flex items-center gap-3">
								<div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
									<span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
									<span>{step}</span>
								</div>
								{i < 5 && <span className="text-slate-300">→</span>}
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
