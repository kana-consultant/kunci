import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
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
	Copy,
	Download,
	FileSpreadsheet,
	Loader2,
	Trash2,
	Upload,
	Users,
	XCircle,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"

import { useBulkCaptureLogic } from "./_hooks/use-bulk-capture"

export const Route = createFileRoute("/_authenticated/bulk-capture")({
	component: BulkCapturePage,
})

const CSV_TEMPLATE = `fullName,email,companyName,companyWebsite,painPoints,linkedinUrl
John Doe,john@acme.com,Acme Corp,https://acme.com,Slow lead response times,https://linkedin.com/in/johndoe
Jane Smith,jane@globex.com,Globex Corp,https://globex.com,Poor email deliverability,`

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
	}, [])

	// Results view
	if (result) {
		return (
			<div className="space-y-6">
				<div className="flex items-start justify-between gap-4 max-w-4xl">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">
							Bulk Import Results
						</h1>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Import completed — review the results below.
						</p>
					</div>
					<div className="flex gap-3">
						<Button variant="outline" onClick={reset}>
							Import More
						</Button>
						<Button onClick={navigateToLeads}>View All Leads</Button>
					</div>
				</div>

				{/* Summary Strip */}
				<div
					className="grid grid-cols-3 gap-px rounded-xl overflow-hidden max-w-4xl"
					style={{ background: "var(--color-border)" }}
				>
					{[
						{
							label: "Created Successfully",
							value: result.created.length,
							color: "var(--color-success)",
						},
						{
							label: "Duplicates Skipped",
							value: result.duplicates.length,
							color: "var(--color-warning)",
						},
						{
							label: "Invalid Entries",
							value: result.invalid.length,
							color: "var(--color-danger)",
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

				{/* Duplicates Details */}
				{result.duplicates.length > 0 && (
					<Card className="max-w-4xl">
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<AlertCircle
									className="w-4 h-4"
									style={{ color: "var(--color-warning)" }}
								/>
								Duplicates ({result.duplicates.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader style={{ background: "var(--color-surface-alt)" }}>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.duplicates.map((d, i) => (
										<TableRow key={i}>
											<TableCell>{d.fullName}</TableCell>
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

				{/* Invalid Details */}
				{result.invalid.length > 0 && (
					<Card className="max-w-4xl">
						<CardHeader>
							<CardTitle className="text-base flex items-center gap-2">
								<XCircle
									className="w-4 h-4"
									style={{ color: "var(--color-danger)" }}
								/>
								Invalid Entries ({result.invalid.length})
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader style={{ background: "var(--color-surface-alt)" }}>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Email</TableHead>
										<TableHead>Reason</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.invalid.map((inv, i) => (
										<TableRow key={i}>
											<TableCell>{inv.fullName}</TableCell>
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

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4 max-w-4xl">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
					<p
						className="text-sm mt-1"
						style={{ color: "var(--color-muted-foreground)" }}
					>
						Upload a CSV file or paste CSV data to import multiple leads at
						once.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link to="/leads">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Leads
					</Link>
				</Button>
			</div>

			{/* Template Download */}
			<Card className="max-w-4xl">
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<FileSpreadsheet className="w-4 h-4" />
						CSV Template
					</CardTitle>
					<CardDescription>
						Download or copy the template to ensure your CSV has the correct
						format.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div
						className="p-4 rounded-lg overflow-x-auto"
						style={{ background: "var(--color-surface-alt)" }}
					>
						<pre className="text-xs font-mono whitespace-pre">
							{CSV_TEMPLATE}
						</pre>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={downloadTemplate}
							leadingIcon={<Download className="w-3.5 h-3.5" />}
						>
							Download Template
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={copyTemplate}
							leadingIcon={<Copy className="w-3.5 h-3.5" />}
						>
							Copy to Clipboard
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Upload Area */}
			<Card className="max-w-4xl">
				<CardHeader>
					<CardTitle className="text-base flex items-center gap-2">
						<Upload className="w-4 h-4" />
						Import Data
					</CardTitle>
					<CardDescription>
						Upload a CSV file or paste your data directly. Duplicates will be
						automatically detected and skipped.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Drop Zone */}
					<div
						className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer`}
						style={{
							borderColor: dragActive
								? "var(--color-primary)"
								: "var(--color-border)",
							backgroundColor: dragActive
								? "var(--color-primary-muted)"
								: "transparent",
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
						role="button"
						tabIndex={0}
					>
						<Upload
							className="w-8 h-8 mx-auto mb-3"
							style={{ color: "var(--color-muted-foreground)" }}
						/>
						<p className="font-medium">
							Drop your CSV file here or click to browse
						</p>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							Supports .csv files up to 100 leads
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={onFileSelect}
						/>
					</div>

					{/* Divider */}
					<div className="flex items-center gap-4">
						<div className="flex-1 border-t" />
						<span
							className="text-sm"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							or paste CSV data
						</span>
						<div className="flex-1 border-t" />
					</div>

					{/* Text Area */}
					<Textarea
						className="min-h-[160px] font-mono"
						placeholder="Paste your CSV data here...&#10;fullName,email,companyName,companyWebsite&#10;John Doe,john@acme.com,Acme Corp,https://acme.com"
						value={csvText}
						onChange={(e) => setCsvText(e.target.value)}
					/>
					{csvText.trim() && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								handleTextPaste(csvText)
							}}
						>
							Parse CSV Data
						</Button>
					)}

					{/* Parse Errors */}
					{parseErrors.length > 0 && (
						<div
							className="p-4 rounded-xl border"
							style={{
								background: "var(--color-danger-muted)",
								borderColor: "var(--color-danger)",
							}}
						>
							<p
								className="font-medium flex items-center gap-2 mb-2"
								style={{ color: "var(--color-danger)" }}
							>
								<AlertCircle className="w-4 h-4" />
								CSV Parse Errors
							</p>
							<ul className="list-disc list-inside text-sm space-y-1">
								{parseErrors.map((err, i) => (
									<li key={i}>{err}</li>
								))}
							</ul>
						</div>
					)}

					{/* API Error */}
					{error && (
						<div
							className="p-3 text-sm rounded-xl border"
							style={{
								background: "var(--color-danger-muted)",
								color: "var(--color-danger)",
								borderColor: "var(--color-danger)",
							}}
						>
							{(error as any)?.message || "Failed to import leads"}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Preview Table */}
			{parsedRows.length > 0 && (
				<Card className="max-w-4xl">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-base flex items-center gap-2">
									<Users className="w-4 h-4" />
									Preview ({parsedRows.length} leads)
								</CardTitle>
								<CardDescription>
									Review the parsed data before importing. Duplicates will be
									automatically skipped.
								</CardDescription>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={reset}
								leadingIcon={<Trash2 className="w-3.5 h-3.5" />}
							>
								Clear
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0 overflow-x-auto">
						<Table>
							<TableHeader style={{ background: "var(--color-surface-alt)" }}>
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
									<TableRow key={i}>
										<TableCell
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
						className="flex justify-end gap-3 border-t p-6"
						style={{ background: "var(--color-surface-alt)" }}
					>
						<Button variant="ghost" onClick={reset}>
							Cancel
						</Button>
						<Button
							onClick={submitBulk}
							disabled={isPending}
							leadingIcon={
								isPending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Upload className="w-4 h-4" />
								)
							}
						>
							{isPending
								? `Importing ${parsedRows.length} leads...`
								: `Import ${parsedRows.length} Leads`}
						</Button>
					</CardFooter>
				</Card>
			)}
		</div>
	)
}
