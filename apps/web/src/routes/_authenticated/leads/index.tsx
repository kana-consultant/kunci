import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Skeleton,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Plus, Users } from "lucide-react"
import { orpc } from "~/libs/orpc/client"

import { columns, type Lead } from "./-columns"
import { DataTable } from "./-data-table"

export const Route = createFileRoute("/_authenticated/leads/")({
	component: LeadsPage,
})

function LeadsPage() {
	const query = useQuery(
		orpc.lead.list.queryOptions({ input: { page: 1, limit: 50 } }),
	)

	const data = (query.data ?? { leads: [], total: 0 }) as {
		leads: Lead[]
		total: number
	}
	const leads = data.leads

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Leads Pipeline</h1>
					<p
						className="text-sm mt-1"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Track every prospect through research, outbound emails, replies, and
						follow-up status.
					</p>
				</div>
			</div>

			<div
				className="grid grid-cols-3 gap-px rounded-xl overflow-hidden"
				style={{ background: "var(--color-border)" }}
			>
				{[
					{
						label: "Total Leads",
						value: data.total,
						color: "var(--color-foreground)",
					},
					{
						label: "Awaiting Reply",
						value: leads.filter((l) => l.replyStatus === "awaiting").length,
						color: "var(--color-primary)",
					},
					{
						label: "Replied",
						value: leads.filter((l) => l.replyStatus === "replied").length,
						color: "var(--color-success)",
					},
				].map((s) => (
					<div
						key={s.label}
						className="flex flex-col gap-0.5 px-5 py-4"
						style={{ background: "var(--color-background)" }}
					>
						<span
							className="text-2xl font-bold tabular-nums"
							style={{ color: s.color }}
						>
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

			<Card className="overflow-hidden">
				<CardHeader className="pb-2">
					<CardTitle className="text-base">Pipeline Records</CardTitle>
					<p
						className="text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Search, filter, and open a lead to inspect pipeline steps.
					</p>
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
								background: "var(--color-danger-muted, transparent)",
							}}
							role="alert"
						>
							Failed to load leads. Make sure the API server is running.
						</div>
					) : leads.length === 0 ? (
						<div
							className="m-5 flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center"
							style={{ borderColor: "var(--color-border)" }}
						>
							<div
								className="mb-4 flex size-12 items-center justify-center rounded-xl"
								style={{
									background: "var(--color-primary-muted)",
									color: "var(--color-primary)",
								}}
							>
								<Users className="size-6" />
							</div>
							<h2 className="font-semibold">No leads found in the pipeline.</h2>
							<p
								className="mt-2 max-w-md text-sm"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Add a lead to start research, personalization, and outbound
								email sequencing.
							</p>
							<Button asChild className="mt-5">
								<Link to="/capture">
									<Plus className="size-4" />
									Capture your first lead
								</Link>
							</Button>
						</div>
					) : (
						<DataTable columns={columns} data={leads} />
					)}
				</CardContent>
			</Card>
		</div>
	)
}
