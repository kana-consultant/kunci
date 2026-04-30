import { Badge, DataTableColumnHeader } from "@kana-consultant/ui-kit"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"

export type Lead = {
	id: string
	fullName: string
	email: string
	companyName: string
	companyWebsite: string
	stage: number
	replyStatus: string
	createdAt: string
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
					className="flex flex-col"
				>
					<span className="font-medium">{lead.fullName}</span>
					<span className="text-[var(--color-muted-foreground)]">
						{lead.email}
					</span>
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
				<>
					<div className="font-medium">{lead.companyName}</div>
					<a
						href={lead.companyWebsite}
						target="_blank"
						rel="noreferrer"
						className="text-[var(--color-primary)] relative z-10"
						onClick={(e) => e.stopPropagation()}
					>
						{lead.companyWebsite?.replace(/^https?:\/\//, "")}
					</a>
				</>
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
			const statusTone =
				statusTones[row.getValue("replyStatus") as string] ?? "neutral"
			return (
				<Badge tone={statusTone} className="capitalize">
					{row.getValue("replyStatus") as string}
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
				<span className="text-[var(--color-muted-foreground)]">
					{new Date(row.getValue("createdAt")).toLocaleDateString()}
				</span>
			)
		},
	},
]
