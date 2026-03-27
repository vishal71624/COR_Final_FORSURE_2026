'use client'

import { useState, useEffect } from 'react'
import { useGameStore } from '@/lib/game-store'
import { AdminPanel } from '@/components/admin-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Shield, AlertCircle } from 'lucide-react'

export default function AdminPage() {
  const { isAdmin, adminLogin, loadPlayers, loadRound1Questions, loadRound2Challenges } = useGameStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [restoring, setRestoring] = useState(true)

  // On mount: restore admin session from localStorage, then load data
  useEffect(() => {
    const restore = async () => {
      if (typeof window !== 'undefined') {
        const adminSession = localStorage.getItem('itrix_admin_session')
        if (adminSession === 'true') {
          useGameStore.setState({ isAdmin: true, currentView: 'admin' })
        }
      }
      setRestoring(false)
    }
    restore()
  }, [])

  // Load data when admin is confirmed
  useEffect(() => {
    if (isAdmin) {
      Promise.all([loadPlayers(), loadRound1Questions(), loadRound2Challenges()])
    }
  }, [isAdmin])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    const success = adminLogin(password)
    if (!success) {
      setError('Invalid admin password')
    }
    setIsLoading(false)
  }

  if (restoring) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Restoring session…</p>
      </div>
    )
  }

  if (isAdmin) {
    return <AdminPanel />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

      <Card className="max-w-sm w-full border-primary/30 bg-card/80 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl text-foreground">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-mono bg-input border-border focus:border-primary text-center"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
