import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowRight,
	FileSpreadsheet,
	Mail,
	MessageCircle,
	ScrollText,
	TrendingUp,
	UserPlus,
	Users,
} from "lucide-react"
import { useState } from "react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardPage,
})

type Period = "7d" | "30d" | "all"

// ─── Pipeline bar chart ───────────────────────────────────────────────────────

const STAGE_META = [
	{ stage: 0, label: "Captured", color: "var(--color-primary)" },
	{ stage: 1, label: "Email Sent", color: "var(--color-info, #6366f1)" },
	{ stage: 2, label: "Follow-up 1", color: "var(--color-warning)" },
	{ stage: 3, label: "Follow-up 2", color: "var(--color-success)" },
]

function PipelineBarChart({
	stages,
}: {
	stages: Array<{ stage: number; count: number }>
}) {
	const bars = STAGE_META.map((m) => ({
		...m,
		count: stages.find((s) => s.stage === m.stage)?.count ?? 0,
	}))
	const max = Math.max(...bars.map((b) => b.count), 1)
	const MAX_H = 148

	return (
		<div>
			<div
				className="flex items-end gap-3 sm:gap-5"
				style={{
					height: `${MAX_H + 28}px`,
					borderBottom: "1px solid var(--color-border)",
					paddingBottom: "0",
				}}
			>
				{bars.map((bar) => {
					const barH = Math.max(
						(bar.count / max) * MAX_H,
						bar.count > 0 ? 6 : 0,
					)
					return (
						<div
							key={bar.stage}
							className="flex-1 flex flex-col items-center justify-end gap-1.5"
						>
							<span
								className="text-sm font-bold tabular-nums"
								style={{
									color:
										bar.count === 0
											? "var(--color-muted-foreground)"
											: "var(--color-foreground)",
									opacity: bar.count === 0 ? 0.35 : 1,
								}}
							>
								{bar.count}
							</span>
							<div
								className="w-full rounded-t-md"
								style={{
									height: `${barH}px`,
									backgroundColor: bar.color,
									opacity: bar.count === 0 ? 0.12 : 1,
									transition: "height 0.55s cubic-bezier(.4,0,.2,1)",
								}}
							/>
						</div>
					)
				})}
			</div>
			<div className="flex gap-3 sm:gap-5 mt-2.5">
				{bars.map((bar) => (
					<div key={bar.stage} className="flex-1 text-center">
						<span
							className="text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{bar.label}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

// ─── Status segmented bar ─────────────────────────────────────────────────────

function StatusSegmentedBar({
	stats,
}: {
	stats: {
		totalLeads: number
		pending: number
		researching: number
		bounced: number
		researchFailed: number
		awaiting: number
		replied: number
	}
}) {
	const segments = [
		{
			label: "Pending",
			count: stats.pending + stats.researching,
			color: "var(--color-muted-foreground)",
		},
		{
			label: "Errors",
			count: stats.bounced + stats.researchFailed,
			color: "var(--color-danger)",
		},
		{
			label: "Awaiting",
			count: stats.awaiting,
			color: "var(--color-warning)",
		},
		{
			label: "Replied",
			count: stats.replied,
			color: "var(--color-success)",
		},
	]

	const total = segments.reduce((s, seg) => s + seg.count, 0)

	return (
		<div className="space-y-4">
			{/* Bar */}
			<div
				className="flex rounded-full overflow-hidden h-2.5 gap-px"
				style={{ background: "var(--color-surface-alt)" }}
			>
				{segments.map((seg) =>
					seg.count > 0 ? (
						<div
							key={seg.label}
							style={{
								flex: seg.count,
								backgroundColor: seg.color,
								minWidth: "6px",
								transition: "flex 0.5s ease",
							}}
						/>
					) : null,
				)}
			</div>

			{/* Legend */}
			<div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
				{segments.map((seg) => (
					<div
						key={seg.label}
						className="flex items-center justify-between gap-2"
					>
						<div className="flex items-center gap-1.5 min-w-0">
							<div
								className="w-2 h-2 rounded-sm shrink-0"
								style={{ backgroundColor: seg.color }}
							/>
							<span
								className="text-xs truncate"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{seg.label}
							</span>
						</div>
						<span className="text-xs font-semibold tabular-nums">
							{seg.count}
						</span>
					</div>
				))}
				<div
					className="col-span-2 pt-1 flex items-center justify-between"
					style={{ borderTop: "1px solid var(--color-border)" }}
				>
					<span
						className="text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Total tracked
					</span>
					<span className="text-xs font-bold">{total}</span>
				</div>
			</div>
		</div>
	)
}

// ─── Quick action card ────────────────────────────────────────────────────────

function QuickAction({
	to,
	icon: Icon,
	label,
	description,
	accentColor,
	accentBg,
}: {
	to: string
	icon: React.ComponentType<{ className?: string }>
	label: string
	description: string
	accentColor: string
	accentBg: string
}) {
	return (
		<Link to={to} className="block group">
			<div
				className="flex items-center gap-3 p-4 rounded-xl border transition-all duration-150 h-full"
				style={{
					background: "var(--color-background)",
					borderColor: "var(--color-border)",
				}}
			>
				<div
					className="p-2 rounded-lg shrink-0"
					style={{ background: accentBg, color: accentColor }}
				>
					<Icon className="w-4 h-4" />
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium leading-none">{label}</p>
					<p
						className="text-xs mt-1 leading-snug"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{description}
					</p>
				</div>
				<ArrowRight
					className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
					style={{ color: "var(--color-muted-foreground)" }}
				/>
			</div>
		</Link>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DashboardPage() {
	const [period, setPeriod] = useState<Period>("all")

	const statsQuery = useQuery(
		orpc.campaign.getStats.queryOptions({ input: { period } }),
	)
	const stageQuery = useQuery(
		orpc.campaign.getStageDistribution.queryOptions({ input: { period } }),
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

	return (
		<div className="space-y-8">
			{/* ── Header ── */}
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Overview</h1>
					<p
						className="text-sm mt-1"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						AI SDR campaign performance at a glance.
					</p>
				</div>
				<Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
					<TabsList>
						<TabsTrigger value="7d">7 days</TabsTrigger>
						<TabsTrigger value="30d">30 days</TabsTrigger>
						<TabsTrigger value="all">All time</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* ── KPI row ── */}
			{statsQuery.isPending ? (
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-28 rounded-xl" />
					))}
				</div>
			) : statsQuery.error ? (
				<div
					className="rounded-xl border p-5 text-sm"
					style={{
						borderColor: "var(--color-danger)",
						color: "var(--color-danger)",
						background: "var(--color-danger-muted, transparent)",
					}}
				>
					Failed to load dashboard stats.
				</div>
			) : (
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

			{/* ── Main grid ── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Pipeline bar chart */}
				<Card className="lg:col-span-2">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Pipeline Stages</CardTitle>
						<p
							className="text-xs"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Leads at each stage of the outbound sequence
						</p>
					</CardHeader>
					<CardContent className="pt-2">
						{stageQuery.isPending ? (
							<Skeleton className="h-52 w-full rounded-lg" />
						) : stageQuery.error ? (
							<p
								className="text-sm py-4"
								style={{ color: "var(--color-danger)" }}
							>
								Failed to load funnel data.
							</p>
						) : stageQuery.data?.length === 0 ? (
							<div
								className="flex items-center justify-center py-16 text-sm"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								No leads for the selected period.
							</div>
						) : (
							<PipelineBarChart stages={stageQuery.data ?? []} />
						)}
					</CardContent>
				</Card>

				{/* Campaign health */}
				<Card className="lg:col-span-1 flex flex-col">
					<CardHeader className="pb-2">
						<CardTitle className="text-base">Campaign Health</CardTitle>
					</CardHeader>
					<CardContent className="flex-1 space-y-6">
						{/* Conversion highlight */}
						<div
							className="rounded-xl p-5 text-center"
							style={{ background: "var(--color-surface-alt)" }}
						>
							{statsQuery.isPending ? (
								<>
									<Skeleton className="h-12 w-24 mx-auto mb-2" />
									<Skeleton className="h-4 w-32 mx-auto" />
								</>
							) : (
								<>
									<div
										className="text-5xl font-bold tabular-nums leading-none"
										style={{ color: "var(--color-primary)" }}
									>
										{stats.conversionRate}
										<span className="text-3xl">%</span>
									</div>
									<p
										className="text-xs mt-2 font-medium uppercase tracking-widest"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Conversion Rate
									</p>
								</>
							)}
						</div>

						{/* Status breakdown */}
						<div className="space-y-3">
							<p
								className="text-xs font-semibold uppercase tracking-widest"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Status Distribution
							</p>
							{statsQuery.isPending ? (
								<>
									<Skeleton className="h-2.5 w-full rounded-full" />
									<div className="grid grid-cols-2 gap-2 mt-3">
										{[1, 2, 3, 4].map((i) => (
											<Skeleton key={i} className="h-5" />
										))}
									</div>
								</>
							) : (
								<StatusSegmentedBar stats={stats} />
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* ── Quick actions ── */}
			<div className="space-y-3">
				<p
					className="text-xs font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Quick Actions
				</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
					<QuickAction
						to="/capture"
						icon={UserPlus}
						label="Add New Lead"
						description="Capture a single prospect manually"
						accentColor="var(--color-primary)"
						accentBg="var(--color-primary-muted, color-mix(in oklab, var(--color-primary) 12%, transparent))"
					/>
					<QuickAction
						to="/bulk-capture"
						icon={FileSpreadsheet}
						label="Bulk Import"
						description="Import multiple leads via CSV"
						accentColor="var(--color-info, var(--color-primary))"
						accentBg="var(--color-info-muted, color-mix(in oklab, var(--color-info, var(--color-primary)) 12%, transparent))"
					/>
					<QuickAction
						to="/leads"
						icon={Users}
						label="View Pipeline"
						description="Manage and track all ongoing leads"
						accentColor="var(--color-accent)"
						accentBg="var(--color-accent-muted, color-mix(in oklab, var(--color-accent) 12%, transparent))"
					/>
					<QuickAction
						to="/logs"
						icon={ScrollText}
						label="Activity Logs"
						description="Full pipeline execution history"
						accentColor="var(--color-success)"
						accentBg="var(--color-success-muted, color-mix(in oklab, var(--color-success) 12%, transparent))"
					/>
				</div>
			</div>
		</div>
	)
}
