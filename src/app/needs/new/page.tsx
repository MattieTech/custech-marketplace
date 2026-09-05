"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, LOCATIONS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
const toast = {
  success: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg)
}

export default function NewNeedPage() {
  const router = useRouter()
  const { user } = useUser()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    location: "",
    deadline: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to post a request")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("listings").insert({
        seller_id: user.id,
        listing_type: "need",
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.budget ? parseFloat(formData.budget) : 0,
        location: formData.location,
        status: "active",
      })

      if (error) throw error

      toast.success("Request posted successfully!")
      router.push("/needs")
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to post request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto py-8">
        <Button variant="ghost" asChild className="mb-6 -ml-4">
          <Link href="/needs">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Post a Request</h1>
          <p className="text-muted-foreground mt-1">
            Tell the community what you need. Be as specific as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              name="title" 
              placeholder="e.g., I need a used laptop" 
              required
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Requirements *</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Describe what you are looking for, preferred specs, condition, etc." 
              rows={5}
              required
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => handleSelectChange("category", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional, ₦)</Label>
              <Input 
                id="budget" 
                name="budget" 
                type="number" 
                min="0"
                placeholder="e.g., 50000" 
                value={formData.budget}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select 
                value={formData.location} 
                onValueChange={(val) => handleSelectChange("location", val)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc: any) => {
                    const val = typeof loc === 'string' ? loc : loc.value;
                    const lbl = typeof loc === 'string' ? loc : loc.label;
                    return (
                      <SelectItem key={val} value={val}>
                        {lbl}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Needed By (Optional)</Label>
              <Input 
                id="deadline" 
                name="deadline" 
                type="date" 
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/needs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Post Request
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
