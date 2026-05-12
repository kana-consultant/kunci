import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Progress,
	Skeleton,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kana-consultant/ui-kit"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	ArrowLeft,
	Brain,
	Calendar,
	CheckCircle2,
	Clock,
	ExternalLink,
	FileText,
	Globe,
	Linkedin,
	Loader2,
	type LucideIcon,
	Mail,
	MapPin,
	RotateCcw,
	Send,
	Sparkles,
	Tag,
	UserCheck,
	XCircle,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
	component: LeadDetailPage,
})

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

const statusTones: Record<
	string,
	"neutral" | "primary" | "success" | "warning" | "danger" | "info"
> = {
	pending: "warning",
	researching: "info",
	ready: "success",
	awaiting: "primary",
	replied: "success",
	completed: "neutral",
	bounced: "danger",
	research_failed: "warning",
}

const statusLabels: Record<string, string> = {
	pending: "Pending",
	researching: "Researching",
	ready: "Ready",
	awaiting: "Awaiting reply",
	replied: "Replied",
	completed: "Completed",
	bounced: "Bounced",
	research_failed: "Research failed",
}

const stageMeta: Record<number, { label: string; tone: string }> = {
	0: { label: "Captured", tone: "var(--color-primary)" },
	1: { label: "1st Email Sent", tone: "var(--color-info)" },
	2: { label: "Follow-up 1", tone: "var(--color-warning)" },
	3: { label: "Follow-up 2", tone: "var(--color-success)" },
}

const stepMeta: Record<string, { icon: LucideIcon; color: string }> = {
	capture: { icon: UserCheck, color: "var(--color-primary)" },
	scrape: { icon: Globe, color: "var(--color-info)" },
	scrape_website: { icon: Globe, color: "var(--color-info)" },
	analyze_website: { icon: Brain, color: "var(--color-accent)" },
	website_analysis: { icon: Brain, color: "var(--color-accent)" },
	build_profile: { icon: FileText, color: "var(--color-success)" },
	company_profile: { icon: FileText, color: "var(--color-success)" },
	analyze_behavior: { icon: Brain, color: "var(--color-warning)" },
	behavior_analysis: { icon: Brain, color: "var(--color-warning)" },
	generate_sequence: { icon: Mail, color: "var(--color-primary)" },
	email_sequence: { icon: Mail, color: "var(--color-primary)" },
	html_convert: { icon: FileText, color: "var(--color-info)" },
	subject_line: { icon: Sparkles, color: "var(--color-primary)" },
	send_email: { icon: Send, color: "var(--color-success)" },
}

const STATUS_COLOR: Record<string, string> = {
	completed: "var(--color-success)",
	success: "var(--color-success)",
	running: "var(--color-info)",
	pending: "var(--color-warning)",
	failed: "var(--color-danger)",
	error: "var(--color-danger)",
}

function formatDuration(ms: number | null): string {
	if (!ms) return "—"
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

function initials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "L"
	)
}

const dateFormatter = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
	year: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("en", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
})

function relativeTime(input: string | Date | null | undefined): string {
	if (!input) return "—"
	const date = typeof input === "string" ? new Date(input) : input
	const diff = Date.now() - date.getTime()
	const sec = Math.round(diff / 1000)
	const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
	if (Math.abs(sec) < 60) return formatter.format(-sec, "second")
	if (Math.abs(sec) < 3600)
		return formatter.format(-Math.round(sec / 60), "minute")
	if (Math.abs(sec) < 86400)
		return formatter.format(-Math.round(sec / 3600), "hour")
	return formatter.format(-Math.round(sec / 86400), "day")
}

// ─── Status strip ────────────────────────────────────────────────────────────

type StripCell = {
	icon: LucideIcon
	label: string
	value: string
	hint?: string
	tone: string
}

function StatusStrip({ cells }: { cells: StripCell[] }) {
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
							<p className="text-base font-semibold leading-none truncate">
								{c.value}
							</p>
							{c.hint && (
								<p
									className="text-xs truncate"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{c.hint}
								</p>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}

// ─── Contact row ─────────────────────────────────────────────────────────────

function ContactRow({
	icon: Icon,
	label,
	children,
	tone,
}: {
	icon: LucideIcon
	label: string
	children: React.ReactNode
	tone: string
}) {
	return (
		<div className="flex items-start gap-3">
			<div
				className="size-8 rounded-lg flex items-center justify-center shrink-0"
				style={{ background: softBg(tone), color: tone }}
			>
				<Icon className="size-4" />
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="text-[11px] font-semibold uppercase tracking-wider"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{label}
				</p>
				<div className="text-sm mt-0.5 min-w-0">{children}</div>
			</div>
		</div>
	)
}

// ─── Pipeline timeline ───────────────────────────────────────────────────────

type PipelineStep = {
	id?: string
	step: string
	label: string
	status: string
	durationMs: number | null
	startedAt: string | Date
	completedAt: string | Date | null
	detail?: Record<string, unknown> | null
}

function PipelineStepsTimeline({ leadId }: { leadId: string }) {
	const {
		data: steps,
		isPending,
		error,
	} = useQuery({
		...orpc.lead.getPipelineSteps.queryOptions({ input: { leadId } }),
		// Poll while the pipeline is still executing — stop as soon as no
		// step is in `running` state (and at least one step exists).
		refetchInterval: (query) => {
			const data = query.state.data as PipelineStep[] | undefined
			if (!data || data.length === 0) return 2000
			return data.some((s) => s.status === "running") ? 2000 : false
		},
		refetchIntervalInBackground: false,
	})

	const pipelineSteps = (steps ?? []) as PipelineStep[]

	if (isPending) {
		return (
			<div className="space-y-3">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-16 rounded-lg" />
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div
				className="p-4 rounded-xl border text-sm"
				style={{
					borderColor: "var(--color-danger)",
					color: "var(--color-danger)",
					background: softBg("var(--color-danger)"),
				}}
			>
				Failed to load pipeline steps.
			</div>
		)
	}

	if (pipelineSteps.length === 0) {
		return (
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
				<p className="text-sm font-semibold">No pipeline steps yet</p>
				<p
					className="text-xs max-w-xs"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Steps will appear here as the AI pipeline runs.
				</p>
			</div>
		)
	}

	const totalSteps = 7
	const completedCount = pipelineSteps.filter(
		(s) => s.status === "completed",
	).length
	const failedCount = pipelineSteps.filter((s) => s.status === "failed").length
	const runningCount = pipelineSteps.filter(
		(s) => s.status === "running",
	).length
	const progressValue = Math.min(100, (completedCount / totalSteps) * 100)

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span style={{ color: "var(--color-muted-foreground)" }}>
							Overall progress
						</span>
						<span className="font-semibold tabular-nums">
							{completedCount}/{totalSteps}
						</span>
					</div>
					<Progress value={progressValue} tone="primary" />
					<div className="flex flex-wrap gap-2 text-[11px]">
						<span
							className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
							style={{
								background: softBg("var(--color-success)"),
								color: "var(--color-success)",
							}}
						>
							<CheckCircle2 className="size-3" />
							{completedCount} done
						</span>
						{runningCount > 0 && (
							<span
								className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
								style={{
									background: softBg("var(--color-info)"),
									color: "var(--color-info)",
								}}
							>
								<Loader2 className="size-3 animate-spin" />
								{runningCount} running
							</span>
						)}
						{failedCount > 0 && (
							<span
								className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full"
								style={{
									background: softBg("var(--color-danger)"),
									color: "var(--color-danger)",
								}}
							>
								<XCircle className="size-3" />
								{failedCount} failed
							</span>
						)}
					</div>
				</div>

				<ol className="relative space-y-2">
					<span
						aria-hidden
						className="absolute left-[15px] top-3 bottom-3 w-px"
						style={{ background: "var(--color-border)" }}
					/>
					{pipelineSteps.map((step, idx) => {
						const meta = stepMeta[step.step] ?? {
							icon: CheckCircle2,
							color: "var(--color-muted-foreground)",
						}
						const StepIcon = meta.icon
						const statusColor =
							STATUS_COLOR[step.status] ?? "var(--color-muted-foreground)"
						const detail = step.detail as Record<string, string> | null
						const isRunning = step.status === "running"
						const isFailed = step.status === "failed" || step.status === "error"

						return (
							<li
								key={step.id ?? `${step.step}-${idx}`}
								className="flex items-start gap-3 relative"
							>
								<div
									className="size-8 rounded-lg flex items-center justify-center shrink-0 relative z-10"
									style={{
										background: softBg(statusColor),
										color: statusColor,
										boxShadow: "0 0 0 4px var(--color-surface)",
									}}
								>
									{isRunning ? (
										<Loader2 className="size-4 animate-spin" />
									) : isFailed ? (
										<XCircle className="size-4" />
									) : (
										<StepIcon className="size-4" />
									)}
								</div>

								<div
									className="flex-1 min-w-0 rounded-xl border p-3"
									style={{
										background: "var(--color-surface)",
										borderColor: "var(--color-border)",
									}}
								>
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<div className="flex items-center gap-2 min-w-0">
											<StepIcon
												className="size-3.5 shrink-0"
												style={{ color: meta.color }}
											/>
											<span className="text-sm font-semibold truncate">
												{step.label}
											</span>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											{step.durationMs != null && (
												<span
													className="text-xs font-mono tabular-nums"
													style={{ color: "var(--color-muted-foreground)" }}
												>
													{formatDuration(step.durationMs)}
												</span>
											)}
											<Badge
												tone={
													isFailed
														? "danger"
														: isRunning
															? "info"
															: step.status === "completed"
																? "success"
																: "neutral"
												}
												size="sm"
												dot
											>
												{step.status}
											</Badge>
										</div>
									</div>

									{detail && (
										<div className="mt-2 space-y-1">
											{detail.error && (
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs truncate cursor-help"
															style={{ color: "var(--color-danger)" }}
														>
															<span className="font-semibold">Error:</span>{" "}
															{detail.error}
														</p>
													</TooltipTrigger>
													<TooltipContent>{detail.error}</TooltipContent>
												</Tooltip>
											)}
											{detail.provider && (
												<p
													className="text-xs"
													style={{ color: "var(--color-muted-foreground)" }}
												>
													Provider:{" "}
													<span className="font-medium">{detail.provider}</span>
													{detail.model && (
														<>
															{" · "}Model:{" "}
															<span className="font-mono">{detail.model}</span>
														</>
													)}
												</p>
											)}
											{detail.apiUrl && (
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs font-mono truncate cursor-help opacity-60"
															style={{ color: "var(--color-muted-foreground)" }}
														>
															→ {detail.apiUrl}
														</p>
													</TooltipTrigger>
													<TooltipContent>{detail.apiUrl}</TooltipContent>
												</Tooltip>
											)}
											{detail.url && !detail.apiUrl && (
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs font-mono truncate cursor-help opacity-60"
															style={{ color: "var(--color-muted-foreground)" }}
														>
															→ {detail.url}
														</p>
													</TooltipTrigger>
													<TooltipContent>{detail.url}</TooltipContent>
												</Tooltip>
											)}
										</div>
									)}

									<p
										className="text-[10px] mt-1.5 tabular-nums"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										{timeFormatter.format(new Date(step.startedAt))}
									</p>
								</div>
							</li>
						)
					})}
				</ol>
			</div>
		</TooltipProvider>
	)
}

// ─── Main page ───────────────────────────────────────────────────────────────

function LeadDetailPage() {
	const { leadId } = Route.useParams()

	const { data, isPending, error } = useQuery({
		...orpc.lead.getDetail.queryOptions({ input: { id: leadId } }),
		// Auto-poll lead detail while the pipeline is in-flight or the lead
		// is waiting on a reply. Stops as soon as the lead reaches a stable
		// terminal-ish state (`completed`, `replied`, `bounced`, `opted_out`).
		refetchInterval: (query) => {
			const lead = query.state.data as { replyStatus?: string } | undefined
			const status = lead?.replyStatus
			if (!status) return 2000
			const live = new Set([
				"pending",
				"researching",
				"research_failed",
				"ready",
				"awaiting",
			])
			return live.has(status) ? 2000 : false
		},
		refetchIntervalInBackground: false,
	})
	const queryClient = useQueryClient()

	// biome-ignore lint/suspicious/noExplicitAny: oRPC mutationOptions narrowing escape
	const { mutate: retry, isPending: isRetrying } = useMutation(
		(orpc.lead.retry as any).mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries()
			},
		}),
	)

	if (isPending) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-24 rounded-2xl" />
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<Skeleton className="h-64 rounded-2xl" />
					<Skeleton className="h-64 rounded-2xl lg:col-span-2" />
				</div>
			</div>
		)
	}

	if (error || !data) {
		return (
			<div className="space-y-4">
				<Link
					to="/leads"
					className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					<ArrowLeft className="size-3.5" />
					Back to pipeline
				</Link>
				<Card>
					<CardContent
						className="p-5 flex items-start gap-3"
						style={{ color: "var(--color-danger)" }}
					>
						<XCircle className="size-5 shrink-0" />
						<div>
							<p className="font-semibold">Failed to load lead</p>
							<p
								className="text-sm mt-1"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Make sure the API server is running.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	const lead = data as {
		fullName: string
		email: string
		companyName: string
		companyWebsite: string
		painPoints?: string | null
		companyResearch?: string | null
		stage: number
		replyStatus: string
		leadSource?: string | null
		linkedinUrl?: string | null
		lastEmailSentAt?: string | Date | null
		createdAt: string | Date
	}

	const statusTone = statusTones[lead.replyStatus] ?? "neutral"
	const stage = stageMeta[lead.stage] ?? {
		label: `Stage ${lead.stage}`,
		tone: "var(--color-muted-foreground)",
	}

	const stripCells: StripCell[] = [
		{
			icon: Tag,
			label: "Stage",
			value: stage.label,
			hint: `Stage ${lead.stage} of 3`,
			tone: stage.tone,
		},
		{
			icon: Mail,
			label: "Reply Status",
			value: statusLabels[lead.replyStatus] ?? lead.replyStatus,
			hint:
				lead.replyStatus === "awaiting"
					? "Awaiting prospect reply"
					: lead.replyStatus === "replied"
						? "Engaged — triage in inbox"
						: "Pipeline status",
			tone:
				lead.replyStatus === "replied"
					? "var(--color-success)"
					: lead.replyStatus === "awaiting"
						? "var(--color-warning)"
						: lead.replyStatus === "bounced"
							? "var(--color-danger)"
							: "var(--color-info)",
		},
		{
			icon: Calendar,
			label: "Captured",
			value: dateFormatter.format(new Date(lead.createdAt)),
			hint: relativeTime(lead.createdAt),
			tone: "var(--color-primary)",
		},
		{
			icon: Send,
			label: "Last Email",
			value: lead.lastEmailSentAt
				? dateFormatter.format(new Date(lead.lastEmailSentAt))
				: "Not yet sent",
			hint: lead.lastEmailSentAt
				? relativeTime(lead.lastEmailSentAt)
				: "Sequence pending",
			tone: "var(--color-accent)",
		},
	]

	const handleRetry = () => {
		// biome-ignore lint/suspicious/noExplicitAny: oRPC mutate signature
		;(retry as any)({ leadId })
	}

	return (
		<div className="space-y-6">
			{/* ── Header ── */}
			<div className="space-y-4">
				<Link
					to="/leads"
					className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					<ArrowLeft className="size-3.5" />
					Back to pipeline
				</Link>
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex items-start gap-4 min-w-0">
						<Avatar size="lg" className="shrink-0">
							<AvatarFallback>{initials(lead.fullName)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span
									className="text-[11px] font-semibold uppercase tracking-widest"
									style={{ color: "var(--color-primary)" }}
								>
									Lead Detail
								</span>
								<span
									className="size-1 rounded-full"
									style={{ background: "var(--color-muted-foreground)" }}
								/>
								<span
									className="text-[11px] uppercase tracking-widest font-mono"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{leadId.slice(0, 8)}
								</span>
							</div>
							<h1 className="text-2xl font-bold tracking-tight truncate">
								{lead.fullName}
							</h1>
							<div
								className="flex items-center gap-2 mt-1 text-sm flex-wrap"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<span>{lead.companyName}</span>
								<span
									className="size-1 rounded-full"
									style={{ background: "var(--color-border-strong)" }}
								/>
								<a
									href={lead.companyWebsite}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 hover:underline"
									style={{ color: "var(--color-primary)" }}
								>
									<Globe className="size-3.5" />
									{lead.companyWebsite.replace(/^https?:\/\//, "")}
									<ExternalLink className="size-3 opacity-60" />
								</a>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0 flex-wrap">
						<Badge tone={statusTone} dot>
							{statusLabels[lead.replyStatus] ?? lead.replyStatus}
						</Badge>
						<Badge tone="neutral">{stage.label}</Badge>
						{lead.replyStatus === "research_failed" && (
							<Button
								size="sm"
								variant="outline"
								leadingIcon={
									isRetrying ? (
										<Loader2 className="size-3.5 animate-spin" />
									) : (
										<RotateCcw className="size-3.5" />
									)
								}
								onClick={handleRetry}
								disabled={isRetrying}
							>
								{isRetrying ? "Retrying…" : "Retry Pipeline"}
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							leadingIcon={<Mail className="size-3.5" />}
							onClick={() => {
								window.location.href = `mailto:${lead.email}`
							}}
						>
							Email
						</Button>
					</div>
				</div>
			</div>

			{/* ── Status strip ── */}
			<StatusStrip cells={stripCells} />

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* ── Left: contact + research ── */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Contact Info</CardTitle>
							<p
								className="text-xs mt-1"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Reachable channels & metadata
							</p>
						</CardHeader>
						<CardContent className="space-y-4">
							<ContactRow icon={Mail} label="Email" tone="var(--color-primary)">
								<a
									href={`mailto:${lead.email}`}
									className="break-all hover:underline"
									style={{ color: "var(--color-primary)" }}
								>
									{lead.email}
								</a>
							</ContactRow>
							{lead.linkedinUrl && (
								<ContactRow
									icon={Linkedin}
									label="LinkedIn"
									tone="var(--color-info)"
								>
									<a
										href={lead.linkedinUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 hover:underline break-all"
										style={{ color: "var(--color-info)" }}
									>
										{lead.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
										<ExternalLink className="size-3 opacity-60 shrink-0" />
									</a>
								</ContactRow>
							)}
							{lead.leadSource && (
								<ContactRow
									icon={MapPin}
									label="Source"
									tone="var(--color-accent)"
								>
									<Badge tone="outline" className="font-normal">
										{lead.leadSource}
									</Badge>
								</ContactRow>
							)}
							<ContactRow
								icon={Calendar}
								label="Captured"
								tone="var(--color-warning)"
							>
								<span
									className="tabular-nums"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{dateFormatter.format(new Date(lead.createdAt))}
								</span>
							</ContactRow>
						</CardContent>
					</Card>

					{lead.painPoints && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-3">
									<div
										className="size-9 rounded-lg flex items-center justify-center"
										style={{
											background: softBg("var(--color-warning)"),
											color: "var(--color-warning)",
										}}
									>
										<Sparkles className="size-4" />
									</div>
									<div>
										<CardTitle className="text-base">Pain Points</CardTitle>
										<p
											className="text-xs mt-1"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											Anchors for the AI copy
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed whitespace-pre-wrap">
									{lead.painPoints}
								</p>
							</CardContent>
						</Card>
					)}

					{lead.companyResearch && (
						<Card>
							<CardHeader>
								<div className="flex items-center gap-3">
									<div
										className="size-9 rounded-lg flex items-center justify-center"
										style={{
											background: softBg("var(--color-accent)"),
											color: "var(--color-accent)",
										}}
									>
										<Brain className="size-4" />
									</div>
									<div>
										<CardTitle className="text-base">
											AI Company Analysis
										</CardTitle>
										<p
											className="text-xs mt-1"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											Synthesized from scraped website + LLM
										</p>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div
									className="prose prose-sm max-w-none text-sm leading-relaxed"
									style={
										{
											"--tw-prose-body": "var(--color-muted-foreground)",
											"--tw-prose-headings": "var(--color-foreground)",
											"--tw-prose-links": "var(--color-primary)",
											"--tw-prose-bold": "var(--color-foreground)",
											"--tw-prose-quotes": "var(--color-muted-foreground)",
											"--tw-prose-code": "var(--color-foreground)",
											"--tw-prose-hr": "var(--color-border)",
											"--tw-prose-lists": "var(--color-muted-foreground)",
										} as React.CSSProperties
									}
								>
									<ReactMarkdown remarkPlugins={[remarkBreaks]}>
										{lead.companyResearch}
									</ReactMarkdown>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* ── Right: pipeline + sequence ── */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader className="flex flex-row items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								<div
									className="size-9 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-primary)"),
										color: "var(--color-primary)",
									}}
								>
									<Clock className="size-4" />
								</div>
								<div>
									<CardTitle className="text-base">
										Pipeline Execution
									</CardTitle>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Step-by-step AI run history
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<PipelineStepsTimeline leadId={leadId} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								<div
									className="size-9 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-info)"),
										color: "var(--color-info)",
									}}
								>
									<Mail className="size-4" />
								</div>
								<div>
									<CardTitle className="text-base">Email Sequence</CardTitle>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Outbound + follow-up timeline
									</p>
								</div>
							</div>
							{lead.lastEmailSentAt && (
								<span
									className="text-xs px-2.5 py-1 rounded-full font-medium"
									style={{
										background: softBg("var(--color-success)"),
										color: "var(--color-success)",
									}}
								>
									Last sent {relativeTime(lead.lastEmailSentAt)}
								</span>
							)}
						</CardHeader>
						<CardContent>
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
										background: softBg("var(--color-info)"),
										color: "var(--color-info)",
									}}
								>
									<Mail className="size-4" />
								</div>
								<p className="text-sm font-semibold">Sequence not available</p>
								<p
									className="text-xs max-w-sm"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{lead.lastEmailSentAt
										? "Per-email tracking endpoint isn't wired up yet — check the pipeline timeline for send activity."
										: "AI is still crafting the sequence, or no emails have been sent. Refresh once the pipeline finishes."}
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
