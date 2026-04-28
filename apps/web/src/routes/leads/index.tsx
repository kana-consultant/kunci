import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import { UserPlus } from "lucide-react"
import { Card, Badge, Button } from "@kana-consultant/ui-kit"

export const Route = createFileRoute("/leads/")({
	component: LeadsPage,
})

const stageLabels: Record<number, { text: string; tone: any }> = {
	0: { text: "Captured", tone: "neutral" },
	1: { text: "1st Email Sent", tone: "primary" },
	2: { text: "Follow-up 1", tone: "info" },
	3: { text: "Follow-up 2", tone: "warning" },
}

const statusTones: Record<string, any> = {
	pending: "warning",
	researching: "info",
	ready: "success",
	awaiting: "info",
	replied: "success",
	completed: "neutral",
	bounced: "danger",
	research_failed: "danger",
}

function LeadsPage() {
	const query = useQuery(
		(orpc as any).lead.list.queryOptions({ input: { page: 1, limit: 50 } }),
	)

	const data = (query.data as any) ?? {}
	const leads = data.leads ?? []

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-slate-900">Leads Pipeline</h1>
					<p className="text-sm text-slate-500 mt-1">{data.total ?? 0} leads total</p>
				</div>
				<Link to="/capture">
					<Button className="gap-2">
						<UserPlus className="w-4 h-4" />
						Add Lead
					</Button>
				</Link>
			</div>

			<Card className="overflow-hidden">
				{query.isPending ? (
					<div className="p-12 text-center text-slate-500">Loading pipeline...</div>
				) : query.error ? (
					<div className="p-12 text-center text-red-500">
						Failed to load leads. Make sure the API server is running.
					</div>
				) : leads.length === 0 ? (
					<div className="p-12 text-center text-slate-500">
						<p className="mb-3">No leads found in the pipeline.</p>
						<Link to="/capture" className="text-blue-600 font-medium hover:text-blue-800">
							Capture your first lead →
						</Link>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50/80">
								<tr>
									<th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Lead
									</th>
									<th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Company
									</th>
									<th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Stage
									</th>
									<th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Status
									</th>
									<th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
										Date
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{leads.map((lead: any) => {
									const stage = stageLabels[lead.stage] ?? { text: `Stage ${lead.stage}`, tone: "neutral" }
									const tone = statusTones[lead.replyStatus] ?? "neutral"
									return (
										<tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex flex-col">
													<Link to={`/leads/${lead.id}`} className="text-sm font-medium text-slate-900 hover:text-blue-600">
														{lead.fullName}
													</Link>
													<span className="text-sm text-slate-500">{lead.email}</span>
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm text-slate-900">{lead.companyName}</div>
												{lead.companyWebsite && (
													<a
														href={lead.companyWebsite}
														target="_blank"
														rel="noreferrer"
														className="text-xs text-blue-600 hover:underline"
													>
														{lead.companyWebsite.replace(/^https?:\/\//, "")}
													</a>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge tone={stage.tone}>{stage.text}</Badge>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<Badge tone={tone} className="capitalize">
													{lead.replyStatus.replace("_", " ")}
												</Badge>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
												{new Date(lead.createdAt).toLocaleDateString()}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	)
}
