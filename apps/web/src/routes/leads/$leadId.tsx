import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import { ArrowLeft, Mail, ExternalLink, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@kana-consultant/ui-kit"

export const Route = createFileRoute("/leads/$leadId")({
	component: LeadDetailPage,
})

const statusStyles: Record<string, { tone: any; icon: any }> = {
	pending: { tone: "warning", icon: Clock },
	researching: { tone: "info", icon: Clock },
	ready: { tone: "success", icon: CheckCircle2 },
	awaiting: { tone: "info", icon: Clock },
	replied: { tone: "success", icon: CheckCircle2 },
	completed: { tone: "neutral", icon: CheckCircle2 },
	bounced: { tone: "danger", icon: AlertCircle },
	research_failed: { tone: "danger", icon: AlertCircle },
}

function LeadDetailPage() {
	const { leadId } = Route.useParams()

	const { data, isPending, error } = useQuery(
		(orpc as any).lead.getDetail.queryOptions({ input: { id: leadId } }),
	)
	const lead = data as any

	if (isPending) {
		return <div className="p-8 text-center text-slate-500 animate-pulse">Loading lead details...</div>
	}

	if (error || !lead) {
		return (
			<div className="p-8">
				<div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
					Failed to load lead details. Make sure the API server is running.
				</div>
				<Link to="/leads" className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-800">
					← Back to pipeline
				</Link>
			</div>
		)
	}

	const status = statusStyles[lead.replyStatus] ?? statusStyles.pending
	const StatusIcon = status.icon

	return (
		<div className="space-y-6 max-w-5xl mx-auto">
			{/* Header */}
			<div>
				<Link to="/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4 transition-colors">
					<ArrowLeft className="w-4 h-4" />
					Back to pipeline
				</Link>
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold text-slate-900">{lead.fullName}</h1>
						<p className="text-lg text-slate-600 mt-1 flex items-center gap-2">
							{lead.companyName}
							{lead.companyWebsite && (
								<a href={lead.companyWebsite} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm">
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
							)}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<Badge tone={status.tone} className="flex items-center gap-1.5 px-2.5 py-1 text-sm">
							<StatusIcon className="w-3.5 h-3.5" />
							<span className="capitalize">{lead.replyStatus.replace("_", " ")}</span>
						</Badge>
						<Badge tone="neutral" className="px-2.5 py-1 text-sm">
							Stage {lead.stage}
						</Badge>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Details & Research */}
				<div className="lg:col-span-1 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm uppercase tracking-wider text-slate-500">Contact Info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-3 text-sm">
								<Mail className="w-4 h-4 text-slate-400 shrink-0" />
								<a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline break-all">{lead.email}</a>
							</div>
							<div className="flex items-center gap-3 text-sm text-slate-600">
								<Calendar className="w-4 h-4 text-slate-400 shrink-0" />
								Captured on {new Date(lead.createdAt).toLocaleDateString()}
							</div>
						</CardContent>
					</Card>

					{lead.painPoints && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm uppercase tracking-wider text-slate-500">Pain Points</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.painPoints}</p>
							</CardContent>
						</Card>
					)}

					{lead.companyResearch && (
						<Card>
							<CardHeader>
								<CardTitle className="text-sm uppercase tracking-wider text-slate-500">AI Company Analysis</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
									{lead.companyResearch}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right Column: Sequence timeline */}
				<div className="lg:col-span-2">
					<Card className="h-full flex flex-col overflow-hidden">
						<CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-row items-center justify-between">
							<CardTitle>Email Sequence</CardTitle>
							<span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Timeline</span>
						</CardHeader>
						
						<CardContent className="flex-1 bg-slate-50/30 p-6 flex items-center justify-center">
							<div className="text-center text-slate-500">
								<Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
								<p>The AI is currently crafting the sequence or no emails have been sent yet.</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
