import {
	Button,
	Card,
	Input,
	Label,
	Textarea,
	Badge,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@kana-consultant/ui-kit"
import { Plus, Trash2, Edit2, Package, Wrench } from "lucide-react"
import { useState } from "react"

export interface Offering {
	name: string
	type: "product" | "service"
	description: string
	keyBenefits: string[]
}

interface OfferingsEditorProps {
	value: Offering[]
	onChange: (value: Offering[]) => void
}

export function OfferingsEditor({ value = [], onChange }: OfferingsEditorProps) {
	const offerings = Array.isArray(value) ? value : []
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingIndex, setEditingIndex] = useState<number | null>(null)

	const [formData, setFormData] = useState<Offering>({
		name: "",
		type: "product",
		description: "",
		keyBenefits: [],
	})
	const [newBenefit, setNewBenefit] = useState("")

	const handleOpenDialog = (index?: number) => {
		if (index !== undefined) {
			setEditingIndex(index)
			setFormData(offerings[index])
		} else {
			setEditingIndex(null)
			setFormData({ name: "", type: "product", description: "", keyBenefits: [] })
		}
		setNewBenefit("")
		setIsDialogOpen(true)
	}

	const handleCloseDialog = () => {
		setIsDialogOpen(false)
		setEditingIndex(null)
	}

	const handleSave = () => {
		if (!formData.name || !formData.description) return

		const updated = [...offerings]
		if (editingIndex !== null) {
			updated[editingIndex] = formData
		} else {
			updated.push(formData)
		}
		onChange(updated)
		handleCloseDialog()
	}

	const handleDelete = (index: number) => {
		const updated = [...offerings]
		updated.splice(index, 1)
		onChange(updated)
	}

	const handleAddBenefit = () => {
		if (!newBenefit.trim()) return
		setFormData((prev) => ({
			...prev,
			keyBenefits: [...prev.keyBenefits, newBenefit.trim()],
		}))
		setNewBenefit("")
	}

	const handleRemoveBenefit = (index: number) => {
		setFormData((prev) => {
			const updated = [...prev.keyBenefits]
			updated.splice(index, 1)
			return { ...prev, keyBenefits: updated }
		})
	}

	return (
		<div className="space-y-4">
			<div className="grid gap-4">
				{offerings.map((offering, index) => (
					<Card key={index} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
						<div className="flex-1 space-y-1">
							<div className="flex items-center gap-2">
								{offering.type === "service" ? (
									<Wrench className="w-4 h-4 text-[var(--color-primary)]" />
								) : (
									<Package className="w-4 h-4 text-[var(--color-primary)]" />
								)}
								<span className="font-semibold text-[var(--color-foreground)]">
									{offering.name}
								</span>
								<Badge className="text-xs uppercase ml-2 border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
									{offering.type}
								</Badge>
							</div>
							<p className="text-sm text-[var(--color-muted-foreground)]">
								{offering.description}
							</p>
							{offering.keyBenefits && offering.keyBenefits.length > 0 && (
								<div className="flex flex-wrap gap-1 mt-2">
									{offering.keyBenefits.map((b, i) => (
										<Badge key={i} className="text-xs font-normal bg-[var(--color-muted)] text-[var(--color-foreground)]">
											{b}
										</Badge>
									))}
								</div>
							)}
						</div>
						<div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
							<Button variant="ghost" size="icon" onClick={() => handleOpenDialog(index)}>
								<Edit2 className="w-4 h-4" />
							</Button>
							<Button variant="ghost" size="icon" className="text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]" onClick={() => handleDelete(index)}>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
					</Card>
				))}
				
				{offerings.length === 0 && (
					<div className="text-center p-8 border border-dashed rounded-lg text-[var(--color-muted-foreground)]">
						No offerings added yet. Add products or services to improve AI email generation.
					</div>
				)}
			</div>

			<Button variant="outline" onClick={() => handleOpenDialog()} className="w-full border-dashed" leadingIcon={<Plus className="w-4 h-4" />}>
				Add Offering
			</Button>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingIndex !== null ? "Edit" : "Add"} Offering</DialogTitle>
					</DialogHeader>
					
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="offering-name">Name</Label>
							<Input
								id="offering-name"
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
								placeholder="e.g. AI SDR Automation"
							/>
						</div>
						
						<div className="grid gap-2">
							<Label>Type</Label>
							<div className="flex gap-4">
								<Label className="flex items-center gap-2 cursor-pointer font-normal">
									<input
										type="radio"
										name="offering-type"
										checked={formData.type === "product"}
										onChange={() => setFormData({ ...formData, type: "product" })}
										className="accent-[var(--color-primary)]"
									/>
									Product
								</Label>
								<Label className="flex items-center gap-2 cursor-pointer font-normal">
									<input
										type="radio"
										name="offering-type"
										checked={formData.type === "service"}
										onChange={() => setFormData({ ...formData, type: "service" })}
										className="accent-[var(--color-primary)]"
									/>
									Service
								</Label>
							</div>
						</div>
						
						<div className="grid gap-2">
							<Label htmlFor="offering-desc">Description</Label>
							<Textarea
								id="offering-desc"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder="Brief description of the product or service"
								className="resize-none"
								rows={3}
							/>
						</div>
						
						<div className="grid gap-2">
							<Label>Key Benefits</Label>
							<div className="flex gap-2">
								<Input
									value={newBenefit}
									onChange={(e) => setNewBenefit(e.target.value)}
									placeholder="e.g. 24/7 outreach"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault()
											handleAddBenefit()
										}
									}}
								/>
								<Button type="button" variant="secondary" onClick={handleAddBenefit}>
									Add
								</Button>
							</div>
							
							<div className="flex flex-wrap gap-2 mt-2">
								{formData.keyBenefits.map((b, i) => (
									<Badge key={i} className="flex items-center gap-1 font-normal bg-[var(--color-muted)] text-[var(--color-foreground)]">
										{b}
										<Trash2
											className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100"
											onClick={() => handleRemoveBenefit(i)}
										/>
									</Badge>
								))}
							</div>
						</div>
					</div>
					
					<DialogFooter>
						<Button variant="ghost" onClick={handleCloseDialog}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={!formData.name || !formData.description}>
							Save Offering
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
