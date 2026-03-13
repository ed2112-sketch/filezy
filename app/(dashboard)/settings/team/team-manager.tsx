"use client"

import { useState } from "react"
import {
  Crown,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  X,
  Eye,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Member = {
  id: string
  name: string | null
  email: string
  role: string
}

type Props = {
  currentUserRole: string
  initialOwner: Member | null
  initialMembers: Member[]
}

export function TeamManager({
  currentUserRole,
  initialOwner,
  initialMembers,
}: Props) {
  const [owner] = useState<Member | null>(initialOwner)
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
  })

  const isOwner = currentUserRole === "OWNER"

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)

    try {
      const res = await fetch("/api/business/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to invite member.")
        return
      }

      setMembers((prev) => [...prev, data.member])
      setForm({ name: "", email: "", password: "", role: "ADMIN" })
      setShowInviteForm(false)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setUpdatingId(memberId)
    setError(null)

    try {
      const res = await fetch(`/api/business/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to update role.")
        return
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemove(memberId: string) {
    setRemovingId(memberId)
    setError(null)

    try {
      const res = await fetch(`/api/business/members/${memberId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to remove member.")
        return
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setRemovingId(null)
    }
  }

  function roleBadge(role: string) {
    switch (role) {
      case "OWNER":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1">
            <Crown className="h-3 w-3" />
            Owner
          </Badge>
        )
      case "ADMIN":
        return (
          <Badge className="bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/10 gap-1">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </Badge>
        )
      case "VIEWER":
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 gap-1">
            <Eye className="h-3 w-3" />
            Viewer
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Owner card */}
      {owner && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-5 w-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {owner.name ?? "Unnamed"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {owner.email}
                  </p>
                </div>
              </div>
              {roleBadge("OWNER")}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      {members.map((member) => (
        <Card key={member.id} className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-slate-600">
                    {(member.name ?? member.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {member.name ?? "Unnamed"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwner ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value)
                      }
                      disabled={updatingId === member.id}
                      className="h-9 rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 w-9"
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                    >
                      {removingId === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  roleBadge(member.role)
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {members.length === 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Invite someone to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invite form */}
      {isOwner && (
        <>
          {showInviteForm ? (
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Invite Team Member</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-8 w-8"
                    onClick={() => {
                      setShowInviteForm(false)
                      setError(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Name</Label>
                    <Input
                      id="invite-name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Jane Doe"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="jane@company.com"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-password">Password</Label>
                    <Input
                      id="invite-password"
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Set a password"
                      required
                      minLength={6}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                      id="invite-role"
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="w-full gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Invite Member
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={() => setShowInviteForm(true)}
              className="w-full gap-2 bg-[#136334] hover:bg-[#136334]/90 rounded-xl"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
        </>
      )}
    </div>
  )
}
