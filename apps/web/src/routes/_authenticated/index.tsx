import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
	Activity as ActivityIcon,
	ArrowRight,
	Bot,
	Brain,
	CalendarClock,
	CheckCircle2,
	ChevronRight,
	Clock,
	FileSpreadsheet,
	Inbox,
	type LucideIcon,
	Mail,
	MessageCircle,
	Plus,
	ScrollText,
	Send,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	UserPlus,
	Users,
	Zap,
} from "lucide-react"
import { useState } from "react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/")({
	component: DashboardPage,
})

type Period = "7d" | "30d" | "all"

type Stats = {
	totalLeads: number
	awaiting: number
	replied: number
	conversionRate: number
	bounced: number
	pending: number
	researching: number
	researchFailed: number
}

type ActivityItem = {
	id: string
	leadId: string | null
	leadName: string | null
	step: string
	label: string
	status: string
	durationMs: number | null
	startedAt: string | Date
	completedAt: string | Date | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_META = [
	{
		stage: 0,
		label: "Captured",
		color: "var(--color-primary)",
		icon: UserPlus,
	},
	{
		stage: 1,
		label: "1st Email",
		color: "var(--color-info)",
		icon: Send,
	},
	{
		stage: 2,
		label: "Follow-up 1",
		color: "var(--color-warning)",
		icon: Mail,
	},
	{
		stage: 3,
		label: "Follow-up 2",
		color: "var(--color-success)",
		icon: CheckCircle2,
	},
]

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

function softerBg(token: string) {
	return `color-mix(in oklab, ${token} 8%, transparent)`
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
	numeric: "auto",
})

function relativeTime(input: string | Date | null | undefined): string {
	if (!input) return "—"
	const date = typeof input === "string" ? new Date(input) : input
	const diffMs = date.getTime() - Date.now()
	const diffSec = Math.round(diffMs / 1000)
	const abs = Math.abs(diffSec)
	if (abs < 60) return relativeTimeFormatter.format(diffSec, "second")
	if (abs < 3600)
		return relativeTimeFormatter.format(Math.round(diffSec / 60), "minute")
	if (abs < 86400)
		return relativeTimeFormatter.format(Math.round(diffSec / 3600), "hour")
	return relativeTimeFormatter.format(Math.round(diffSec / 86400), "day")
}

// ─── Command strip ────────────────────────────────────────────────────────────

type Health = {
	tone: "success" | "warning" | "danger" | "neutral"
	label: string
	hint: string
}

function deriveHealth(stats: Stats): Health {
	if (stats.totalLeads === 0)
		return {
			tone: "neutral",
			label: "Idle",
			hint: "Awaiting first lead capture",
		}
	const errorRate =
		((stats.bounced + stats.researchFailed) / stats.totalLeads) * 100
	if (errorRate > 25)
		return {
			tone: "danger",
			label: "Needs Attention",
			hint: `${errorRate.toFixed(0)}% pipeline errors`,
		}
	if (stats.conversionRate >= 5)
		return {
			tone: "success",
			label: "Strong",
			hint: "Conversion above target",
		}
	if (stats.awaiting > 0)
		return {
			tone: "success",
			label: "Healthy",
			hint: "Sequences running smoothly",
		}
	return {
		tone: "warning",
		label: "Warming up",
		hint: "Send more emails to evaluate",
	}
}

const HEALTH_COLOR: Record<Health["tone"], string> = {
	success: "var(--color-success)",
	warning: "var(--color-warning)",
	danger: "var(--color-danger)",
	neutral: "var(--color-muted-foreground)",
}

function CommandStrip({
	stats,
	lastRun,
	loading,
}: {
	stats: Stats
	lastRun: ActivityItem | null
	loading: boolean
}) {
	const health = deriveHealth(stats)
	const cells = [
		{
			icon: ShieldCheck,
			label: "Campaign Health",
			node: (
				<div className="flex items-center gap-2">
					<span
						className="size-2 rounded-full"
						style={{
							background: HEALTH_COLOR[health.tone],
							boxShadow: `0 0 0 3px ${softBg(HEALTH_COLOR[health.tone])}`,
						}}
					/>
					<span className="text-base font-semibold leading-none">
						{health.label}
					</span>
				</div>
			),
			hint: health.hint,
			tone: HEALTH_COLOR[health.tone],
		},
		{
			icon: Brain,
			label: "Last AI Run",
			node: (
				<span className="text-base font-semibold leading-none">
					{lastRun
						? relativeTime(lastRun.completedAt ?? lastRun.startedAt)
						: "—"}
				</span>
			),
			hint: lastRun
				? `${lastRun.label}${lastRun.leadName ? ` · ${lastRun.leadName}` : ""}`
				: "No AI activity yet",
			tone: "var(--color-primary)",
		},
		{
			icon: CalendarClock,
			label: "Next Follow-up",
			node: (
				<span className="text-base font-semibold leading-none">
					{stats.awaiting > 0 ? "Scheduled" : "Not scheduled"}
				</span>
			),
			hint:
				stats.awaiting > 0
					? `${stats.awaiting} lead${stats.awaiting === 1 ? "" : "s"} awaiting reply`
					: "Add leads to schedule a sequence",
			tone: "var(--color-warning)",
		},
		{
			icon: Inbox,
			label: "Reply Inbox",
			node: (
				<div className="flex items-baseline gap-2">
					<span className="text-base font-semibold leading-none tabular-nums">
						{stats.replied}
					</span>
					<span
						className="text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						replied
					</span>
				</div>
			),
			hint:
				stats.replied > 0
					? "Open Leads Pipeline to triage"
					: "No replies received yet",
			tone: "var(--color-success)",
		},
	]

	return (
		<div
			className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-2xl border overflow-hidden"
			style={{
				borderColor: "var(--color-border)",
				background: "var(--color-surface)",
			}}
		>
			{cells.map((cell, i) => {
				const Icon = cell.icon
				return (
					<div
						key={cell.label}
						className="flex items-start gap-3 p-4"
						style={{
							borderLeft: i > 0 ? "1px solid var(--color-border)" : undefined,
						}}
					>
						<div
							className="rounded-lg p-2 shrink-0"
							style={{ background: softBg(cell.tone), color: cell.tone }}
						>
							<Icon className="size-4" />
						</div>
						<div className="flex-1 min-w-0 space-y-1.5">
							<p
								className="text-[11px] font-semibold uppercase tracking-wider"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{cell.label}
							</p>
							{loading ? <Skeleton className="h-4 w-24" /> : cell.node}
							<p
								className="text-xs truncate"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{cell.hint}
							</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

type KpiTone = "primary" | "warning" | "success" | "accent"

const KPI_TONE_COLOR: Record<KpiTone, string> = {
	primary: "var(--color-primary)",
	warning: "var(--color-warning)",
	success: "var(--color-success)",
	accent: "var(--color-accent)",
}

function KpiCard({
	icon: Icon,
	label,
	value,
	hint,
	tone,
}: {
	icon: LucideIcon
	label: string
	value: string | number
	hint: string
	tone: KpiTone
}) {
	const color = KPI_TONE_COLOR[tone]
	return (
		<div
			className="rounded-2xl border p-5 flex flex-col gap-4 relative overflow-hidden"
			style={{
				background: "var(--color-surface)",
				borderColor: "var(--color-border)",
			}}
		>
			<div
				aria-hidden
				className="absolute -top-12 -right-12 size-32 rounded-full pointer-events-none"
				style={{ background: softerBg(color) }}
			/>
			<div className="flex items-center justify-between relative">
				<div
					className="rounded-lg p-2"
					style={{ background: softBg(color), color }}
				>
					<Icon className="size-4" />
				</div>
				<Badge tone="neutral">All time</Badge>
			</div>
			<div className="space-y-1 relative">
				<p
					className="text-[11px] font-semibold uppercase tracking-wider"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{label}
				</p>
				<p className="text-3xl font-bold tabular-nums leading-none">{value}</p>
				<p
					className="text-xs leading-snug pt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{hint}
				</p>
			</div>
		</div>
	)
}

// ─── Pipeline stage visualization ─────────────────────────────────────────────

function PipelineStages({
	stages,
	empty,
}: {
	stages: Array<{ stage: number; count: number }>
	empty: boolean
}) {
	const bars = STAGE_META.map((m) => ({
		...m,
		count: stages.find((s) => s.stage === m.stage)?.count ?? 0,
	}))
	const max = Math.max(...bars.map((b) => b.count), 1)
	const totalLeads = bars.reduce((s, b) => s + b.count, 0)
	const MAX_H = 168

	return (
		<div className="relative">
			<div
				className="flex items-end gap-4 sm:gap-6"
				style={{
					height: `${MAX_H + 36}px`,
					borderBottom: "1px solid var(--color-border)",
				}}
			>
				{bars.map((bar) => {
					const ghostHeight = MAX_H * 0.68
					const barH = empty
						? ghostHeight
						: Math.max(
								(bar.count / max) * MAX_H,
								bar.count > 0 ? 8 : ghostHeight * 0.3,
							)
					const Icon = bar.icon
					return (
						<div
							key={bar.stage}
							className="flex-1 flex flex-col items-center justify-end gap-2"
						>
							<span
								className="text-sm font-bold tabular-nums"
								style={{
									color: empty
										? "var(--color-muted-foreground)"
										: bar.count === 0
											? "var(--color-muted-foreground)"
											: "var(--color-foreground)",
									opacity: empty ? 0.35 : bar.count === 0 ? 0.5 : 1,
								}}
							>
								{empty ? "—" : bar.count}
							</span>
							<div
								className="w-full rounded-t-lg flex items-end justify-center"
								style={{
									height: `${barH}px`,
									background: empty
										? `repeating-linear-gradient(45deg, ${softBg(bar.color)} 0, ${softBg(bar.color)} 6px, transparent 6px, transparent 12px)`
										: bar.count > 0
											? bar.color
											: softBg(bar.color),
									border: empty ? `1px dashed ${softBg(bar.color)}` : undefined,
									transition: "height 0.55s cubic-bezier(.4,0,.2,1)",
								}}
							>
								<Icon
									className="size-3.5 mb-1.5"
									style={{
										color: empty
											? "var(--color-muted-foreground)"
											: bar.count > 0
												? "white"
												: bar.color,
										opacity: empty ? 0.5 : bar.count > 0 ? 0.9 : 0.6,
									}}
								/>
							</div>
						</div>
					)
				})}
			</div>
			<div className="flex gap-4 sm:gap-6 mt-3">
				{bars.map((bar) => (
					<div key={bar.stage} className="flex-1 text-center">
						<span
							className="text-xs font-medium"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{bar.label}
						</span>
					</div>
				))}
			</div>
			{empty && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div
						className="pointer-events-auto flex flex-col items-center gap-2 px-5 py-4 rounded-xl"
						style={{
							background: "var(--color-surface)",
							border: "1px solid var(--color-border)",
							boxShadow:
								"0 1px 2px 0 rgba(0,0,0,.04), 0 8px 24px -8px rgba(0,0,0,.08)",
						}}
					>
						<div
							className="size-9 rounded-lg flex items-center justify-center"
							style={{
								background: softBg("var(--color-primary)"),
								color: "var(--color-primary)",
							}}
						>
							<Sparkles className="size-4" />
						</div>
						<p className="text-sm font-semibold">Pipeline is empty</p>
						<p
							className="text-xs text-center max-w-[16rem]"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Capture a lead to see them flow across these stages.
						</p>
						<Link to="/capture">
							<Button size="sm" leadingIcon={<Plus className="size-3.5" />}>
								Capture lead
							</Button>
						</Link>
					</div>
				</div>
			)}
			{!empty && (
				<p
					className="text-xs mt-3"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{totalLeads} lead{totalLeads === 1 ? "" : "s"} tracked across the
					funnel.
				</p>
			)}
		</div>
	)
}

// ─── Conversion gauge ─────────────────────────────────────────────────────────

function ConversionGauge({ value }: { value: number }) {
	const clamped = Math.min(100, Math.max(0, value))
	const radius = 52
	const circumference = 2 * Math.PI * radius
	const dash = (clamped / 100) * circumference
	return (
		<div className="flex items-center justify-center relative">
			<svg width={140} height={140} viewBox="0 0 140 140" aria-hidden>
				<title>Conversion rate</title>
				<circle
					cx={70}
					cy={70}
					r={radius}
					fill="none"
					stroke="var(--color-border)"
					strokeWidth={12}
				/>
				<circle
					cx={70}
					cy={70}
					r={radius}
					fill="none"
					stroke="var(--color-primary)"
					strokeWidth={12}
					strokeLinecap="round"
					strokeDasharray={`${dash} ${circumference}`}
					transform="rotate(-90 70 70)"
					style={{ transition: "stroke-dasharray 0.7s ease" }}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span
					className="text-3xl font-bold tabular-nums leading-none"
					style={{ color: "var(--color-primary)" }}
				>
					{clamped}
					<span className="text-xl">%</span>
				</span>
				<span
					className="text-[10px] font-semibold uppercase tracking-widest mt-1.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Conversion
				</span>
			</div>
		</div>
	)
}

// ─── Status segments ──────────────────────────────────────────────────────────

function StatusSegments({ stats }: { stats: Stats }) {
	const segments = [
		{
			label: "Pending",
			count: stats.pending + stats.researching,
			color: "var(--color-muted-foreground)",
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
		{
			label: "Errors",
			count: stats.bounced + stats.researchFailed,
			color: "var(--color-danger)",
		},
	]
	const total = segments.reduce((s, seg) => s + seg.count, 0)
	return (
		<div className="space-y-4">
			<div
				className="flex rounded-full overflow-hidden h-2 gap-px"
				style={{ background: "var(--color-muted)" }}
			>
				{segments.map((seg) =>
					seg.count > 0 ? (
						<div
							key={seg.label}
							style={{
								flex: seg.count,
								background: seg.color,
								minWidth: "6px",
								transition: "flex 0.5s ease",
							}}
						/>
					) : null,
				)}
			</div>
			<ul className="space-y-2">
				{segments.map((seg) => {
					const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0
					return (
						<li
							key={seg.label}
							className="flex items-center justify-between gap-3 text-xs"
						>
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="size-2 rounded-full shrink-0"
									style={{ background: seg.color }}
								/>
								<span
									className="truncate"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{seg.label}
								</span>
							</div>
							<div className="flex items-baseline gap-2 tabular-nums">
								<span className="font-semibold">{seg.count}</span>
								<span style={{ color: "var(--color-muted-foreground)" }}>
									{pct}%
								</span>
							</div>
						</li>
					)
				})}
			</ul>
			<Separator />
			<div className="flex items-center justify-between text-xs">
				<span style={{ color: "var(--color-muted-foreground)" }}>
					Total tracked
				</span>
				<span className="font-bold tabular-nums">{total}</span>
			</div>
		</div>
	)
}

// ─── AI Activity feed ─────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<
	string,
	{ icon: LucideIcon; tone: string; label: string }
> = {
	capture: {
		icon: UserPlus,
		tone: "var(--color-primary)",
		label: "Lead captured",
	},
	scrape: {
		icon: ActivityIcon,
		tone: "var(--color-info)",
		label: "Website scraped",
	},
	scrape_website: {
		icon: ActivityIcon,
		tone: "var(--color-info)",
		label: "Website scraped",
	},
	website_analysis: {
		icon: Brain,
		tone: "var(--color-accent)",
		label: "Website analyzed",
	},
	company_profile: {
		icon: Brain,
		tone: "var(--color-accent)",
		label: "Company profile generated",
	},
	behavior_analysis: {
		icon: Bot,
		tone: "var(--color-accent)",
		label: "Behavior analyzed",
	},
	email_sequence: {
		icon: Mail,
		tone: "var(--color-primary)",
		label: "Email sequence generated",
	},
	html_convert: {
		icon: ScrollText,
		tone: "var(--color-info)",
		label: "HTML rendered",
	},
	subject_line: {
		icon: Sparkles,
		tone: "var(--color-primary)",
		label: "Subject crafted",
	},
	send_email: {
		icon: Send,
		tone: "var(--color-success)",
		label: "Email sent",
	},
}

const STATUS_TONE: Record<string, string> = {
	completed: "var(--color-success)",
	success: "var(--color-success)",
	running: "var(--color-info)",
	pending: "var(--color-warning)",
	failed: "var(--color-danger)",
	error: "var(--color-danger)",
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
	const meta = ACTIVITY_ICONS[activity.step] ?? {
		icon: Zap,
		tone: "var(--color-primary)",
		label: activity.label,
	}
	const Icon = meta.icon
	const statusColor = STATUS_TONE[activity.status] ?? meta.tone
	return (
		<li className="flex items-start gap-3 py-3">
			<div
				className="size-8 rounded-lg flex items-center justify-center shrink-0"
				style={{ background: softBg(meta.tone), color: meta.tone }}
			>
				<Icon className="size-4" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 min-w-0">
					<p className="text-sm font-medium truncate">{meta.label}</p>
					<span
						className="size-1.5 rounded-full shrink-0"
						style={{ background: statusColor }}
					/>
				</div>
				<p
					className="text-xs truncate"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{activity.leadName ?? "Pipeline step"}
				</p>
			</div>
			<div className="text-right shrink-0">
				<p
					className="text-xs whitespace-nowrap"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{relativeTime(activity.completedAt ?? activity.startedAt)}
				</p>
				{activity.durationMs != null && (
					<p
						className="text-[10px] tabular-nums"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{(activity.durationMs / 1000).toFixed(1)}s
					</p>
				)}
			</div>
		</li>
	)
}

// ─── Quick actions ────────────────────────────────────────────────────────────

function QuickAction({
	to,
	icon: Icon,
	label,
	description,
	tone,
}: {
	to: string
	icon: LucideIcon
	label: string
	description: string
	tone: string
}) {
	return (
		<Link
			to={to}
			className="group flex items-center gap-3 rounded-xl p-3 transition-colors"
			style={{
				background: "var(--color-surface)",
				border: "1px solid var(--color-border)",
			}}
		>
			<div
				className="size-9 rounded-lg flex items-center justify-center shrink-0"
				style={{ background: softBg(tone), color: tone }}
			>
				<Icon className="size-4" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold leading-tight">{label}</p>
				<p
					className="text-xs leading-snug truncate mt-0.5"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{description}
				</p>
			</div>
			<ChevronRight
				className="size-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
				style={{ color: "var(--color-muted-foreground)" }}
			/>
		</Link>
	)
}

// ─── Main page ────────────────────────────────────────────────────────────────

function DashboardPage() {
	const navigate = useNavigate()
	const [period, setPeriod] = useState<Period>("all")

	const statsQuery = useQuery(
		orpc.campaign.getStats.queryOptions({ input: { period } }),
	)
	const stageQuery = useQuery(
		orpc.campaign.getStageDistribution.queryOptions({ input: { period } }),
	)
	const activityQuery = useQuery(
		orpc.campaign.getRecentActivity.queryOptions({ input: { limit: 6 } }),
	)

	const stats: Stats = statsQuery.data ?? {
		totalLeads: 0,
		awaiting: 0,
		replied: 0,
		conversionRate: 0,
		bounced: 0,
		pending: 0,
		researching: 0,
		researchFailed: 0,
	}
	const activities = (activityQuery.data ?? []) as ActivityItem[]
	const stages = stageQuery.data ?? []
	const isStagesEmpty =
		!stageQuery.isPending && stages.every((s) => s.count === 0)

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<span
							className="text-[11px] font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-primary)" }}
						>
							AI SDR Command Center
						</span>
						<span
							className="size-1 rounded-full"
							style={{ background: "var(--color-muted-foreground)" }}
						/>
						<span
							className="text-[11px] uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Live
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight">Overview</h1>
					<p
						className="text-sm"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						AI SDR campaign performance at a glance.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
						<TabsList>
							<TabsTrigger value="7d">7 days</TabsTrigger>
							<TabsTrigger value="30d">30 days</TabsTrigger>
							<TabsTrigger value="all">All time</TabsTrigger>
						</TabsList>
					</Tabs>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							leadingIcon={<FileSpreadsheet className="size-4" />}
							onClick={() => navigate({ to: "/bulk-capture" })}
						>
							Bulk Import
						</Button>
						<Button
							leadingIcon={<Plus className="size-4" />}
							onClick={() => navigate({ to: "/capture" })}
						>
							Add Lead
						</Button>
					</div>
				</div>
			</div>

			{/* ── Command strip ── */}
			<CommandStrip
				stats={stats}
				lastRun={activities[0] ?? null}
				loading={statsQuery.isPending || activityQuery.isPending}
			/>

			{/* ── KPI row ── */}
			{statsQuery.isPending ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-32 rounded-2xl" />
					))}
				</div>
			) : statsQuery.error ? (
				<div
					className="rounded-2xl border p-5 text-sm"
					style={{
						borderColor: "var(--color-danger)",
						color: "var(--color-danger)",
						background: softBg("var(--color-danger)"),
					}}
				>
					Failed to load dashboard stats.
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
					<KpiCard
						icon={Users}
						label="Total Leads"
						value={stats.totalLeads}
						hint={
							stats.totalLeads === 0
								? "Capture a lead to activate the pipeline"
								: "Across every stage of the funnel"
						}
						tone="primary"
					/>
					<KpiCard
						icon={Mail}
						label="Awaiting Reply"
						value={stats.awaiting}
						hint={
							stats.awaiting === 0
								? "No outstanding email follow-ups"
								: "Sequenced & waiting for prospect"
						}
						tone="warning"
					/>
					<KpiCard
						icon={MessageCircle}
						label="Replied"
						value={stats.replied}
						hint={
							stats.replied === 0
								? "Replies will surface here automatically"
								: "Prospects engaging with sequences"
						}
						tone="success"
					/>
					<KpiCard
						icon={TrendingUp}
						label="Conversion Rate"
						value={`${stats.conversionRate}%`}
						hint={
							stats.totalLeads === 0
								? "Will calculate once leads start replying"
								: "Replied ÷ total leads"
						}
						tone="accent"
					/>
				</div>
			)}

			{/* ── Main grid: pipeline + health ── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-start justify-between gap-3">
						<div>
							<CardTitle className="text-base">Pipeline Stages</CardTitle>
							<p
								className="text-xs mt-1"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Leads at each stage of the outbound sequence
							</p>
						</div>
						<Link to="/leads">
							<Button variant="ghost" size="sm">
								Open pipeline
								<ArrowRight className="size-3.5" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						{stageQuery.isPending ? (
							<Skeleton className="h-52 w-full rounded-lg" />
						) : stageQuery.error ? (
							<p
								className="text-sm py-4"
								style={{ color: "var(--color-danger)" }}
							>
								Failed to load funnel data.
							</p>
						) : (
							<PipelineStages stages={stages} empty={isStagesEmpty} />
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Campaign Health</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Conversion & status distribution
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						{statsQuery.isPending ? (
							<Skeleton className="h-36 w-full rounded-lg" />
						) : (
							<>
								<ConversionGauge value={stats.conversionRate} />
								<StatusSegments stats={stats} />
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ── AI Activity + Quick Actions ── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-row items-start justify-between gap-3">
						<div className="flex items-start gap-3">
							<div
								className="size-9 rounded-lg flex items-center justify-center"
								style={{
									background: softBg("var(--color-primary)"),
									color: "var(--color-primary)",
								}}
							>
								<Bot className="size-4" />
							</div>
							<div>
								<CardTitle className="text-base">AI Activity</CardTitle>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Recent automation across all leads
								</p>
							</div>
						</div>
						<Link to="/logs">
							<Button variant="ghost" size="sm">
								Full logs
								<ArrowRight className="size-3.5" />
							</Button>
						</Link>
					</CardHeader>
					<CardContent>
						{activityQuery.isPending ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-12 rounded-lg" />
								))}
							</div>
						) : activities.length === 0 ? (
							<div
								className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed text-center"
								style={{
									borderColor: "var(--color-border)",
									background: "var(--color-surface-muted)",
								}}
							>
								<div
									className="size-10 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-primary)"),
										color: "var(--color-primary)",
									}}
								>
									<Sparkles className="size-4" />
								</div>
								<p className="text-sm font-semibold">
									AI hasn't run anything yet
								</p>
								<p
									className="text-xs max-w-xs"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Capture a lead and the AI pipeline (research → analyze →
									sequence → send) will appear here in real time.
								</p>
							</div>
						) : (
							<ul
								className="divide-y"
								style={{ borderColor: "var(--color-border)" }}
							>
								{activities.map((a) => (
									<ActivityRow key={a.id} activity={a} />
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Quick Actions</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Jump straight into the next task
						</p>
					</CardHeader>
					<CardContent className="space-y-2.5">
						<QuickAction
							to="/capture"
							icon={UserPlus}
							label="Add a lead"
							description="Trigger the AI outbound pipeline"
							tone="var(--color-primary)"
						/>
						<QuickAction
							to="/bulk-capture"
							icon={FileSpreadsheet}
							label="Bulk import"
							description="Upload a CSV of prospects"
							tone="var(--color-info)"
						/>
						<QuickAction
							to="/leads"
							icon={Users}
							label="View pipeline"
							description="Inspect every lead's status"
							tone="var(--color-accent)"
						/>
						<QuickAction
							to="/logs"
							icon={ScrollText}
							label="Activity logs"
							description="Full pipeline execution history"
							tone="var(--color-success)"
						/>
						<QuickAction
							to="/settings"
							icon={Clock}
							label="Settings"
							description="Schedule, AI prompts, email config"
							tone="var(--color-warning)"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
