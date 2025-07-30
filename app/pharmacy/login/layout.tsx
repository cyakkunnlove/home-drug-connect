export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}

// CSPを無効化
export const metadata = {
  other: {
    'Content-Security-Policy': "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';",
  },
}