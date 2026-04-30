export interface Setting {
	key: string
	value: any
	category: string
	label: string
	description: string | null
	valueType: string
	updatedAt: Date
	updatedBy: string | null
}
