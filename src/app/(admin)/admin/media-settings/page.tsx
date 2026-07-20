
// src/app/(admin)/admin/media-settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Save, Loader2, Sparkles, Image as ImageIcon, Video, HelpCircle, FileText } from 'lucide-react';

const defaultHeroSlides = [
  {
    id: 1,
    title: 'Desi Glam',
    subtitle: 'Make a statement at every party',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_49-AM.webp',
    link: '/collections/party-wear',
  },
  {
    id: 2,
    title: 'Queen Style',
    subtitle: 'Royal fits for your wedding wardrobe',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp',
    link: '/collections/wedding-wardrobe',
  },
  {
    id: 3,
    title: 'Patola Muse',
    subtitle: 'Classic silk sarees with modern grace',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_09_14-AM.webp',
    link: '/collections/saree-studio',
  },
  {
    id: 4,
    title: 'Festive Mood',
    subtitle: 'Vibrant ethnic prints for celebrations',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_04_35-AM.webp',
    link: '/collections/festive-fits',
  },
  {
    id: 5,
    title: 'Ethnic Glow',
    subtitle: 'Twirl in style with bridal lehengas',
    image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_07_57-AM.webp',
    link: '/collections/lehenga-choli',
  },
];

const defaultCollections = [
  { id: '1', name: 'Saree Studio', image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_09_14-AM.webp', link: '/collections/saree-studio' },
  { id: '2', name: 'Festive Fits', image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_04_35-AM.webp', link: '/collections/festive-fits' },
  { id: '3', name: 'Rooted Style', image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_02_49-AM.webp', link: '/collections/party-wear' },
  { id: '4', name: 'Lehenga Choli', image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_07_57-AM.webp', link: '/collections/lehenga-choli' },
  { id: '5', name: 'Wedding Wardrobe', image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp', link: '/collections/wedding-wardrobe' },
];

const defaultAboutUs = {
  storyImage: 'https://res.cloudinary.com/n5umtsub/image/upload/lvstrendz/products/fd41615365cea9a68738438feb0c1797.webp',
  missionVideo: 'https://res.cloudinary.com/n5umtsub/video/upload/v1783773052/lvstrendz/videos/78db5a9a-b0f4-42a3-bbf2-93a75e80f804.mp4',
};

const defaultFaqs = {
  banner1_image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp',
  banner2_image: 'https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_07_57-AM.webp',
};

export default function MediaSettingsPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'collections' | 'about' | 'faqs'>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // States for forms
  const [heroSlides, setHeroSlides] = useState(defaultHeroSlides);
  const [collections, setCollections] = useState(defaultCollections);
  const [aboutUs, setAboutUs] = useState(defaultAboutUs);
  const [faqs, setFaqs] = useState(defaultFaqs);

  // Load from API
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/media-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.homepage_hero_slides) setHeroSlides(data.homepage_hero_slides);
          if (data.homepage_collections) setCollections(data.homepage_collections);
          if (data.about_us_media) setAboutUs(data.about_us_media);
          if (data.faqs_media) setFaqs(data.faqs_media);
        } else {
          toast.error('Failed to load settings. Using defaults.');
        }
      } catch {
        toast.error('API connection failed. Using defaults.');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Save specific key to API
  const handleSave = async (key: string, value: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/media-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        toast.success(`${key.replace(/_/g, ' ').toUpperCase()} saved successfully!`);
      } else {
        const errData = await res.json();
        toast.error(`Error: ${errData.error || 'Failed to save settings'}`);
      }
    } catch {
      toast.error('Network request failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#A0463E]" />
        <p className="text-sm font-medium text-gray-500">Loading Media Layout Configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-2">
      <Toaster position="top-right" />
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="text-[#A0463E]" size={24} />
            Media Management Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize Cloudinary and asset URLs used on your storefront hero widgets, collection circles, and story contents.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200 gap-2 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'hero'
              ? 'border-[#A0463E] text-[#A0463E]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          <ImageIcon size={16} />
          Homepage Hero Accordion
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'collections'
              ? 'border-[#A0463E] text-[#A0463E]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          <ImageIcon size={16} />
          Homepage Collection Circles
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'about'
              ? 'border-[#A0463E] text-[#A0463E]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          <Video size={16} />
          About Us media
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === 'faqs'
              ? 'border-[#A0463E] text-[#A0463E]'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          <HelpCircle size={16} />
          FAQs Banners
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        
        {/* Tab 1: Hero Slider */}
        {activeTab === 'hero' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Hero Accordion Slider (5 panels)</h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize images and text shown in the premium expandable home slider.</p>
              </div>
              <button
                onClick={() => handleSave('homepage_hero_slides', heroSlides)}
                disabled={saving}
                className="bg-[#A0463E] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:bg-gray-400 tracking-wider shadow-sm transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save Slides Layout
              </button>
            </div>

            <div className="space-y-6">
              {heroSlides.map((slide, idx) => (
                <div key={slide.id} className="p-5 border border-gray-150 rounded-xl bg-gray-50/50 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-black uppercase text-[#A0463E] tracking-widest">
                      Panel {idx + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[idx].title = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Subtitle</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[idx].subtitle = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Cloudinary/WordPress Image URL</label>
                      <input
                        type="text"
                        value={slide.image}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[idx].image = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Target Route Link</label>
                      <input
                        type="text"
                        value={slide.link}
                        onChange={(e) => {
                          const updated = [...heroSlides];
                          updated[idx].link = e.target.value;
                          setHeroSlides(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Collections circles */}
        {activeTab === 'collections' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Collections Circle list (5 items)</h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize categories displayed in round thumbnails on the home row.</p>
              </div>
              <button
                onClick={() => handleSave('homepage_collections', collections)}
                disabled={saving}
                className="bg-[#A0463E] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:bg-gray-400 tracking-wider shadow-sm transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save Collections Row
              </button>
            </div>

            <div className="space-y-6">
              {collections.map((item, idx) => (
                <div key={item.id} className="p-5 border border-gray-150 rounded-xl bg-gray-50/55 space-y-4">
                  <span className="text-xs font-black uppercase text-[#A0463E] tracking-widest block border-b border-gray-100 pb-1">
                    Circle Thumbnail {idx + 1}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...collections];
                          updated[idx].name = e.target.value;
                          setCollections(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Asset URL (Cloudinary/WordPress)</label>
                      <input
                        type="text"
                        value={item.image}
                        onChange={(e) => {
                          const updated = [...collections];
                          updated[idx].image = e.target.value;
                          setCollections(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Redirect Path Link</label>
                      <input
                        type="text"
                        value={item.link}
                        onChange={(e) => {
                          const updated = [...collections];
                          updated[idx].link = e.target.value;
                          setCollections(updated);
                        }}
                        className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#A0463E]"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: About Us media */}
        {activeTab === 'about' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">About Us Page Assets</h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize the high-fidelity imagery and reels representing company values.</p>
              </div>
              <button
                onClick={() => handleSave('about_us_media', aboutUs)}
                disabled={saving}
                className="bg-[#A0463E] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:bg-gray-400 tracking-wider shadow-sm transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save About Us Layout
              </button>
            </div>

            <div className="p-6 border border-gray-150 rounded-xl bg-gray-50/50 space-y-6">
              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-2">Our Story - Banner Image URL</label>
                <input
                  type="text"
                  value={aboutUs.storyImage}
                  onChange={(e) => setAboutUs((prev) => ({ ...prev, storyImage: e.target.value }))}
                  className="w-full bg-white border border-gray-250 px-4 py-2.5 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold text-gray-700 mb-2">Values Section - Loop Video Player URL (.mp4)</label>
                <input
                  type="text"
                  value={aboutUs.missionVideo}
                  onChange={(e) => setAboutUs((prev) => ({ ...prev, missionVideo: e.target.value }))}
                  className="w-full bg-white border border-gray-250 px-4 py-2.5 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: FAQ Banners */}
        {activeTab === 'faqs' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">FAQ Banner Cards</h2>
                <p className="text-xs text-gray-500 mt-0.5">Customize graphics displayed next to FAQ accordions.</p>
              </div>
              <button
                onClick={() => handleSave('faqs_media', faqs)}
                disabled={saving}
                className="bg-[#A0463E] hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 disabled:bg-gray-400 tracking-wider shadow-sm transition-colors"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                Save FAQ Banners
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Banner 1 */}
              <div className="p-5 border border-gray-150 rounded-xl bg-gray-50/50 space-y-4">
                <span className="text-xs font-black uppercase text-[#A0463E] tracking-widest block border-b border-gray-100 pb-1">
                  FAQ Banner Card 1
                </span>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={faqs.banner1_image}
                    onChange={(e) => setFaqs((prev) => ({ ...prev, banner1_image: e.target.value }))}
                    className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                    required
                  />
                </div>
              </div>

              {/* Banner 2 */}
              <div className="p-5 border border-gray-150 rounded-xl bg-gray-50/50 space-y-4">
                <span className="text-xs font-black uppercase text-[#A0463E] tracking-widest block border-b border-gray-100 pb-1">
                  FAQ Banner Card 2
                </span>
                <div>
                  <label className="block text-xs uppercase font-bold text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={faqs.banner2_image}
                    onChange={(e) => setFaqs((prev) => ({ ...prev, banner2_image: e.target.value }))}
                    className="w-full bg-white border border-gray-250 px-3 py-2 rounded-lg text-sm font-mono text-xs focus:outline-none focus:border-[#A0463E]"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
