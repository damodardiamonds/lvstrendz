
// src/app/(shop)/page.tsx
import { getHomepageProducts } from '@/lib/products';
import HeroSlider  from '@/features/home/components/HeroSlider';
import CollectionsRow from '@/features/home/components/CollectionsRow';
import { SpotlightDeals } from '@/features/home/components/SpotlightDeals';
import { NewArrivals } from '@/features/home/components/NewArrivals';
import { EliteCollection } from '@/features/home/components/EliteCollection';
import NowTrending from '@/features/home/components/NowTrending';
import { JustForYou } from '@/features/home/components/JustForYou';
import FashionForward from '@/features/home/components/FashionForward';
import NewsletterBanner from '@/features/home/components/NewsletterBanner';
import Footer from '@/features/home/components/Footer';


// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function HomePage() {
  const { spotlight, newArrivals, elite, justForYou } = await getHomepageProducts();

  return (
    <main className="min-h-screen bg-white">
      <HeroSlider />
      <CollectionsRow />
      <SpotlightDeals products={spotlight} />
      <NewArrivals products={newArrivals} />
      <EliteCollection products={elite} />
      <NowTrending />
      <JustForYou products={justForYou} />
      <FashionForward />
      <NewsletterBanner />
      <Footer />
    </main>
  );
}

