'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload } from 'lucide-react'
import { CustechLogoLoader } from '@/components/ui/custech-loader'
import { toast } from '@/components/ui/toast'

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: ''
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
        if (data) {
          setProfile(data)
          setFormData({
            displayName: data.display_name || '',
            bio: data.bio || '',
            location: data.location || ''
          })
        }
      } catch (error) {
        console.error('Error loading profile', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [supabase])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError
      
      setProfile({ ...profile, avatar_url: publicUrl })
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
      toast.success('Profile picture updated successfully!')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error uploading file' })
      toast.error(error.message || 'Error uploading file')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { error } = await supabase.from('profiles')
        .update({
          display_name: formData.displayName,
          bio: formData.bio,
          location: formData.location
        })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error updating profile' })
      toast.error(error.message || 'Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <CustechLogoLoader mode="in-app" size="md" message="Loading your student profile..." />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your public profile information.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
          <CardDescription>This will be displayed on your listings and messages.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center space-x-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-medium text-gray-400">
                {formData.displayName?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <Button variant="outline" className="relative overflow-hidden" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Change Photo
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={saving}
              />
            </Button>
            <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
              <Input 
                id="displayName" 
                value={formData.displayName} 
                onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                maxLength={50}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">Location</label>
              <Input 
                id="location" 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. CUSTECH Main Campus, Hostel A"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                <span className="text-xs text-gray-500">{formData.bio.length}/500</span>
              </div>
              <textarea 
                id="bio"
                rows={4}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value.slice(0, 500)})}
                placeholder="Tell others about yourself..."
              />
            </div>

            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
