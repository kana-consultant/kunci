import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeHandleReplyUseCase } from "./handle-reply.ts"

describe("handleReply", () => {
    const mockDeps = {
        leadRepo: {
            findByEmail: vi.fn(),
            update: vi.fn()
        },
        sequenceRepo: {
            getByStage: vi.fn(),
            markSent: vi.fn()
        },
        ai: {
            personalizeReply: vi.fn(),
            convertToHtml: vi.fn()
        },
        emailService: {
            replyInThread: vi.fn()
        },
        logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("should process unknown lead with ignored status", async () => {
        mockDeps.leadRepo.findByEmail.mockResolvedValue(null)
        const handleReply = makeHandleReplyUseCase(mockDeps as any)

        const result = await handleReply({
            fromEmail: "unknown@test.com",
            subject: "Re: Hello",
            textBody: "Interested",
            messageId: "msg-123"
        })

        expect(result.status).toBe("ignored")
        expect(result.reason).toBe("unknown_lead")
    })

    it("should process reply and send personalized follow-up", async () => {
        const lead = { 
            id: "lead-1", 
            email: "test@test.com", 
            stage: 1, 
            replyStatus: "pending",
            latestMessageId: "orig-msg-1",
            messageIds: ["orig-msg-1"]
        }
        const sequence = { id: "seq-2", content: "Follow up content", cta: "Book a call", psychologicalTrigger: "Scarcity" }
        
        mockDeps.leadRepo.findByEmail.mockResolvedValue(lead)
        mockDeps.sequenceRepo.getByStage.mockResolvedValue(sequence)
        mockDeps.ai.personalizeReply.mockResolvedValue({ subject: "Re: Hello", content: "Personalized content" })
        mockDeps.ai.convertToHtml.mockResolvedValue("<p>Personalized content</p>")
        mockDeps.emailService.replyInThread.mockResolvedValue({ messageId: "reply-msg-1", sentAt: new Date() })

        const handleReply = makeHandleReplyUseCase(mockDeps as any)

        const result = await handleReply({
            fromEmail: "test@test.com",
            subject: "Re: Hello",
            textBody: "Tell me more",
            messageId: "msg-123"
        })

        expect(result.status).toBe("success")
        expect(result.action).toBe("auto_replied")
        expect(mockDeps.ai.personalizeReply).toHaveBeenCalled()
        expect(mockDeps.emailService.replyInThread).toHaveBeenCalled()
        expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", { replyStatus: "replied" })
        expect(mockDeps.leadRepo.update).toHaveBeenCalledWith("lead-1", expect.objectContaining({ stage: 2, replyStatus: "awaiting" }))
    })
})
