import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Progress,
	Separator,
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
	Loader2,
	Mail,
	RotateCcw,
	Send,
	UserCheck,
	XCircle,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
	component: LeadDetailPage,
})

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

/** Map step identifiers to icons and colors */
const stepMeta: Record<string, { icon: typeof CheckCircle2; color: string }> = {
	capture: { icon: UserCheck, color: "var(--color-primary)" },
	scrape: { icon: Globe, color: "var(--color-info)" },
	analyze_website: { icon: Brain, color: "var(--color-accent)" },
	build_profile: { icon: FileText, color: "var(--color-success)" },
	analyze_behavior: { icon: Brain, color: "var(--color-warning)" },
	generate_sequence: { icon: Mail, color: "var(--color-primary)" },
	send_email: { icon: Send, color: "var(--color-success)" },
}

function formatDuration(ms: number | null): string {
	if (!ms) return "—"
	if (ms < 1000) return `${ms}ms`
	return `${(ms / 1000).toFixed(1)}s`
}

function PipelineStepsTimeline({ leadId }: { leadId: string }) {
	const {
		data: steps,
		isPending,
		error,
	} = useQuery(orpc.lead.getPipelineSteps.queryOptions({ input: { leadId } }))

	const pipelineSteps = steps ?? []

	if (isPending) {
		return (
			<div className="space-y-3 p-4">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-14 rounded-lg" />
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div
				className="p-6 text-center text-sm"
				style={{ color: "var(--color-danger)" }}
			>
				Failed to load pipeline steps.
			</div>
		)
	}

	if (pipelineSteps.length === 0) {
		return (
			<div
				className="text-center py-12"
				style={{ color: "var(--color-muted-foreground)" }}
			>
				<Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
				<p className="text-sm">No pipeline steps recorded yet.</p>
				<p className="text-xs mt-1 opacity-60">
					Steps will appear here when the pipeline runs.
				</p>
			</div>
		)
	}

	const totalSteps = 7
	const completedSteps = pipelineSteps.filter(
		(s: any) => s.status === "completed",
	).length

	return (
		<div className="relative">
			<Progress
				value={(completedSteps / totalSteps) * 100}
				tone="primary"
				className="mb-4 mx-2"
			/>
			{/* Vertical timeline line */}
			<div
				className="absolute left-[19px] top-4 bottom-4 w-px"
				style={{ background: "var(--color-border)" }}
			/>

			<div className="space-y-1">
				{pipelineSteps.map((step: any, idx: number) => {
					const meta = stepMeta[step.step] ?? {
						icon: CheckCircle2,
						color: "var(--color-muted-foreground)",
					}
					const StepIcon = meta.icon
					const isFailed = step.status === "failed"
					const isRunning = step.status === "running"

					const StatusIcon = isFailed
						? XCircle
						: isRunning
							? Loader2
							: CheckCircle2

					const statusColor = isFailed
						? "var(--color-danger)"
						: isRunning
							? "var(--color-warning)"
							: "var(--color-success)"

					const detail = step.detail as Record<string, string> | null

					return (
						<div
							key={step.id ?? idx}
							className="relative flex items-start gap-3 px-2 py-2.5 group"
						>
							{/* Timeline dot */}
							<div
								className="relative z-10 flex items-center justify-center w-[22px] h-[22px] rounded-full shrink-0 mt-0.5"
								style={{
									background: `color-mix(in srgb, ${statusColor} 20%, transparent)`,
									border: `2px solid ${statusColor}`,
								}}
							>
								<StatusIcon
									className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`}
									style={{ color: statusColor }}
								/>
							</div>

							{/* Content */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 min-w-0">
										<StepIcon
											className="w-3.5 h-3.5 shrink-0"
											style={{ color: meta.color }}
										/>
										<span className="text-sm font-medium truncate">
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
												isFailed ? "danger" : isRunning ? "warning" : "success"
											}
											className="text-[10px] px-1.5 py-0"
										>
											{step.status}
										</Badge>
									</div>
								</div>

								{/* Detail info */}
								{detail && (
									<div className="mt-1 space-y-0.5">
										{detail.error && (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs truncate cursor-help"
															style={{ color: "var(--color-danger)" }}
														>
															Error: {detail.error as string}
														</p>
													</TooltipTrigger>
													<TooltipContent>
														{detail.error as string}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
										{detail.provider && (
											<p
												className="text-xs"
												style={{ color: "var(--color-muted-foreground)" }}
											>
												Provider:{" "}
												<span className="font-medium">
													{detail.provider as string}
												</span>
												{detail.model && (
													<>
														{" · "}Model:{" "}
														<span className="font-mono">
															{detail.model as string}
														</span>
													</>
												)}
											</p>
										)}
										{detail.apiUrl && (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs font-mono truncate opacity-60 cursor-help"
															style={{ color: "var(--color-muted-foreground)" }}
														>
															→ {detail.apiUrl as string}
														</p>
													</TooltipTrigger>
													<TooltipContent>
														{detail.apiUrl as string}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
										{detail.url && !detail.apiUrl && (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<p
															className="text-xs font-mono truncate opacity-60 cursor-help"
															style={{ color: "var(--color-muted-foreground)" }}
														>
															→ {detail.url as string}
														</p>
													</TooltipTrigger>
													<TooltipContent>
														{detail.url as string}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										)}
									</div>
								)}

								{/* Timestamp */}
								<p
									className="text-[10px] mt-1 opacity-50 tabular-nums"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									{new Date(step.startedAt as string).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})}
								</p>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

function LeadDetailPage() {
	const { leadId } = Route.useParams()

	const { data, isPending, error } = useQuery(
		orpc.lead.getDetail.queryOptions({ input: { id: leadId } }),
	)
	const lead = data
	const queryClient = useQueryClient()

	const { mutate: retry, isPending: isRetrying } = useMutation(
		(orpc.lead.retry as any).mutationOptions({
			onSuccess: () => {
				alert("Pipeline restarted")
				queryClient.invalidateQueries()
			},
			onError: (err: any) => {
				alert(err.message || "Failed to restart pipeline")
			},
		}),
	)

	if (isPending) {
		return (
			<div className="space-y-6 max-w-5xl mx-auto">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-64 rounded-xl" />
			</div>
		)
	}

	if (error || !lead) {
		return (
			<div className="max-w-5xl mx-auto space-y-4">
				<Card>
					<CardContent className="p-4" style={{ color: "var(--color-danger)" }}>
						Failed to load lead details. Make sure the API server is running.
					</CardContent>
				</Card>
				<Link to="/leads">
					<Button
						variant="ghost"
						leadingIcon={<ArrowLeft className="w-4 h-4" />}
					>
						Back to pipeline
					</Button>
				</Link>
			</div>
		)
	}

	const statusTone = statusTones[lead.replyStatus as string] ?? "neutral"

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			{/* Header */}
			<div>
				<Link to="/leads">
					<Button
						variant="ghost"
						size="sm"
						leadingIcon={<ArrowLeft className="w-4 h-4" />}
						className="mb-4"
					>
						Back to pipeline
					</Button>
				</Link>
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold">{lead.fullName as string}</h1>
						<p
							className="text-lg mt-1 flex items-center gap-2"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{lead.companyName as string}
							{lead.companyWebsite && (
								<a
									href={lead.companyWebsite as string}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1 text-sm"
									style={{ color: "var(--color-primary)" }}
								>
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
							)}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Badge tone={statusTone} className="capitalize">
							{(lead.replyStatus as string).replace("_", " ")}
						</Badge>
						<Badge tone="neutral">Stage {lead.stage as number}</Badge>
						{lead.replyStatus === "research_failed" && (
							<Button
								size="sm"
								variant="soft"
								leadingIcon={<RotateCcw className="w-3.5 h-3.5" />}
								onClick={() => (retry as any)({ leadId })}
								loading={isRetrying}
							>
								Retry Pipeline
							</Button>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Details & Research */}
				<div className="lg:col-span-1 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm uppercase tracking-wider">
								Contact Info
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-3 text-sm">
								<Mail
									className="w-4 h-4 shrink-0"
									style={{ color: "var(--color-muted-foreground)" }}
								/>
								<a
									href={`mailto:${lead.email}`}
									className="break-all"
									style={{ color: "var(--color-primary)" }}
								>
									{lead.email as string}
								</a>
							</div>
							<div
								className="flex items-center gap-3 text-sm"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<Calendar className="w-4 h-4 shrink-0" />
								Captured on {new Date(lead.createdAt).toLocaleDateString()}
							</div>
						</CardContent>
					</Card>

					{(lead.painPoints as string) && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm uppercase tracking-wider">
									Pain Points
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm leading-relaxed whitespace-pre-wrap">
									{lead.painPoints as string}
								</p>
							</CardContent>
						</Card>
					)}

					{(lead.companyResearch as string) && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm uppercase tracking-wider">
									AI Company Analysis
								</CardTitle>
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
										{lead.companyResearch as string}
									</ReactMarkdown>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right Column: Pipeline Steps + Sequence */}
				<div className="lg:col-span-2 space-y-6">
					{/* Pipeline Execution Steps */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Clock className="w-4 h-4" />
								Pipeline Execution
							</CardTitle>
							<span
								className="text-xs font-medium uppercase tracking-wider"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Step-by-Step
							</span>
						</CardHeader>
						<Separator />
						<CardContent className="p-2">
							<PipelineStepsTimeline leadId={leadId} />
						</CardContent>
					</Card>

					{/* Email Sequence */}
					<Card className="flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Email Sequence</CardTitle>
							<span
								className="text-xs font-medium uppercase tracking-wider"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Timeline
							</span>
						</CardHeader>

						<Separator />

						<CardContent className="flex-1">
							<div
								className="text-center py-12"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								<Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
								<p>
									The AI is currently crafting the sequence or no emails have
									been sent yet.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
