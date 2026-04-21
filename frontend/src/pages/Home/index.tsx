import { Hero } from '@/components/sections/Hero'
import { Marquee } from '@/components/sections/Marquee'
import { Philosophy } from '@/components/sections/Philosophy'
import { Features } from '@/components/sections/Features'
import { CocktailShowcase } from '@/components/sections/CocktailShowcase'
import { Stats } from '@/components/sections/Stats'
import { Personalization } from '@/components/sections/Personalization'
import { Waitlist } from '@/components/sections/Waitlist'
import { LogoSpinner } from '@/components/ui/LogoSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { MemberHome } from './MemberHome'

export function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LogoSpinner label="Loading" />
      </div>
    )
  }

  if (user) {
    return <MemberHome />
  }

  return (
    <>
      <Hero />
      <Marquee />
      <Philosophy />
      <Features />
      <CocktailShowcase />
      <Stats />
      <Personalization />
      <Waitlist />
    </>
  )
}
