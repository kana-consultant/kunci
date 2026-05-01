interface SandboxShellProps {
	title?: string
	description?: string
	left: React.ReactNode
	right: React.ReactNode
}

export function SandboxShell({
	title,
	description,
	left,
	right,
}: SandboxShellProps) {
	return (
		<div className="space-y-6">
			{(title || description) && (
				<div>
					{title && (
						<h2 className="text-base font-semibold tracking-tight">{title}</h2>
					)}
					{description && (
						<p
							className="text-xs mt-0.5"
							style={{ color: "var(--color-muted-foreground)" }}
						>
							{description}
						</p>
					)}
				</div>
			)}
			<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
				<div>{left}</div>
				<div className="sticky top-6">{right}</div>
			</div>
		</div>
	)
}
