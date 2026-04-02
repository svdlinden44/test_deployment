import { Hero } from '@/components/sections/Hero'
import { Marquee } from '@/components/sections/Marquee'
import { Philosophy } from '@/components/sections/Philosophy'
import { Features } from '@/components/sections/Features'
import { CocktailShowcase } from '@/components/sections/CocktailShowcase'
import { Stats } from '@/components/sections/Stats'
import { Personalization } from '@/components/sections/Personalization'
import { Waitlist } from '@/components/sections/Waitlist'

export function Home() {
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
