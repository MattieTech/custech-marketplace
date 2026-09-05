"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
const toast = {
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg)
}

const DISPUTE_REASONS = [
  "Item not received",
  "Item not as described",
  "Seller not responding",
  "Payment issue",
  "Other"
]

export default function NewDisputePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    transactionId: "",
    reason: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // API call to create dispute would go here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success("Dispute opened successfully")
      router.push("/dashboard/disputes")
    } catch (error) {
      toast.error("Failed to open dispute")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-4">
          <Link href="/dashboard/disputes">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8" />
            Open a Dispute
          </h1>
          <p className="text-muted-foreground mt-1">
            If you're having an issue with a transaction, let us know and we'll help resolve it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction Reference *</Label>
            <Input 
              id="transactionId" 
              placeholder="e.g. TR-12345678" 
              required
              value={formData.transactionId}
              onChange={e => setFormData(prev => ({...prev, transactionId: e.target.value}))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Dispute *</Label>
            <Select 
              value={formData.reason} 
              onValueChange={(val) => setFormData(prev => ({...prev, reason: val}))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea 
              id="description" 
              placeholder="Please provide as much detail as possible about the issue..." 
              rows={6}
              required
              value={formData.description}
              onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
            />
          </div>

          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
              <p>Image upload coming soon</p>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard/disputes">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Dispute
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
