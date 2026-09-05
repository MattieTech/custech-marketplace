import { PageContainer } from "@/components/layout/page-container"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageContainer className="max-w-4xl py-12">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>
      <main className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-emerald-600">
        {children}
      </main>
    </PageContainer>
  )
}
