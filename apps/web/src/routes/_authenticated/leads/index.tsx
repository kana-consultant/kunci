import {
	Button,
	Card,
	CardContent,
	CardDescription,
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
		<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
			<div className="flex flex-col gap-2">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Leads Pipeline</h1>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						Track every prospect through research, outbound emails, replies, and
						follow-up status.
					</p>
				</div>
			</div>

			<Card className="overflow-hidden">
				<CardHeader className="border-b border-border bg-surface-muted/40">
					<CardTitle>Pipeline Records</CardTitle>
					<CardDescription>
						Search, filter, and open a lead to inspect pipeline steps.
					</CardDescription>
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
							className="m-5 rounded-lg border border-danger/30 bg-danger/10 p-6 text-sm text-danger"
							role="alert"
						>
							Failed to load leads. Make sure the API server is running.
						</div>
					) : leads.length === 0 ? (
						<div className="m-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/30 p-10 text-center">
							<div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
								<Users className="size-6" />
							</div>
							<h2 className="font-semibold">No leads found in the pipeline.</h2>
							<p className="mt-2 max-w-md text-sm text-muted-foreground">
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
