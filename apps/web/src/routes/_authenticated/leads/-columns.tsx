import { Badge, DataTableColumnHeader } from "@kana-consultant/ui-kit"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

export type Lead = {
	id: string
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	leadSource?: string | null
	stage: number
	replyStatus: string
	createdAt: Date | string
}

export const stageLabels: Record<
	number,
	{ text: string; tone: "neutral" | "primary" | "accent" | "info" }
> = {
	0: { text: "Captured", tone: "neutral" },
	1: { text: "1st Email Sent", tone: "primary" },
	2: { text: "Follow-up 1", tone: "info" },
	3: { text: "Follow-up 2", tone: "accent" },
}

export const statusTones: Record<
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

export const statusLabels: Record<string, string> = {
	pending: "Pending",
	researching: "Researching",
	ready: "Ready",
	awaiting: "Awaiting reply",
	replied: "Replied",
	completed: "Completed",
	bounced: "Bounced",
	research_failed: "Research failed",
}

const dateFormatter = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
	year: "numeric",
})

export const columns: ColumnDef<Lead>[] = [
	{
		accessorKey: "fullName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Lead" />
		),
		cell: ({ row }) => {
			const lead = row.original
			return (
				<Link
					to="/leads/$leadId"
					params={{ leadId: lead.id }}
					className="flex min-w-48 flex-col gap-0.5 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<span className="font-medium">{lead.fullName}</span>
					<span className="text-muted-foreground">{lead.email}</span>
				</Link>
			)
		},
	},
	{
		accessorKey: "companyName",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Company" />
		),
		cell: ({ row }) => {
			const lead = row.original
			return (
				<div className="min-w-56">
					<div className="font-medium">{lead.companyName}</div>
					<div className="flex flex-col gap-0.5">
						<a
							href={lead.companyWebsite}
							target="_blank"
							rel="noreferrer"
							className="relative z-10 text-sm text-primary underline-offset-4 hover:underline"
							onClick={(e) => e.stopPropagation()}
						>
							{lead.companyWebsite?.replace(/^https?:\/\//, "")}
						</a>
						{lead.leadSource && (
							<span className="text-xs text-muted-foreground">
								Source: {lead.leadSource}
							</span>
						)}
					</div>
				</div>
			)
		},
	},
	{
		accessorKey: "stage",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Stage" />
		),
		cell: ({ row }) => {
			const stage = stageLabels[row.getValue("stage") as number] ?? {
				text: `Stage ${row.getValue("stage")}`,
				tone: "neutral" as const,
			}
			return <Badge tone={stage.tone}>{stage.text}</Badge>
		},
	},
	{
		accessorKey: "replyStatus",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("replyStatus") as string
			const statusTone = statusTones[status] ?? "neutral"
			return (
				<Badge tone={statusTone}>
					{statusLabels[status] ?? status.replaceAll("_", " ")}
				</Badge>
			)
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date" />
		),
		cell: ({ row }) => {
			return (
				<span className="whitespace-nowrap text-muted-foreground">
					{dateFormatter.format(new Date(row.getValue("createdAt")))}
				</span>
			)
		},
	},
]
