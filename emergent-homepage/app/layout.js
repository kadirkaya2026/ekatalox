import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'eKatalox — Toptan Ticaretin Yeni Nesil Vitrini',
  description: 'Excel\'inizi yükleyin, dijital B2B kataloğunuzu 5 saniyede dünyaya açın. Toptancılar ve distribütörler için premium SaaS vitrin platformu.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="antialiased bg-[#0B0F19] text-white selection:bg-[#00D2FF]/30 selection:text-white">
        {children}
      </body>
    </html>
  )
}
