export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4 font-[family-name:var(--font-satoshi)]">
      {children}
    </div>
  )
}
