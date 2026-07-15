
// src/app/(shop)/page.tsx
import { getHomepageProducts } from '@/lib/products';
import HeroSlider from '@/features/home/components/HeroSlider';
import CollectionsRow from '@/features/home/components/CollectionsRow';
import { SpotlightDeals } from '@/features/home/components/SpotlightDeals';
import { EliteCollection } from '@/features/home/components/EliteCollection';
import NowTrending from '@/features/home/components/NowTrending';
import { JustForYou } from '@/features/home/components/JustForYou';
import CountdownBanner from '@/features/home/components/CountdownBanner';
import { db } from '@/lib/db';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function HomePage() {
  const [
    { spotlight, newArrivals, elite, justForYou },
    slidesSetting,
    collectionsSetting
  ] = await Promise.all([
    getHomepageProducts(),
    db.siteSetting.findUnique({ where: { key: 'homepage_hero_slides' } }),
    db.siteSetting.findUnique({ where: { key: 'homepage_collections' } }),
  ]);

  let customSlides = null;
  let customCollections = null;

  if (slidesSetting) {
    try {
      customSlides = JSON.parse(slidesSetting.value);
    } catch (e) {
      console.error(e);
    }
  }

  if (collectionsSetting) {
    try {
      customCollections = JSON.parse(collectionsSetting.value);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <HeroSlider slides={customSlides} />
      <CollectionsRow items={customCollections} />
      <SpotlightDeals spotlight={spotlight} newArrivals={newArrivals} />
      <EliteCollection products={elite} />
      <NowTrending />
      <JustForYou products={justForYou} />
      <CountdownBanner />
    </main>
  );
}

