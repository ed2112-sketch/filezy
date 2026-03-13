"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileText,
  Users,
  DollarSign,
  Link2,
  LogOut,
  ChevronDown,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navLinks = [
  { href: "/portal", label: "Clients", icon: Users },
  { href: "/portal/earnings", label: "Earnings", icon: DollarSign },
  { href: "/portal/referral", label: "Referral Link", icon: Link2 },
]

export function AccountantShell({
  children,
  accountantName,
  firmName,
}: {
  children: React.ReactNode
  accountantName: string
  firmName?: string
}) {
  const pathname = usePathname()

  const initials = accountantName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Left: Logo + nav */}
          <div className="flex items-center gap-8">
            <Link href="/portal" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Filezy" width={120} height={32} className="h-8 w-auto" priority />
              <span className="text-xs font-medium bg-[#136334]/10 text-[#136334] px-2 py-0.5 rounded-full">
                Partner
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(link.href)
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 ${
                        isActive
                          ? "bg-[#136334]/10 text-[#136334] hover:bg-[#136334]/15"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right: User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer outline-none">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#136334]/10 text-[#136334] text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {accountantName}
                </span>
                {firmName && (
                  <span className="text-xs text-muted-foreground leading-none mt-0.5">
                    {firmName}
                  </span>
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{accountantName}</p>
                {firmName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {firmName}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive"
                onClick={() => {
                  fetch("/api/auth/signout", { method: "POST" }).then(() => {
                    window.location.href = "/login"
                  })
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile nav */}
        <nav className="sm:hidden flex items-center gap-1 px-4 pb-2">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full gap-1.5 text-xs ${
                    isActive
                      ? "bg-[#136334]/10 text-[#136334]"
                      : "text-muted-foreground"
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
