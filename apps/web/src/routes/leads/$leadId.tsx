import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "~/libs/orpc/client"
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Badge,
	Button,
	Skeleton,
	Separator,
} from "@kana-consultant/ui-kit"
import {
	ArrowLeft,
	Mail,
	ExternalLink,
	Calendar,
} from "lucide-react"

export const Route = createFileRoute("/leads/$leadId")({
	component: LeadDetailPage,
})

const statusTones: Record<string, "neutral" | "primary" | "success" | "warning" | "danger" | "info"> = {
	pending: "warning",
	researching: "info",
	ready: "success",
	awaiting: "primary",
	replied: "success",
	completed: "neutral",
	bounced: "danger",
	research_failed: "warning",
}

function LeadDetailPage() {
	const { leadId } = Route.useParams()

	const { data, isPending, error } = useQuery(
		orpc.lead.getDetail.queryOptions({ input: { id: leadId } }),
	)
	const lead = (data ?? {}) as any

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
					<CardContent className="p-4 text-[var(--color-danger)]">
						Failed to load lead details. Make sure the API server is running.
					</CardContent>
				</Card>
				<Link to="/leads">
					<Button variant="ghost" leadingIcon={<ArrowLeft className="w-4 h-4" />}>
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
						<h1 className="text-3xl font-bold">
							{lead.fullName as string}
						</h1>
						<p className="text-lg text-[var(--color-muted)] mt-1 flex items-center gap-2">
							{lead.companyName as string}
							{lead.companyWebsite && (
								<a
									href={lead.companyWebsite as string}
									target="_blank"
									rel="noreferrer"
									className="text-[var(--color-primary)] inline-flex items-center gap-1 text-sm"
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
								<Mail className="w-4 h-4 text-[var(--color-muted)] shrink-0" />
								<a
									href={`mailto:${lead.email}`}
									className="text-[var(--color-primary)] break-all"
								>
									{lead.email as string}
								</a>
							</div>
							<div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
								<Calendar className="w-4 h-4 shrink-0" />
								Captured on{" "}
								{new Date(lead.createdAt as string).toLocaleDateString()}
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
								<div className="prose prose-sm max-w-none text-sm leading-relaxed">
									{lead.companyResearch as string}
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right Column: Sequence timeline */}
				<div className="lg:col-span-2">
					<Card className="h-full flex flex-col">
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Email Sequence</CardTitle>
							<span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
								Timeline
							</span>
						</CardHeader>

						<Separator />

						<CardContent className="flex-1">
							<div className="text-center py-12 text-[var(--color-muted)]">
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
