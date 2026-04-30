import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	Activity,
	Brain,
	CheckCircle2,
	Clock,
	FileSpreadsheet,
	Globe,
	ListTodo,
	Mail,
	MessageCircle,
	Send,
	TrendingUp,
	UserCheck,
	UserPlus,
	Users,
	XCircle,
} from "lucide-react"
import { useState } from "react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardPage,
})

const stepMeta: Record<string, { icon: any; color: string }> = {
	capture: { icon: UserCheck, color: "var(--color-primary)" },
	scrape: { icon: Globe, color: "var(--color-info)" },
	analyze_website: { icon: Brain, color: "var(--color-accent)" },
	build_profile: { icon: ListTodo, color: "var(--color-success)" },
	analyze_behavior: { icon: Brain, color: "var(--color-warning)" },
	generate_sequence: { icon: Mail, color: "var(--color-primary)" },
	send_email: { icon: Send, color: "var(--color-success)" },
}

function getRelativeTime(dateString: string) {
	const diff = Date.now() - new Date(dateString).getTime()
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return "Just now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

type Period = "7d" | "30d" | "all"

function DashboardPage() {
	const [period, setPeriod] = useState<Period>("all")

	const statsQuery = useQuery(
		orpc.campaign.getStats.queryOptions({ input: { period } }),
	)
	const stageQuery = useQuery(
		orpc.campaign.getStageDistribution.queryOptions({ input: { period } }),
	)
	const activityQuery = useQuery(
		orpc.campaign.getRecentActivity.queryOptions({ input: { limit: 10 } }),
	)

	const stats = statsQuery.data ?? {
		totalLeads: 0,
		awaiting: 0,
		replied: 0,
		conversionRate: 0,
		bounced: 0,
		pending: 0,
		researching: 0,
		researchFailed: 0,
	}

	const maxStageCount = Math.max(
		...(stageQuery.data?.map((s) => s.count) ?? [1]),
	)

	return (
		<div className="space-y-8">
			{/* Header & Filters */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
						Overview of your AI SDR campaigns and pipeline insights.
					</p>
				</div>

				<div className="flex bg-[var(--color-surface-alt)] p-1 rounded-lg border border-[var(--color-border)]">
					{[
						{ value: "7d", label: "Last 7 Days" },
						{ value: "30d", label: "Last 30 Days" },
						{ value: "all", label: "All Time" },
					].map((p) => (
						<button
							key={p.value}
							onClick={() => setPeriod(p.value as Period)}
							className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
								period === p.value
									? "bg-[var(--color-surface)] shadow-sm font-medium text-[var(--color-foreground)]"
									: "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
							}`}
						>
							{p.label}
						</button>
					))}
				</div>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Link to="/capture" className="block">
					<Card className="hover:border-[var(--color-primary)] transition-colors cursor-pointer h-full">
						<CardContent className="p-4 flex items-center gap-3">
							<div className="p-2 bg-[var(--color-primary-muted)] text-[var(--color-primary)] rounded-lg">
								<UserPlus className="w-5 h-5" />
							</div>
							<div>
								<h3 className="font-medium text-sm">Add New Lead</h3>
								<p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
									Capture a single prospect manually
								</p>
							</div>
						</CardContent>
					</Card>
				</Link>
				<Link to="/bulk-capture" className="block">
					<Card className="hover:border-[var(--color-info)] transition-colors cursor-pointer h-full">
						<CardContent className="p-4 flex items-center gap-3">
							<div className="p-2 bg-[var(--color-info-muted)] text-[var(--color-info)] rounded-lg">
								<FileSpreadsheet className="w-5 h-5" />
							</div>
							<div>
								<h3 className="font-medium text-sm">Bulk Import</h3>
								<p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
									Import multiple leads via CSV or text
								</p>
							</div>
						</CardContent>
					</Card>
				</Link>
				<Link to="/leads" className="block">
					<Card className="hover:border-[var(--color-accent)] transition-colors cursor-pointer h-full">
						<CardContent className="p-4 flex items-center gap-3">
							<div className="p-2 bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded-lg">
								<ListTodo className="w-5 h-5" />
							</div>
							<div>
								<h3 className="font-medium text-sm">View Pipeline</h3>
								<p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
									Manage and track all ongoing leads
								</p>
							</div>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Top Level Stats */}
			{statsQuery.isPending ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32 rounded-xl" />
					))}
				</div>
			) : statsQuery.error ? (
				<Card>
					<CardContent className="p-4 text-[var(--color-danger)]">
						Failed to load dashboard stats.
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
					<StatCard
						id="totalLeads"
						label="Total Leads"
						value={stats.totalLeads}
						icon={Users}
						tone="primary"
					/>
					<StatCard
						id="awaiting"
						label="Awaiting Reply"
						value={stats.awaiting}
						icon={Mail}
						tone="warning"
					/>
					<StatCard
						id="replied"
						label="Replied"
						value={stats.replied}
						icon={MessageCircle}
						tone="success"
					/>
					<StatCard
						id="conversion"
						label="Conversion Rate"
						value={`${stats.conversionRate}%`}
						icon={TrendingUp}
						tone="accent"
					/>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Funnel & Status */}
				<div className="lg:col-span-2 space-y-6">
					{/* Pipeline Funnel */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Pipeline Funnel</CardTitle>
						</CardHeader>
						<CardContent>
							{stageQuery.isPending ? (
								<div className="space-y-4">
									{[1, 2, 3, 4].map((i) => (
										<Skeleton key={i} className="h-8 rounded w-full" />
									))}
								</div>
							) : stageQuery.error ? (
								<div className="text-sm text-[var(--color-danger)]">
									Failed to load funnel data.
								</div>
							) : stageQuery.data?.length === 0 ? (
								<div className="text-sm text-[var(--color-muted-foreground)] text-center py-6">
									No leads found for the selected period.
								</div>
							) : (
								<div className="space-y-5">
									{stageQuery.data?.map((stage) => {
										const percentage =
											maxStageCount > 0
												? (stage.count / maxStageCount) * 100
												: 0
										const stageLabels: Record<number, string> = {
											0: "Captured / Researching",
											1: "First Email Sent",
											2: "Follow-up 1 Sent",
											3: "Follow-up 2 Sent",
										}

										return (
											<div key={stage.stage} className="relative">
												<div className="flex justify-between items-end mb-1.5 text-sm">
													<span className="font-medium text-[var(--color-foreground)]">
														{stageLabels[stage.stage] ?? `Stage ${stage.stage}`}
													</span>
													<span className="font-mono text-xs text-[var(--color-muted-foreground)]">
														{stage.count} leads
													</span>
												</div>
												<div className="h-3 w-full bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
													<div
														className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500 ease-out"
														style={{ width: `${Math.max(percentage, 2)}%` }}
													/>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Status Overview */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Status Breakdown</CardTitle>
						</CardHeader>
						<CardContent>
							{statsQuery.isPending ? (
								<Skeleton className="h-24 w-full" />
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									<div className="p-3 bg-[var(--color-surface-alt)] rounded-lg">
										<div className="text-xs text-[var(--color-muted-foreground)] mb-1 flex items-center gap-1.5">
											<div className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />
											Pending
										</div>
										<div className="text-xl font-semibold">
											{stats.pending + stats.researching}
										</div>
									</div>
									<div className="p-3 bg-[var(--color-surface-alt)] rounded-lg">
										<div className="text-xs text-[var(--color-muted-foreground)] mb-1 flex items-center gap-1.5">
											<div className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
											Errors/Bounced
										</div>
										<div className="text-xl font-semibold">
											{stats.researchFailed + stats.bounced}
										</div>
									</div>
									<div className="p-3 bg-[var(--color-surface-alt)] rounded-lg">
										<div className="text-xs text-[var(--color-muted-foreground)] mb-1 flex items-center gap-1.5">
											<div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
											Awaiting Reply
										</div>
										<div className="text-xl font-semibold">
											{stats.awaiting}
										</div>
									</div>
									<div className="p-3 bg-[var(--color-surface-alt)] rounded-lg">
										<div className="text-xs text-[var(--color-muted-foreground)] mb-1 flex items-center gap-1.5">
											<div className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
											Replied
										</div>
										<div className="text-xl font-semibold">
											{stats.replied}
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Recent Activity */}
				<div className="lg:col-span-1">
					<Card className="h-full flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between py-4">
							<CardTitle className="text-base flex items-center gap-2">
								<Activity className="w-4 h-4" />
								Recent Activity
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 overflow-hidden p-0 px-4 pb-4">
							{activityQuery.isPending ? (
								<div className="space-y-4 mt-2">
									{[1, 2, 3, 4, 5].map((i) => (
										<Skeleton key={i} className="h-12 w-full rounded" />
									))}
								</div>
							) : activityQuery.error ? (
								<div className="text-sm text-[var(--color-danger)] mt-2">
									Failed to load activity.
								</div>
							) : activityQuery.data?.length === 0 ? (
								<div className="flex flex-col items-center justify-center text-center py-12 text-[var(--color-muted-foreground)]">
									<Clock className="w-10 h-10 mb-3 opacity-20" />
									<p className="text-sm">No recent activity.</p>
								</div>
							) : (
								<div className="relative mt-2">
									<div
										className="absolute left-[15px] top-2 bottom-2 w-px"
										style={{ background: "var(--color-border)" }}
									/>
									<div className="space-y-4">
										{activityQuery.data?.map((step) => {
											const meta = stepMeta[step.step] ?? {
												icon: CheckCircle2,
												color: "var(--color-muted-foreground)",
											}
											const StepIcon = meta.icon
											const isFailed = step.status === "failed"
											const isRunning = step.status === "running"

											return (
												<div
													key={step.id}
													className="relative flex items-start gap-3"
												>
													<div
														className="relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full shrink-0 bg-[var(--color-surface)]"
														style={{
															border: `2px solid ${
																isFailed
																	? "var(--color-danger)"
																	: isRunning
																		? "var(--color-warning)"
																		: meta.color
															}`,
														}}
													>
														{isFailed ? (
															<XCircle className="w-3.5 h-3.5 text-[var(--color-danger)]" />
														) : (
															<StepIcon
																className={`w-3.5 h-3.5 ${isRunning ? "animate-pulse" : ""}`}
																style={{
																	color: isRunning
																		? "var(--color-warning)"
																		: meta.color,
																}}
															/>
														)}
													</div>
													<div className="flex-1 min-w-0 pt-1">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium truncate">
																{step.label}
															</p>
															<span className="text-[10px] text-[var(--color-muted-foreground)] shrink-0">
																{getRelativeTime(step.startedAt)}
															</span>
														</div>
														<p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
															{step.leadName ?? "Unknown Lead"}
															{step.durationMs &&
																` • ${(step.durationMs / 1000).toFixed(1)}s`}
														</p>
													</div>
												</div>
											)
										})}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
