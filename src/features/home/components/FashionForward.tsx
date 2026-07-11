
// src/features/home/components/FashionForward.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: 'Closing Line to the Festive Season Celebration',
    date: 'May 15, 2023',
    image: '/images/blog/blog-1.jpg',
    slug: 'festive-season-celebration',
    excerpt: 'Discover the perfect way to wrap up this festive season with our curated collection of ethnic wear.',
  },
  {
    id: 2,
    title: 'The Vegan is the New Fashion Trend: A Sustainable Journey',
    date: 'October 2, 2023',
    image: '/images/blog/blog-2.jpg',
    slug: 'vegan-fashion-trend',
    excerpt: 'Explore how sustainable and vegan fashion is reshaping the ethnic wear industry.',
  },
];

export default function FashionForward() {
  return (
    // Section 7: same container pattern - max-width 1470px, padding 0 45px, margin-bottom 80px
    <section className="w-full max-w-[1470px] mx-auto px-[45px] mb-[80px] max-md:px-0 max-md:mb-[50px]">
      <div className="w-full px-[15px]">
        {/* Section Title with bottom border */}
        <div className="mb-[30px] border-b border-[#999999] flex items-start">
          <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-wide pb-3">
            Fashion Forward
          </h2>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">{post.date}</p>
                <h3 className="text-base md:text-lg font-semibold text-black mt-1 group-hover:text-[#A0463E] transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{post.excerpt}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-[#A0463E] uppercase tracking-wider">
                  Read More →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
