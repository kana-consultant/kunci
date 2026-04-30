import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useRef } from "react"
import { orpc } from "~/libs/orpc/client"

export function useCaptureLogic() {
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    mutate: captureLead,
    isPending,
    error,
  } = useMutation(
    orpc.lead.capture.mutationOptions({
      onSuccess: () => {
        navigate({ to: "/leads" })
      },
    }),
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      companyName: formData.get("companyName") as string,
      companyWebsite: formData.get("companyWebsite") as string,
      painPoints: (formData.get("painPoints") as string) || undefined,
      leadSource: "Manual Entry",
    }
    const mutate = captureLead
    mutate(data)
  }

  return {
    formRef,
    handleSubmit,
    isPending,
    error,
  }
}
