import { FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-3">
          Filezy
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          New hire paperwork, simplified. Collect W-4, I-9, direct deposit, and
          offer letters from employees via a simple upload link.
        </p>
        <div className="mt-8 flex gap-3">
          <a
            href="/login"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center rounded-xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Get started
          </a>
        </div>
      </div>
    </div>
  )
}
