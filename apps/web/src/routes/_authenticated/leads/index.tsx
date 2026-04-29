import {
	Badge,
	Button,
	Card,
	CardContent,
	Skeleton,
} from "@kana-consultant/ui-kit"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { UserPlus } from "lucide-react"
import { orpc } from "~/libs/orpc/client"

export const Route = createFileRoute("/_authenticated/leads/")({
	component: LeadsPage,
})

const stageLabels: Record<
	number,
	{ text: string; tone: "neutral" | "primary" | "accent" | "info" }
> = {
	0: { text: "Captured", tone: "neutral" },
	1: { text: "1st Email Sent", tone: "primary" },
	2: { text: "Follow-up 1", tone: "info" },
	3: { text: "Follow-up 2", tone: "accent" },
}

const statusTones: Record<
	string,
	"neutral" | "primary" | "accent" | "success" | "warning" | "danger" | "info"
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

function LeadsPage() {
	const query = useQuery(
		orpc.lead.list.queryOptions({ input: { page: 1, limit: 50 } }),
	)
	const navigate = useNavigate()

	const data = (query.data ?? {}) as any
	const leads = (data.leads ?? []) as any[]

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Leads Pipeline</h1>
					<p className="text-sm text-[var(--color-muted-foreground)] mt-1">
						{(data.total as number) ?? 0} leads total
					</p>
				</div>
				<Link to="/capture">
					<Button leadingIcon={<UserPlus className="w-4 h-4" />}>
						Add Lead
					</Button>
				</Link>
			</div>

			<Card>
				<CardContent className="p-0">
					{query.isPending ? (
						<div className="p-12 space-y-4">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12 rounded-lg" />
							))}
						</div>
					) : query.error ? (
						<div className="p-12 text-center text-[var(--color-danger)]">
							Failed to load leads. Make sure the API server is running.
						</div>
					) : leads.length === 0 ? (
						<div className="p-12 text-center text-[var(--color-muted-foreground)]">
							<p className="mb-3">No leads found in the pipeline.</p>
							<Link
								to="/capture"
								className="text-[var(--color-primary)] font-medium"
							>
								Capture your first lead →
							</Link>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-[var(--color-border)]">
								<thead className="bg-[var(--color-surface-alt)]">
									<tr>
										<th
											scope="col"
											className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
										>
											Lead
										</th>
										<th
											scope="col"
											className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
										>
											Company
										</th>
										<th
											scope="col"
											className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
										>
											Stage
										</th>
										<th
											scope="col"
											className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
										>
											Status
										</th>
										<th
											scope="col"
											className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]"
										>
											Date
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[var(--color-border)]">
									{leads.map((lead) => {
										const stage = stageLabels[lead.stage as number] ?? {
											text: `Stage ${lead.stage}`,
											tone: "neutral" as const,
										}
										const statusTone =
											statusTones[lead.replyStatus as string] ?? "neutral"
										return (
											<tr
												key={lead.id as string}
												className="hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
												onClick={() =>
													navigate({
														to: "/leads/$leadId",
														params: { leadId: lead.id as string },
													})
												}
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<Link
														to="/leads/$leadId"
														params={{ leadId: lead.id as string }}
														className="flex flex-col"
													>
														<span className="text-sm font-medium">
															{lead.fullName as string}
														</span>
														<span className="text-sm text-[var(--color-muted-foreground)]">
															{lead.email as string}
														</span>
													</Link>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="text-sm">
														{lead.companyName as string}
													</div>
													<a
														href={lead.companyWebsite as string}
														target="_blank"
														rel="noreferrer"
														className="text-xs text-[var(--color-primary)] relative z-10"
														onClick={(e) => e.stopPropagation()}
													>
														{(lead.companyWebsite as string)?.replace(
															/^https?:\/\//,
															"",
														)}
													</a>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<Badge tone={stage.tone}>{stage.text}</Badge>
												</td>
												<td className="px-6 py-4 whitespace-nowrap">
													<Badge tone={statusTone} className="capitalize">
														{lead.replyStatus as string}
													</Badge>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-muted-foreground)]">
													{new Date(
														lead.createdAt as string,
													).toLocaleDateString()}
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
