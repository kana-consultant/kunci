import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	Activity,
	CheckCircle2,
	Clock,
	type LucideIcon,
	Loader2,
	Search,
	Sparkles,
	XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/logs")({
	component: LogsPage,
})

type StatusFilter = "all" | "completed" | "failed" | "running"

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

function getRelativeTime(dateString: string | Date) {
	const diff = Date.now() - new Date(dateString).getTime()
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return "Just now"
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

function formatDuration(ms: number | null) {
	if (ms == null) return null
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

const stepLabelMap: Record<string, string> = {
	capture: "Captured",
	scrape: "Scraped website",
	scrape_website: "Scraped website",
	analyze_website: "Analyzed website",
	website_analysis: "Analyzed website",
	build_profile: "Built profile",
	company_profile: "Built company profile",
	analyze_behavior: "Analyzed behavior",
	behavior_analysis: "Analyzed behavior",
	generate_sequence: "Generated email sequence",
	email_sequence: "Generated email sequence",
	html_convert: "Rendered HTML",
	subject_line: "Crafted subject line",
	send_email: "Sent email",
	follow_up: "Sent follow-up",
	reply: "Handled reply",
}

const STATUS_META: Record<
	string,
	{ icon: LucideIcon; tone: string; label: string }
> = {
	completed: {
		icon: CheckCircle2,
		tone: "var(--color-success)",
		label: "Completed",
	},
	success: {
		icon: CheckCircle2,
		tone: "var(--color-success)",
		label: "Completed",
	},
	failed: { icon: XCircle, tone: "var(--color-danger)", label: "Failed" },
	error: { icon: XCircle, tone: "var(--color-danger)", label: "Failed" },
	running: {
		icon: Loader2,
		tone: "var(--color-info)",
		label: "In progress",
	},
	pending: { icon: Clock, tone: "var(--color-warning)", label: "Pending" },
}

function statusMeta(status: string) {
	return (
		STATUS_META[status] ?? {
			icon: Clock,
			tone: "var(--color-muted-foreground)",
			label: status,
		}
	)
}

function badgeTone(
	status: string,
): "success" | "danger" | "info" | "warning" | "neutral" {
	if (status === "completed" || status === "success") return "success"
	if (status === "failed" || status === "error") return "danger"
	if (status === "running") return "info"
	if (status === "pending") return "warning"
	return "neutral"
}

type SummaryCell = {
	label: string
	value: number
	tone: string
	icon: LucideIcon
	hint: string
}

function SummaryStrip({ cells }: { cells: SummaryCell[] }) {
	return (
		<div
			className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl border overflow-hidden"
			style={{
				borderColor: "var(--color-border)",
				background: "var(--color-surface)",
			}}
		>
			{cells.map((c, i) => {
				const Icon = c.icon
				return (
					<div
						key={c.label}
						className="flex items-start gap-3 p-4"
						style={{
							borderLeft: i > 0 ? "1px solid var(--color-border)" : undefined,
						}}
					>
						<div
							className="rounded-lg p-2 shrink-0"
							style={{ background: softBg(c.tone), color: c.tone }}
						>
							<Icon className="size-4" />
						</div>
						<div className="flex-1 min-w-0 space-y-1">
							<p
								className="text-[11px] font-semibold uppercase tracking-wider"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{c.label}
							</p>
							<p className="text-2xl font-bold tabular-nums leading-none">
								{c.value}
							</p>
							<p
								className="text-xs truncate"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{c.hint}
							</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}

function FilterPill({
	active,
	tone,
	label,
	count,
	onClick,
}: {
	active: boolean
	tone: string
	label: string
	count: number
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
			style={{
				background: active ? softBg(tone) : "var(--color-surface)",
				border: `1px solid ${active ? tone : "var(--color-border)"}`,
				color: active ? tone : "var(--color-foreground)",
			}}
		>
			<span
				className="size-1.5 rounded-full"
				style={{ background: tone }}
			/>
			{label}
			<span
				className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
				style={{
					background: active
						? "var(--color-surface)"
						: "var(--color-surface-muted)",
					color: active ? tone : "var(--color-muted-foreground)",
				}}
			>
				{count}
			</span>
		</button>
	)
}

type LogItem = {
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

function LogRow({ item }: { item: LogItem }) {
	const meta = statusMeta(item.status)
	const Icon = meta.icon
	const label = stepLabelMap[item.step] ?? item.label
	const duration = formatDuration(item.durationMs)
	return (
		<li
			className="flex items-start gap-3 px-4 py-3.5"
			style={{
				borderLeft: `3px solid ${meta.tone}`,
				background: "var(--color-surface)",
			}}
		>
			<div
				className="size-8 rounded-lg flex items-center justify-center shrink-0"
				style={{ background: softBg(meta.tone), color: meta.tone }}
			>
				<Icon
					className={`size-4 ${item.status === "running" ? "animate-spin" : ""}`}
				/>
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 flex-wrap">
					<p className="text-sm font-semibold truncate">{label}</p>
					<Badge tone={badgeTone(item.status)} size="sm">
						{meta.label}
					</Badge>
				</div>
				<div
					className="flex items-center gap-2 mt-1 text-xs flex-wrap"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{item.leadName && (
						<>
							<span className="font-medium truncate">{item.leadName}</span>
							<span
								className="size-1 rounded-full shrink-0"
								style={{ background: "var(--color-border-strong)" }}
							/>
						</>
					)}
					<span className="font-mono shrink-0">{item.step}</span>
					{duration && (
						<>
							<span
								className="size-1 rounded-full shrink-0"
								style={{ background: "var(--color-border-strong)" }}
							/>
							<span className="shrink-0 tabular-nums">{duration}</span>
						</>
					)}
				</div>
			</div>
			<div className="text-right shrink-0">
				<p
					className="text-xs whitespace-nowrap tabular-nums"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{getRelativeTime(item.completedAt ?? item.startedAt)}
				</p>
			</div>
		</li>
	)
}

function LogsPage() {
	const [filter, setFilter] = useState<StatusFilter>("all")
	const [search, setSearch] = useState("")

	const activityQuery = useQuery(
		orpc.campaign.getRecentActivity.queryOptions({ input: { limit: 200 } }),
	)

	const allItems = (activityQuery.data ?? []) as LogItem[]

	const counts = useMemo(
		() => ({
			all: allItems.length,
			completed: allItems.filter((i) => i.status === "completed").length,
			running: allItems.filter((i) => i.status === "running").length,
			failed: allItems.filter((i) => i.status === "failed").length,
		}),
		[allItems],
	)

	const filtered = useMemo(() => {
		const byStatus =
			filter === "all" ? allItems : allItems.filter((i) => i.status === filter)
		const q = search.trim().toLowerCase()
		if (!q) return byStatus
		return byStatus.filter(
			(i) =>
				(i.leadName ?? "").toLowerCase().includes(q) ||
				i.step.toLowerCase().includes(q) ||
				i.label.toLowerCase().includes(q),
		)
	}, [allItems, filter, search])

	const summary: SummaryCell[] = [
		{
			label: "Total Steps",
			value: counts.all,
			tone: "var(--color-primary)",
			icon: Activity,
			hint: "Across every pipeline run",
		},
		{
			label: "Completed",
			value: counts.completed,
			tone: "var(--color-success)",
			icon: CheckCircle2,
			hint: "Successfully finished",
		},
		{
			label: "Running",
			value: counts.running,
			tone: "var(--color-info)",
			icon: Loader2,
			hint: "Currently in progress",
		},
		{
			label: "Failed",
			value: counts.failed,
			tone: "var(--color-danger)",
			icon: XCircle,
			hint: "Errored — check the lead",
		},
	]

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<span
						className="text-[11px] font-semibold uppercase tracking-widest"
						style={{ color: "var(--color-primary)" }}
					>
						Activity Logs
					</span>
					<span
						className="size-1 rounded-full"
						style={{ background: "var(--color-muted-foreground)" }}
					/>
					<span
						className="text-[11px] uppercase tracking-widest"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{counts.all} step{counts.all === 1 ? "" : "s"}
					</span>
				</div>
				<h1 className="text-2xl font-bold tracking-tight">Pipeline Logs</h1>
				<p
					className="text-sm"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Step-by-step execution history for every lead in the AI pipeline.
				</p>
			</div>

			{/* ── Summary ── */}
			{activityQuery.isPending ? (
				<Skeleton className="h-24 rounded-2xl" />
			) : (
				<SummaryStrip cells={summary} />
			)}

			{/* ── Toolbar ── */}
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex gap-2 flex-wrap">
					<FilterPill
						active={filter === "all"}
						tone="var(--color-primary)"
						label="All"
						count={counts.all}
						onClick={() => setFilter("all")}
					/>
					<FilterPill
						active={filter === "completed"}
						tone="var(--color-success)"
						label="Completed"
						count={counts.completed}
						onClick={() => setFilter("completed")}
					/>
					<FilterPill
						active={filter === "running"}
						tone="var(--color-info)"
						label="Running"
						count={counts.running}
						onClick={() => setFilter("running")}
					/>
					<FilterPill
						active={filter === "failed"}
						tone="var(--color-danger)"
						label="Failed"
						count={counts.failed}
						onClick={() => setFilter("failed")}
					/>
				</div>
				<div className="relative w-full lg:w-72">
					<Search
						className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
						style={{ color: "var(--color-muted-foreground)" }}
					/>
					<Input
						placeholder="Search by lead, step…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9 h-9"
					/>
					{search && (
						<Button
							variant="ghost"
							size="sm"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
							onClick={() => setSearch("")}
						>
							Clear
						</Button>
					)}
				</div>
			</div>

			{/* ── Log list ── */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-3">
					<div>
						<CardTitle className="text-base">Timeline</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{filtered.length}{" "}
							{filter === "all" ? "total" : filter} entr
							{filtered.length === 1 ? "y" : "ies"}
							{search && ` matching "${search}"`}
						</p>
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{activityQuery.isPending ? (
						<div
							className="divide-y"
							style={{ borderColor: "var(--color-border)" }}
						>
							{Array.from({ length: 8 }).map((_, i) => (
								<div
									key={`sk-${i}`}
									className="p-4 flex items-start gap-3"
								>
									<Skeleton className="size-8 rounded-lg shrink-0" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-2/3" />
										<Skeleton className="h-3 w-1/3" />
									</div>
								</div>
							))}
						</div>
					) : activityQuery.error ? (
						<div
							className="p-8 text-sm text-center"
							style={{ color: "var(--color-danger)" }}
						>
							Failed to load activity logs.
						</div>
					) : filtered.length === 0 ? (
						<div
							className="m-5 flex flex-col items-center justify-center gap-3 py-10 rounded-xl border border-dashed text-center"
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
								{counts.all === 0
									? "No pipeline activity yet"
									: "No entries match this filter"}
							</p>
							<p
								className="text-xs max-w-xs"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{counts.all === 0
									? "Capture a lead and pipeline steps will start appearing here in real time."
									: "Try clearing the search or switching filters."}
							</p>
						</div>
					) : (
						<ul
							className="space-y-2 p-3"
							style={{ background: "var(--color-surface-muted)" }}
						>
							{filtered.map((item) => (
								<LogRow key={item.id} item={item} />
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
