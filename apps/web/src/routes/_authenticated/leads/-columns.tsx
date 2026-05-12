import {
	Avatar,
	AvatarFallback,
	Badge,
	DataTableColumnHeader,
} from "@kana-consultant/ui-kit"
import { Link } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLink, Globe } from "lucide-react"

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

function initials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("")
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
					className="flex items-center gap-3 min-w-52 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<Avatar size="sm" className="shrink-0">
						<AvatarFallback>{initials(lead.fullName) || "L"}</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="font-medium truncate">{lead.fullName}</p>
						<p
							className="text-xs truncate"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{lead.email}
						</p>
					</div>
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
					<p className="font-medium truncate">{lead.companyName}</p>
					<a
						href={lead.companyWebsite}
						target="_blank"
						rel="noreferrer"
						className="relative z-10 inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
						style={{ color: "var(--color-primary)" }}
						onClick={(e) => e.stopPropagation()}
					>
						<Globe className="size-3" />
						{lead.companyWebsite?.replace(/^https?:\/\//, "")}
						<ExternalLink className="size-3 opacity-60" />
					</a>
				</div>
			)
		},
	},
	{
		accessorKey: "leadSource",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Source" />
		),
		cell: ({ row }) => {
			const source = row.original.leadSource
			if (!source)
				return (
					<span
						className="text-xs"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						—
					</span>
				)
			return (
				<Badge tone="outline" className="font-normal">
					{source}
				</Badge>
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
			return (
				<Badge tone={stage.tone} dot>
					{stage.text}
				</Badge>
			)
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
				<Badge tone={statusTone} dot>
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
				<span
					className="whitespace-nowrap tabular-nums text-xs"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					{dateFormatter.format(new Date(row.getValue("createdAt")))}
				</span>
			)
		},
	},
]
