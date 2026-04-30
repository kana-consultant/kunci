import { useAppForm } from "@kana-consultant/ui-kit"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { orpc } from "~/libs/orpc/client"

export const captureSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyWebsite: z.string().url("Valid website URL is required"),
  painPoints: z.string().optional(),
})

export type CaptureFormValues = z.infer<typeof captureSchema>

export function useCaptureLogic() {
  const navigate = useNavigate()

  const {
    mutateAsync: captureLead,
    isPending,
    error,
  } = useMutation(
    (orpc.lead.capture as any).mutationOptions(),
  )

  const form = useAppForm({
    defaultValues: {
      fullName: "",
      email: "",
      companyName: "",
      companyWebsite: "",
      painPoints: "",
    } as CaptureFormValues,
    validators: {
      onChange: captureSchema,
    },
    onSubmit: async ({ value }) => {
      await captureLead({
        ...value,
        leadSource: "Manual Entry",
      } as any)
      navigate({ to: "/leads" })
    },
  })

  return {
    form,
    isPending,
    error,
  }
}
