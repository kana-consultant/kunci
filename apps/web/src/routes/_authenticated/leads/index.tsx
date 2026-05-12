import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
	CheckCircle2,
	FileSpreadsheet,
	type LucideIcon,
	Mail,
	MailCheck,
	Plus,
	Send,
	Sparkles,
	UserPlus,
	Users,
} from "lucide-react"
import { orpc } from "~/libs/orpc/client"

import { columns, type Lead } from "./-columns"
import { DataTable } from "./-data-table"

export const Route = createFileRoute("/_authenticated/leads/")({
	component: LeadsPage,
})

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

type Metric = {
	label: string
	value: number
	icon: LucideIcon
	tone: string
	hint: string
}

function SummaryStrip({ metrics }: { metrics: Metric[] }) {
	return (
		<div
			className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 rounded-2xl border overflow-hidden"
			style={{
				borderColor: "var(--color-border)",
				background: "var(--color-surface)",
			}}
		>
			{metrics.map((m, i) => {
				const Icon = m.icon
				return (
					<div
						key={m.label}
						className="flex items-start gap-3 p-4"
						style={{
							borderLeft: i > 0 ? "1px solid var(--color-border)" : undefined,
						}}
					>
						<div
							className="rounded-lg p-2 shrink-0"
							style={{ background: softBg(m.tone), color: m.tone }}
						>
							<Icon className="size-4" />
						</div>
						<div className="flex-1 min-w-0 space-y-1">
							<p
								className="text-[11px] font-semibold uppercase tracking-wider"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{m.label}
							</p>
							<p className="text-2xl font-bold tabular-nums leading-none">
								{m.value}
							</p>
							<p
								className="text-xs truncate"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								{m.hint}
							</p>
						</div>
					</div>
				)
			})}
		</div>
	)
}

function EmptyState({
	onCapture,
	onBulk,
}: {
	onCapture: () => void
	onBulk: () => void
}) {
	const stages = [
		{ label: "Captured", icon: UserPlus, tone: "var(--color-primary)" },
		{ label: "Researched", icon: Sparkles, tone: "var(--color-accent)" },
		{ label: "Sequenced", icon: Send, tone: "var(--color-info)" },
		{ label: "Replied", icon: CheckCircle2, tone: "var(--color-success)" },
	]
	return (
		<div
			className="m-5 grid grid-cols-1 lg:grid-cols-5 gap-6 rounded-2xl border border-dashed p-6"
			style={{
				borderColor: "var(--color-border)",
				background: "var(--color-surface-muted)",
			}}
		>
			<div className="lg:col-span-3 flex flex-col gap-4">
				<div
					className="size-12 rounded-xl flex items-center justify-center"
					style={{
						background: softBg("var(--color-primary)"),
						color: "var(--color-primary)",
					}}
				>
					<Users className="size-5" />
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold tracking-tight">
						No leads in the pipeline yet
					</h2>
					<p
						className="text-sm max-w-md"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Capture your first prospect and KUNCI's AI will research the
						company, analyze behavior, and send a personalized outbound sequence
						automatically.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button onClick={onCapture} leadingIcon={<Plus className="size-4" />}>
						Capture your first lead
					</Button>
					<Button
						variant="outline"
						onClick={onBulk}
						leadingIcon={<FileSpreadsheet className="size-4" />}
					>
						Bulk import CSV
					</Button>
				</div>
			</div>
			<div className="lg:col-span-2 flex flex-col gap-2">
				<p
					className="text-[11px] font-semibold uppercase tracking-wider"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					What the pipeline looks like
				</p>
				<ol className="space-y-2">
					{stages.map((s, i) => {
						const Icon = s.icon
						return (
							<li
								key={s.label}
								className="flex items-center gap-3 rounded-xl p-2.5"
								style={{
									background: "var(--color-surface)",
									border: "1px solid var(--color-border)",
								}}
							>
								<div
									className="size-8 rounded-lg flex items-center justify-center shrink-0"
									style={{ background: softBg(s.tone), color: s.tone }}
								>
									<Icon className="size-4" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium leading-none">{s.label}</p>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Stage {i + 1}
									</p>
								</div>
								<span
									className="text-xs font-semibold tabular-nums"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									—
								</span>
							</li>
						)
					})}
				</ol>
			</div>
		</div>
	)
}

function LeadsPage() {
	const navigate = useNavigate()
	const query = useQuery(
		orpc.lead.list.queryOptions({ input: { page: 1, limit: 50 } }),
	)

	const data = (query.data ?? { leads: [], total: 0 }) as {
		leads: Lead[]
		total: number
	}
	const leads = data.leads

	const captured = leads.filter((l) => l.stage === 0).length
	const inSequence = leads.filter((l) => l.stage >= 1).length
	const awaiting = leads.filter((l) => l.replyStatus === "awaiting").length
	const replied = leads.filter((l) => l.replyStatus === "replied").length

	const metrics: Metric[] = [
		{
			label: "Total Leads",
			value: data.total,
			icon: Users,
			tone: "var(--color-primary)",
			hint: "All time captured",
		},
		{
			label: "Captured",
			value: captured,
			icon: UserPlus,
			tone: "var(--color-accent)",
			hint: "Ready for sequencing",
		},
		{
			label: "In Sequence",
			value: inSequence,
			icon: Send,
			tone: "var(--color-info)",
			hint: "Receiving emails",
		},
		{
			label: "Awaiting",
			value: awaiting,
			icon: Mail,
			tone: "var(--color-warning)",
			hint: "Pending reply",
		},
		{
			label: "Replied",
			value: replied,
			icon: MailCheck,
			tone: "var(--color-success)",
			hint: "Engaged prospects",
		},
	]

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
							Pipeline
						</span>
						<span
							className="size-1 rounded-full"
							style={{ background: "var(--color-muted-foreground)" }}
						/>
						<span
							className="text-[11px] uppercase tracking-widest"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{data.total} lead{data.total === 1 ? "" : "s"}
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-tight">Leads Pipeline</h1>
					<p
						className="text-sm"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Track every prospect through research, outbound emails, replies, and
						follow-up status.
					</p>
				</div>
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

			{/* ── Summary strip ── */}
			{query.isPending ? (
				<Skeleton className="h-24 rounded-2xl" />
			) : (
				<SummaryStrip metrics={metrics} />
			)}

			{/* ── Records ── */}
			<Card className="overflow-hidden">
				<CardHeader className="flex flex-row items-start justify-between gap-3">
					<div>
						<CardTitle className="text-base">Pipeline Records</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Search, filter, and open a lead to inspect pipeline steps.
						</p>
					</div>
					{leads.length > 0 && (
						<span
							className="text-xs px-2.5 py-1 rounded-full font-medium tabular-nums"
							style={{
								background: softBg("var(--color-primary)"),
								color: "var(--color-primary)",
							}}
						>
							{leads.length} showing
						</span>
					)}
				</CardHeader>
				<CardContent className="p-0">
					{query.isPending ? (
						<div className="space-y-3 p-5">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12 rounded-lg" />
							))}
						</div>
					) : query.error ? (
						<div
							className="m-5 rounded-xl border p-5 text-sm"
							style={{
								borderColor: "var(--color-danger)",
								color: "var(--color-danger)",
								background: softBg("var(--color-danger)"),
							}}
							role="alert"
						>
							Failed to load leads. Make sure the API server is running.
						</div>
					) : leads.length === 0 ? (
						<EmptyState
							onCapture={() => navigate({ to: "/capture" })}
							onBulk={() => navigate({ to: "/bulk-capture" })}
						/>
					) : (
						<DataTable columns={columns} data={leads} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
