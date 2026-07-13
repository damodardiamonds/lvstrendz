
// src/app/(shop)/faqs/page.tsx
import React from 'react';
import { db } from '@/lib/db';
import FaqsClient from './FaqsClient';

export const metadata = {
  title: 'FAQs — LV\'s Trendz',
  description: 'Frequently asked questions about shipping, sizing, returns, and products at LV\'s Trendz.',
};

export default async function Page() {
  const mediaSetting = await db.siteSetting.findUnique({
    where: { key: 'faqs_media' },
  });

  let banner1_image = "https://lvstrendz.com/wp-content/uploads/2026/05/68011ba7032bd1b09686c8fa6f842fda.jpg";
  let banner2_image = "https://bw-monki.bzotech.com/wp-content/uploads/2023/07/blog-5-1.jpg";

  if (mediaSetting) {
    try {
      const parsed = JSON.parse(mediaSetting.value);
      if (parsed.banner1_image) banner1_image = parsed.banner1_image;
      if (parsed.banner2_image) banner2_image = parsed.banner2_image;
    } catch {}
  }

  return (
    <FaqsClient
      banner1_image={banner1_image}
      banner2_image={banner2_image}
    />
  );
}
