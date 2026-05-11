import type { CreateEmailMessageInput, EmailMessage } from "./email-message.ts"

export interface EmailMessageRepository {
	append(input: CreateEmailMessageInput): Promise<EmailMessage>
	listByLeadId(leadId: string): Promise<EmailMessage[]>
	countOutbound(leadId: string): Promise<number>
}
