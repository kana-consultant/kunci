import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@kana-consultant/ui-kit"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"

import { useCaptureLogic } from "./-use-capture"

export const Route = createFileRoute("/_authenticated/capture")({
  component: CapturePage,
})

function CapturePage() {
  const { form, isPending, error } = useCaptureLogic()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Lead</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          The AI pipeline will automatically research, analyze, and generate a
          personalized email sequence.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
            <CardDescription>
              Fill in the lead's details. Required fields are marked.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="fullName"
                children={(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} required>
                      Full Name
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="John Doe"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-[var(--color-danger)]">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              />

              <form.Field
                name="email"
                children={(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} required>
                      Email Address
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="john@company.com"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-[var(--color-danger)]">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form.Field
                name="companyName"
                children={(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} required>
                      Company Name
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Acme Corp"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-[var(--color-danger)]">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              />

              <form.Field
                name="companyWebsite"
                children={(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} required>
                      Company Website
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="url"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://acme.com"
                    />
                    {field.state.meta.errors ? (
                      <p className="text-xs text-[var(--color-danger)]">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>

            <form.Field
              name="painPoints"
              children={(field: any) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Pain Points{" "}
                    <span className="text-[var(--color-muted-foreground)] font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Any known pain points or specific context for the AI to use..."
                  />
                  {field.state.meta.errors ? (
                    <p className="text-xs text-[var(--color-danger)]">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            {error ? (
              <p className="text-sm text-[var(--color-danger)]">
                {(error as any).message || "An error occurred"}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
                <Sparkles className="w-4 h-4 text-[var(--color-warning)]" />
                The AI pipeline will start automatically after capture.
              </div>
            )}

            <form.Subscribe
              selector={(state: any) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]: any) => (
                <Button
                  type="submit"
                  loading={isPending || isSubmitting}
                  disabled={!canSubmit}
                >
                  Capture Lead
                </Button>
              )}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
