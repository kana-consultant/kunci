import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
	Skeleton,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Activity, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { useState } from "react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/logs")({
	component: LogsPage,
})

type StatusFilter = "all" | "completed" | "failed" | "running"

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

function formatDuration(ms: number | null) {
	if (!ms) return null
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

const stepIconMap: Record<string, string> = {
	capture: "Captured",
	scrape: "Scraped website",
	analyze_website: "Analyzed website",
	build_profile: "Built profile",
	analyze_behavior: "Analyzed behavior",
	generate_sequence: "Generated email sequence",
	send_email: "Sent email",
	follow_up: "Sent follow-up",
	reply: "Handled reply",
}

function StatusIcon({ status }: { status: string }) {
	if (status === "completed")
		return (
			<CheckCircle2
				className="w-4 h-4 shrink-0"
				style={{ color: "var(--color-success)" }}
			/>
		)
	if (status === "failed")
		return (
			<XCircle
				className="w-4 h-4 shrink-0"
				style={{ color: "var(--color-danger)" }}
			/>
		)
	if (status === "running")
		return (
			<Loader2
				className="w-4 h-4 shrink-0 animate-spin"
				style={{ color: "var(--color-primary)" }}
			/>
		)
	return (
		<Clock
			className="w-4 h-4 shrink-0"
			style={{ color: "var(--color-muted-foreground)" }}
		/>
	)
}

function badgeTone(
	status: string,
): "success" | "danger" | "primary" | "neutral" {
	if (status === "completed") return "success"
	if (status === "failed") return "danger"
	if (status === "running") return "primary"
	return "neutral"
}

function LogsPage() {
	const [filter, setFilter] = useState<StatusFilter>("all")

	const activityQuery = useQuery(
		orpc.campaign.getRecentActivity.queryOptions({ input: { limit: 200 } }),
	)

	const allItems = activityQuery.data ?? []
	const filtered =
		filter === "all"
			? allItems
			: allItems.filter((item) => item.status === filter)

	const counts = {
		all: allItems.length,
		completed: allItems.filter((i) => i.status === "completed").length,
		running: allItems.filter((i) => i.status === "running").length,
		failed: allItems.filter((i) => i.status === "failed").length,
	}

	const filters: Array<{ key: StatusFilter; label: string; accent?: string }> =
		[
			{ key: "all", label: `All  ${counts.all}` },
			{ key: "completed", label: `Completed  ${counts.completed}` },
			{ key: "running", label: `In Progress  ${counts.running}` },
			{ key: "failed", label: `Failed  ${counts.failed}` },
		]

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Activity Logs</h1>
				<p
					className="text-sm mt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Step-by-step pipeline execution history for all leads.
				</p>
			</div>

			{/* Summary strip */}
			{!activityQuery.isPending && (
				<div
					className="grid grid-cols-3 gap-px rounded-xl overflow-hidden"
					style={{ background: "var(--color-border)" }}
				>
					{[
						{
							label: "Total Steps",
							value: counts.all,
							color: "var(--color-foreground)",
						},
						{
							label: "Completed",
							value: counts.completed,
							color: "var(--color-success)",
						},
						{
							label: "Failed",
							value: counts.failed,
							color: "var(--color-danger)",
						},
					].map((s) => (
						<div
							key={s.label}
							className="flex flex-col gap-0.5 px-5 py-4"
							style={{ background: "var(--color-background)" }}
						>
							<span className="text-2xl font-bold" style={{ color: s.color }}>
								{s.value}
							</span>
							<span
								className="text-xs"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{s.label}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Filter row */}
			<div className="flex gap-2 flex-wrap">
				{filters.map(({ key, label }) => (
					<Button
						key={key}
						type="button"
						variant={filter === key ? "primary" : "ghost"}
						onClick={() => setFilter(key)}
						className="rounded-full text-sm"
						style={
							filter === key
								? { background: "var(--color-primary)", color: "#fff" }
								: { color: "var(--color-muted-foreground)" }
						}
					>
						{label}
					</Button>
				))}
			</div>

			{/* Log list */}
			<Card>
				<CardHeader className="pb-0">
					<CardTitle
						className="text-sm font-medium"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						{filtered.length} {filter === "all" ? "total" : filter} entries
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0 mt-3">
					{activityQuery.isPending ? (
						<div
							className="divide-y"
							style={{ borderColor: "var(--color-border)" }}
						>
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="p-4 flex items-start gap-3">
									<Skeleton className="w-4 h-4 rounded-full mt-0.5 shrink-0" />
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
							className="flex flex-col items-center justify-center py-16 gap-3"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							<Activity className="w-10 h-10 opacity-20" />
							<p className="text-sm">No entries for this filter.</p>
						</div>
					) : (
						<div
							className="divide-y"
							style={{ borderColor: "var(--color-border)" }}
						>
							{filtered.map((item, idx) => (
								<div
									key={item.id}
									className="flex items-start gap-3 px-4 py-3.5 transition-colors"
									style={{
										background:
											idx % 2 === 0
												? "transparent"
												: "var(--color-surface-alt, transparent)",
									}}
								>
									<div className="mt-0.5">
										<StatusIcon status={item.status} />
									</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="text-sm font-medium truncate">
												{item.label}
											</span>
											<Badge
												tone={badgeTone(item.status)}
												className="text-xs shrink-0"
											>
												{item.status}
											</Badge>
										</div>
										<div
											className="flex items-center gap-3 mt-1 text-xs"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											{item.leadName && (
												<span className="truncate font-medium">
													{item.leadName}
												</span>
											)}
											{item.leadName && (
												<Separator orientation="vertical" className="h-3" />
											)}
											<span className="shrink-0">
												{stepIconMap[item.step] ?? item.step}
											</span>
											{item.durationMs && (
												<>
													<Separator orientation="vertical" className="h-3" />
													<span className="shrink-0 tabular-nums">
														{formatDuration(item.durationMs)}
													</span>
												</>
											)}
											<Separator orientation="vertical" className="h-3" />
											<span className="shrink-0">
												{getRelativeTime(item.startedAt)}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
