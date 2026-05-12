import {
	Badge,
	Button,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
	Separator,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
} from "@kana-consultant/ui-kit"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Copy,
	Download,
	FileSpreadsheet,
	type LucideIcon,
	Loader2,
	Trash2,
	Upload,
	Users,
	XCircle,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { useBulkCaptureLogic } from "./_hooks/-use-bulk-capture"

export const Route = createFileRoute("/_authenticated/bulk-capture")({
	component: BulkCapturePage,
})

const CSV_TEMPLATE = `fullName,email,companyName,companyWebsite,painPoints,linkedinUrl
John Doe,john@acme.com,Acme Corp,https://acme.com,Slow lead response times,https://linkedin.com/in/johndoe
Jane Smith,jane@globex.com,Globex Corp,https://globex.com,Poor email deliverability,`

function softBg(token: string) {
	return `color-mix(in oklab, ${token} 14%, transparent)`
}

type ResultMetric = {
	label: string
	value: number
	tone: string
	icon: LucideIcon
	hint: string
}

function ResultSummary({ metrics }: { metrics: ResultMetric[] }) {
	return (
		<div
			className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl border overflow-hidden"
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
							<p
								className="text-2xl font-bold tabular-nums leading-none"
								style={{ color: m.tone }}
							>
								{m.value}
							</p>
							<p
								className="text-xs"
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

function RequirementsPanel({
	onDownload,
	onCopy,
	copied,
}: {
	onDownload: () => void
	onCopy: () => void
	copied: boolean
}) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div
						className="size-9 rounded-lg flex items-center justify-center"
						style={{
							background: softBg("var(--color-primary)"),
							color: "var(--color-primary)",
						}}
					>
						<FileSpreadsheet className="size-4" />
					</div>
					<div>
						<CardTitle className="text-base">CSV Format</CardTitle>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Required columns & sample
						</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<ul className="space-y-2 text-xs">
					{[
						{ key: "fullName", required: true, hint: "Lead's full name" },
						{
							key: "email",
							required: true,
							hint: "Valid email used for outbound",
						},
						{ key: "companyName", required: true, hint: "Org name" },
						{
							key: "companyWebsite",
							required: true,
							hint: "Scraped for AI research",
						},
						{ key: "painPoints", required: false, hint: "Sharpens AI copy" },
						{
							key: "linkedinUrl",
							required: false,
							hint: "Person-level enrichment",
						},
					].map((c) => (
						<li
							key={c.key}
							className="flex items-start justify-between gap-3"
						>
							<div className="flex items-start gap-2 min-w-0">
								<span
									className="size-1.5 rounded-full mt-1.5 shrink-0"
									style={{
										background: c.required
											? "var(--color-primary)"
											: "var(--color-muted-foreground)",
									}}
								/>
								<div className="min-w-0">
									<p className="font-mono text-xs font-semibold truncate">
										{c.key}
									</p>
									<p
										className="text-[11px] mt-0.5"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										{c.hint}
									</p>
								</div>
							</div>
							{c.required ? (
								<Badge tone="primary" size="sm">
									required
								</Badge>
							) : (
								<Badge tone="neutral" size="sm">
									optional
								</Badge>
							)}
						</li>
					))}
				</ul>
				<Separator />
				<div
					className="p-3 rounded-lg overflow-x-auto"
					style={{
						background: "var(--color-surface-muted)",
						border: "1px solid var(--color-border)",
					}}
				>
					<pre className="text-[11px] font-mono whitespace-pre leading-relaxed">
						{CSV_TEMPLATE}
					</pre>
				</div>
				<div className="flex flex-col gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={onDownload}
						leadingIcon={<Download className="size-3.5" />}
					>
						Download template
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onCopy}
						leadingIcon={
							copied ? (
								<CheckCircle2
									className="size-3.5"
									style={{ color: "var(--color-success)" }}
								/>
							) : (
								<Copy className="size-3.5" />
							)
						}
					>
						{copied ? "Copied" : "Copy to clipboard"}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}

function HelpPanel() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Tips</CardTitle>
				<p
					className="text-xs mt-1"
					style={{ color: "var(--color-muted-foreground)" }}
				>
					Avoid common import mistakes
				</p>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3 text-xs">
					{[
						"Headers are auto-mapped: `name`, `full_name`, `fullName` all work.",
						"Websites without `https://` are auto-prefixed.",
						"Duplicates (same email) are skipped, not overwritten.",
						"Both comma and semicolon delimiters supported.",
						"Max 100 leads per import. Larger lists? split first.",
					].map((tip) => (
						<li key={tip} className="flex items-start gap-2">
							<CheckCircle2
								className="size-3.5 shrink-0 mt-0.5"
								style={{ color: "var(--color-success)" }}
							/>
							<span style={{ color: "var(--color-muted-foreground)" }}>
								{tip}
							</span>
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	)
}

function BulkCapturePage() {
	const {
		parsedRows,
		parseErrors,
		result,
		isPending,
		error,
		handleFileUpload,
		handleTextPaste,
		submitBulk,
		reset,
		navigateToLeads,
	} = useBulkCaptureLogic()

	const fileInputRef = useRef<HTMLInputElement>(null)
	const [csvText, setCsvText] = useState("")
	const [dragActive, setDragActive] = useState(false)
	const [copied, setCopied] = useState(false)

	const onFileDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragActive(false)
			const file = e.dataTransfer.files[0]
			if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
				handleFileUpload(file)
			}
		},
		[handleFileUpload],
	)

	const onFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFileUpload(file)
		},
		[handleFileUpload],
	)

	const downloadTemplate = useCallback(() => {
		const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = "leads_template.csv"
		a.click()
		URL.revokeObjectURL(url)
	}, [])

	const copyTemplate = useCallback(() => {
		navigator.clipboard.writeText(CSV_TEMPLATE)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [])

	// ─── Results view ──
	if (result) {
		const metrics: ResultMetric[] = [
			{
				label: "Created",
				value: result.created.length,
				tone: "var(--color-success)",
				icon: CheckCircle2,
				hint: "Pipeline started for each",
			},
			{
				label: "Duplicates",
				value: result.duplicates.length,
				tone: "var(--color-warning)",
				icon: AlertCircle,
				hint: "Skipped — already in DB",
			},
			{
				label: "Invalid",
				value: result.invalid.length,
				tone: "var(--color-danger)",
				icon: XCircle,
				hint: "Bad format or fields",
			},
		]

		return (
			<div className="space-y-6">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-2">
						<Link
							to="/leads"
							className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							<ArrowLeft className="size-3.5" />
							Back to pipeline
						</Link>
						<div>
							<div className="flex items-center gap-2 mb-1">
								<span
									className="text-[11px] font-semibold uppercase tracking-widest"
									style={{ color: "var(--color-primary)" }}
								>
									Bulk Import
								</span>
								<span
									className="size-1 rounded-full"
									style={{ background: "var(--color-muted-foreground)" }}
								/>
								<span
									className="text-[11px] uppercase tracking-widest"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Results
								</span>
							</div>
							<h1 className="text-2xl font-bold tracking-tight">
								Import complete
							</h1>
							<p
								className="text-sm mt-1"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								Review the breakdown below. Successful leads are running through
								the AI pipeline now.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={reset}>
							Import more
						</Button>
						<Button onClick={navigateToLeads}>View all leads</Button>
					</div>
				</div>

				<ResultSummary metrics={metrics} />

				{result.duplicates.length > 0 && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div
									className="size-9 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-warning)"),
										color: "var(--color-warning)",
									}}
								>
									<AlertCircle className="size-4" />
								</div>
								<div>
									<CardTitle className="text-base">
										Duplicates ({result.duplicates.length})
									</CardTitle>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Already in your database — nothing changed
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.duplicates.map((d) => (
										<TableRow key={`${d.email}-${d.fullName}`}>
											<TableCell className="font-medium">
												{d.fullName}
											</TableCell>
											<TableCell
												style={{ color: "var(--color-muted-foreground)" }}
											>
												{d.email}
											</TableCell>
											<TableCell>
												<Badge tone="warning">{d.reason}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				{result.invalid.length > 0 && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div
									className="size-9 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-danger)"),
										color: "var(--color-danger)",
									}}
								>
									<XCircle className="size-4" />
								</div>
								<div>
									<CardTitle className="text-base">
										Invalid Entries ({result.invalid.length})
									</CardTitle>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Fix and re-import these rows
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.invalid.map((inv) => (
										<TableRow key={`${inv.email}-${inv.fullName}`}>
											<TableCell className="font-medium">
												{inv.fullName}
											</TableCell>
											<TableCell
												style={{ color: "var(--color-muted-foreground)" }}
											>
												{inv.email}
											</TableCell>
											<TableCell>
												<Badge tone="danger">{inv.reason}</Badge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</div>
		)
	}

	// ─── Upload view ──
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<Link
						to="/leads"
						className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						<ArrowLeft className="size-3.5" />
						Back to pipeline
					</Link>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<span
								className="text-[11px] font-semibold uppercase tracking-widest"
								style={{ color: "var(--color-primary)" }}
							>
								Bulk Import
							</span>
							<span
								className="size-1 rounded-full"
								style={{ background: "var(--color-muted-foreground)" }}
							/>
							<span
								className="text-[11px] uppercase tracking-widest"
								style={{ color: "var(--color-muted-foreground)" }}
							>
								CSV
							</span>
						</div>
						<h1 className="text-2xl font-bold tracking-tight">
							Import leads from CSV
						</h1>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Upload a file or paste data. Duplicates are detected
							automatically; invalid rows are flagged before anything runs.
						</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main column */}
				<div className="lg:col-span-2 space-y-6">
					<Card>
						<CardHeader>
							<div className="flex items-center gap-3">
								<div
									className="size-9 rounded-lg flex items-center justify-center"
									style={{
										background: softBg("var(--color-primary)"),
										color: "var(--color-primary)",
									}}
								>
									<Upload className="size-4" />
								</div>
								<div>
									<CardTitle className="text-base">Upload</CardTitle>
									<p
										className="text-xs mt-1"
										style={{ color: "var(--color-muted-foreground)" }}
									>
										Drop a .csv or paste raw data
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-5">
							<button
								type="button"
								className="rounded-2xl p-8 text-center transition-all cursor-pointer w-full"
								style={{
									border: `2px dashed ${dragActive ? "var(--color-primary)" : "var(--color-border)"}`,
									background: dragActive
										? softBg("var(--color-primary)")
										: "var(--color-surface-muted)",
								}}
								onDragOver={(e) => {
									e.preventDefault()
									setDragActive(true)
								}}
								onDragLeave={() => setDragActive(false)}
								onDrop={onFileDrop}
								onClick={() => fileInputRef.current?.click()}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault()
										fileInputRef.current?.click()
									}
								}}
							>
								<div
									className="mx-auto size-12 rounded-xl flex items-center justify-center mb-3"
									style={{
										background: softBg("var(--color-primary)"),
										color: "var(--color-primary)",
									}}
								>
									<Upload className="size-5" />
								</div>
								<p className="font-semibold">
									Drop your CSV here, or click to browse
								</p>
								<p
									className="text-xs mt-1"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Up to 100 leads · .csv files only
								</p>
							</button>
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv,text/csv"
								className="hidden"
								onChange={onFileSelect}
							/>

							<div className="flex items-center gap-3">
								<Separator className="flex-1" />
								<span
									className="text-[11px] font-semibold uppercase tracking-wider"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									or paste data
								</span>
								<Separator className="flex-1" />
							</div>

							<div className="space-y-3">
								<Textarea
									className="min-h-[160px] font-mono text-xs"
									placeholder="Paste CSV here…&#10;fullName,email,companyName,companyWebsite&#10;John Doe,john@acme.com,Acme Corp,https://acme.com"
									value={csvText}
									onChange={(e) => setCsvText(e.target.value)}
								/>
								{csvText.trim() && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleTextPaste(csvText)}
									>
										Parse pasted data
									</Button>
								)}
							</div>

							{parseErrors.length > 0 && (
								<div
									className="p-4 rounded-xl border"
									style={{
										background: softBg("var(--color-danger)"),
										borderColor: "var(--color-danger)",
									}}
								>
									<p
										className="font-semibold flex items-center gap-2 mb-2 text-sm"
										style={{ color: "var(--color-danger)" }}
									>
										<AlertCircle className="size-4" />
										CSV parse errors
									</p>
									<ul className="list-disc list-inside text-xs space-y-1">
										{parseErrors.map((err) => (
											<li key={err}>{err}</li>
										))}
									</ul>
								</div>
							)}

							{error && (
								<div
									className="p-3 text-sm rounded-xl border"
									style={{
										background: softBg("var(--color-danger)"),
										color: "var(--color-danger)",
										borderColor: "var(--color-danger)",
									}}
								>
									{(error as { message?: string })?.message ||
										"Failed to import leads"}
								</div>
							)}
						</CardContent>
					</Card>

					{parsedRows.length > 0 && (
						<Card>
							<CardHeader className="flex flex-row items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<div
										className="size-9 rounded-lg flex items-center justify-center"
										style={{
											background: softBg("var(--color-info)"),
											color: "var(--color-info)",
										}}
									>
										<Users className="size-4" />
									</div>
									<div>
										<CardTitle className="text-base">
											Preview · {parsedRows.length} lead
											{parsedRows.length === 1 ? "" : "s"}
										</CardTitle>
										<p
											className="text-xs mt-1"
											style={{ color: "var(--color-muted-foreground)" }}
										>
											Final check before running the AI pipeline
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={reset}
									leadingIcon={<Trash2 className="size-3.5" />}
								>
									Clear
								</Button>
							</CardHeader>
							<CardContent className="p-0 overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-12">#</TableHead>
											<TableHead>Name</TableHead>
											<TableHead>Email</TableHead>
											<TableHead>Company</TableHead>
											<TableHead>Website</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{parsedRows.map((row, i) => (
											<TableRow key={`${row.email}-${i}`}>
												<TableCell
													className="tabular-nums"
													style={{ color: "var(--color-muted-foreground)" }}
												>
													{i + 1}
												</TableCell>
												<TableCell className="font-medium">
													{row.fullName}
												</TableCell>
												<TableCell
													style={{ color: "var(--color-muted-foreground)" }}
												>
													{row.email}
												</TableCell>
												<TableCell>{row.companyName}</TableCell>
												<TableCell style={{ color: "var(--color-primary)" }}>
													{row.companyWebsite.replace(/^https?:\/\//, "")}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
							<CardFooter
								className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 border-t p-6"
								style={{ background: "var(--color-surface-muted)" }}
							>
								<p
									className="text-xs"
									style={{ color: "var(--color-muted-foreground)" }}
								>
									Importing runs the full AI pipeline for each unique lead.
								</p>
								<div className="flex items-center gap-2">
									<Button variant="ghost" onClick={reset}>
										Cancel
									</Button>
									<Button
										onClick={submitBulk}
										disabled={isPending}
										leadingIcon={
											isPending ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												<Upload className="size-4" />
											)
										}
									>
										{isPending
											? `Importing ${parsedRows.length}…`
											: `Import ${parsedRows.length} lead${parsedRows.length === 1 ? "" : "s"}`}
									</Button>
								</div>
							</CardFooter>
						</Card>
					)}
				</div>

				{/* Side panel */}
				<aside className="space-y-4">
					<RequirementsPanel
						onDownload={downloadTemplate}
						onCopy={copyTemplate}
						copied={copied}
					/>
					<HelpPanel />
				</aside>
			</div>
		</div>
	)
}
