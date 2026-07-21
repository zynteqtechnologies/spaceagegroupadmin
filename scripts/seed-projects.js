const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const databaseUrl = 'libsql://spaceagegroup-zahid5104.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODQxODU0MDIsImlkIjoiMDE5ZjY5YmMtNTAwMS03MDZmLWJlMjUtYmI0ZmMxYWFmMzkwIiwia2lkIjoidG9BV3laX01HejBmQTBKV2t5bjBrOTJKSU5EWXg5eUVsNnhPM2kwcXgyOCIsInJpZCI6ImNmZDNjZGNhLWU1NzUtNDBiZS05NmU2LTg5MjBlMTM2ZjE5MyJ9.a9leNYDFEUVPDOv8Jj6VirGnP7bu1zkcbXD8ZGJsA4mzaYAYYld44NpYtjZZdztw6InrVT8_59n0AMX4Y0AnCg';

const client = createClient({
  url: databaseUrl,
  authToken: authToken,
});

async function seed() {
  console.log('Seeding 2 detailed Projects with BOTH Common & Commercial Specifications into Turso DB...');
  const now = new Date().toISOString();

  // 1. Burhani Plaza (Commercial & Retail)
  const p1Slug = 'burhani-plaza';
  const p1Data = {
    id: crypto.randomUUID(),
    title: 'Burhani Plaza',
    slug: p1Slug,
    status: 'ongoing',
    category: 'Commercial & Retail',
    headline: 'Premium Commercial Showrooms & Modern Office Suites on Ajwa Road',
    shortIntro: 'Burhani Plaza is a state-of-the-art commercial complex offering high-visibility retail showrooms and modern corporate office suites designed to elevate businesses in Vadodara.',
    address: 'Main Ajwa Road, Sayajipura, Vadodara, Gujarat 390019',
    est_year: '2025',
    featured: 1,
    area: '1.8 Acres',
    units: 76,
    hero_images: JSON.stringify([
      {
        url: 'https://spaceage-userside.vercel.app/images/Burhani-plaza.png',
        title: 'Exterior Front View',
        isMainImage: true,
        mediaType: 'image'
      },
      {
        url: 'https://spaceage-userside.vercel.app/images/img1.jpg',
        title: 'Commercial Complex Night Elevation',
        isMainImage: false,
        mediaType: 'image'
      }
    ]),
    floor_plans: JSON.stringify([
      {
        title: 'Ground Floor Commercial Layout Plan',
        url: 'https://spaceage-userside.vercel.app/images/FP-1.png',
        mediaType: 'image'
      },
      {
        title: 'First & Second Floor Office Suites Layout',
        url: 'https://spaceage-userside.vercel.app/images/FP-2.png',
        mediaType: 'image'
      }
    ]),
    layout_plan: JSON.stringify({
      title: 'Master Commercial Site Layout',
      url: 'https://spaceage-userside.vercel.app/images/Fplan-1.png',
      mediaType: 'image'
    }),
    common_specifications: JSON.stringify([
      { label: 'Structure', value: 'Earthquake resistant heavy-duty RCC frame structure designed according to IS code specifications.', category: 'Structure', detail: 'Earthquake resistant heavy-duty RCC frame structure designed according to IS code specifications.' },
      { label: 'Flooring & Finishes', value: 'High-gloss 800x800mm premium vitrified tiles in all showrooms, office suites, and public corridors.', category: 'Flooring & Finishes', detail: 'High-gloss 800x800mm premium vitrified tiles in all showrooms, office suites, and public corridors.' },
      { label: 'Electrical System', value: 'Concealed copper wiring with modular switches, DB box, and dedicated 3-phase power supply per unit.', category: 'Electrical System', detail: 'Concealed copper wiring with modular switches, DB box, and dedicated 3-phase power supply per unit.' },
      { label: 'Plumbing & Sanitation', value: 'Concealed CPVC/UPVC piping with premium Jaquar/Hindware sanitary ware and CP fittings.', category: 'Plumbing & Sanitation', detail: 'Concealed CPVC/UPVC piping with premium Jaquar/Hindware sanitary ware and CP fittings.' },
      { label: 'Doors & Windows', value: 'Anodized aluminum sliding windows with toughened glass and decorative main entrance glass doors.', category: 'Doors & Windows', detail: 'Anodized aluminum sliding windows with toughened glass and decorative main entrance glass doors.' }
    ]),
    commercial_specifications: JSON.stringify([
      { label: 'Elevators & Lifts', value: '2 High-speed automatic passenger elevators and 1 heavy-duty stretcher/goods lift with ARD system.', category: 'Elevators & Lifts', detail: '2 High-speed automatic passenger elevators and 1 heavy-duty stretcher/goods lift with ARD system.' },
      { label: 'Security & CCTV', value: '24/7 CCTV surveillance in all corridors, parking lots, and entry points with central security hub.', category: 'Security & CCTV', detail: '24/7 CCTV surveillance in all corridors, parking lots, and entry points with central security hub.' },
      { label: 'Power Backup', value: '100% DG power backup for common areas, elevators, water pumps, and essential commercial lighting.', category: 'Power Backup', detail: '100% DG power backup for common areas, elevators, water pumps, and essential commercial lighting.' },
      { label: 'Fire Safety Network', value: 'Advanced fire sprinkler network, smoke detectors, hose reels, and underground fire water storage tanks.', category: 'Fire Safety Network', detail: 'Advanced fire sprinkler network, smoke detectors, hose reels, and underground fire water storage tanks.' },
      { label: 'Commercial Parking', value: 'Multi-level basement parking with automated boom barrier access and dedicated visitor parking spots.', category: 'Commercial Parking', detail: 'Multi-level basement parking with automated boom barrier access and dedicated visitor parking spots.' }
    ]),
    amenities: JSON.stringify([
      { name: 'High-Speed Elevators', title: 'High-Speed Elevators', icon: '🏢', category: 'Convenience' },
      { name: '24/7 Security & CCTV', title: '24/7 Security & CCTV', icon: '🛡️', category: 'Safety' },
      { name: 'Ample Basement Parking', title: 'Ample Basement Parking', icon: '🅿️', category: 'Convenience' },
      { name: '100% Power Backup', title: '100% Power Backup', icon: '⚡', category: 'Convenience' },
      { name: 'Fire Fighting System', title: 'Fire Fighting System', icon: '🧯', category: 'Safety' }
    ]),
    sample_house_photos: JSON.stringify([
      { url: 'https://spaceage-userside.vercel.app/images/img1.jpg', title: 'Sample Corporate Office Interior', mediaType: 'image' },
      { url: 'https://spaceage-userside.vercel.app/images/img2.jpg', title: 'Retail Showroom Display Setup', mediaType: 'image' }
    ]),
    brochure: JSON.stringify({
      title: 'Burhani Plaza Official Commercial Brochure',
      url: 'https://spaceage-userside.vercel.app/images/Burhani-plaza.png',
      mediaType: 'image'
    }),
    virtual_tour: JSON.stringify({
      title: '3D Virtual Walkthrough Tour',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: '3D Model'
    }),
    created_at: now,
    updated_at: now
  };

  await client.execute({ sql: 'DELETE FROM projects WHERE slug = ?', args: [p1Slug] });
  await client.execute({
    sql: `INSERT INTO projects (
      id, title, slug, status, category, headline, short_intro, address, est_year, featured, area, units,
      hero_images, floor_plans, layout_plan, common_specifications, commercial_specifications, amenities,
      sample_house_photos, brochure, virtual_tour, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: Object.values(p1Data)
  });
  console.log('✔ Inserted Project: Burhani Plaza (with Common & Commercial Specs)');

  // 2. Taj Burhani Residency (Residential Luxury)
  const p2Slug = 'taj-burhani-residency';
  const p2Data = {
    id: crypto.randomUUID(),
    title: 'Taj Burhani Residency',
    slug: p2Slug,
    status: 'upcoming',
    category: 'Residential Luxury',
    headline: 'Spacious 3 & 4 BHK Luxury Living Apartments & Sky Penthouses',
    shortIntro: 'Taj Burhani Residency brings ultra-luxurious living with manicured landscape gardens, infinity clubhouse, rooftop gazebo, and panoramic city views crafted for elite families.',
    address: 'VIP Road, Karelibaug, Vadodara, Gujarat 390018',
    est_year: '2026',
    featured: 1,
    area: '2.5 Acres',
    units: 112,
    hero_images: JSON.stringify([
      {
        url: 'https://spaceage-userside.vercel.app/images/TajBurhani.png',
        title: 'Main Architectural Elevation',
        isMainImage: true,
        mediaType: 'image'
      },
      {
        url: 'https://spaceage-userside.vercel.app/images/Hero2.jpg',
        title: 'Podium Garden & Clubhouse Aerial View',
        isMainImage: false,
        mediaType: 'image'
      }
    ]),
    floor_plans: JSON.stringify([
      {
        title: '3 BHK Premium Residence Floor Plan',
        url: 'https://spaceage-userside.vercel.app/images/FP-3.png',
        mediaType: 'image'
      },
      {
        title: '4 BHK Luxury Penthouse Layout',
        url: 'https://spaceage-userside.vercel.app/images/Fplan-1.png',
        mediaType: 'image'
      }
    ]),
    layout_plan: JSON.stringify({
      title: 'Podium & Landscape Master Layout Plan',
      url: 'https://spaceage-userside.vercel.app/images/FP-1.png',
      mediaType: 'image'
    }),
    common_specifications: JSON.stringify([
      { label: 'Structure & Masonry', value: 'Seismic Zone-III compliant RCC frame structure with sound-insulated AAC block masonry walls.', category: 'Structure & Masonry', detail: 'Seismic Zone-III compliant RCC frame structure with sound-insulated AAC block masonry walls.' },
      { label: 'Flooring Finishes', value: 'Italian marble finish vitrified tiles in living/dining areas, anti-skid wooden tiles in master bedrooms.', category: 'Flooring Finishes', detail: 'Italian marble finish vitrified tiles in living/dining areas, anti-skid wooden tiles in master bedrooms.' },
      { label: 'Kitchen & Utility', value: 'Granite platform with stainless steel double bowl sink, chimney provision, and piped natural gas connection.', category: 'Kitchen & Utility', detail: 'Granite platform with stainless steel double bowl sink, chimney provision, and piped natural gas connection.' },
      { label: 'Doors & Windows', value: 'Teakwood main door with smart digital lock (fingerprint/PIN); heavy UPVC soundproof sliding windows.', category: 'Doors & Windows', detail: 'Teakwood main door with smart digital lock (fingerprint/PIN); heavy UPVC soundproof sliding windows.' },
      { label: 'Plumbing & Bathrooms', value: 'Kohler / Grohe wall-hung sanitary ware, thermostatic diverters, and glass shower partition in master bath.', category: 'Plumbing & Bathrooms', detail: 'Kohler / Grohe wall-hung sanitary ware, thermostatic diverters, and glass shower partition in master bath.' }
    ]),
    commercial_specifications: JSON.stringify([
      { label: 'Elevators & Entrance Foyer', value: 'High-speed Schindler automatic elevators with biometric access & air-conditioned double-height entrance lobby.', category: 'Elevators & Entrance Foyer', detail: 'High-speed Schindler automatic elevators with biometric access & air-conditioned double-height entrance lobby.' },
      { label: 'Smart Home Automation', value: 'Video door phone connected to main security gate, smart light switches in living area, and Wi-Fi router points.', category: 'Smart Home Automation', detail: 'Video door phone connected to main security gate, smart light switches in living area, and Wi-Fi router points.' },
      { label: 'EV Charging Setup', value: 'Dedicated EV charging points allocated at each apartment parking slot and visitor parking zones.', category: 'EV Charging Setup', detail: 'Dedicated EV charging points allocated at each apartment parking slot and visitor parking zones.' },
      { label: 'Solar & Sustainability', value: 'Solar PV panel system for common area lighting, rooftop rainwater harvesting, and organic waste composter.', category: 'Solar & Sustainability', detail: 'Solar PV panel system for common area lighting, rooftop rainwater harvesting, and organic waste composter.' },
      { label: 'Clubhouse Amenities', value: 'Temperature-controlled indoor swimming pool, multi-purpose banquet hall, and modern fitness gymnasium.', category: 'Clubhouse Amenities', detail: 'Temperature-controlled indoor swimming pool, multi-purpose banquet hall, and modern fitness gymnasium.' }
    ]),
    amenities: JSON.stringify([
      { name: 'Gymnasium', title: 'Gymnasium', icon: '🏋️', category: 'Wellness' },
      { name: 'Swimming Pool', title: 'Swimming Pool', icon: '🏊', category: 'Sports' },
      { name: 'Landscaped Garden', title: 'Landscaped Garden', icon: '🌳', category: 'Green' },
      { name: 'Children Play Area', title: 'Children Play Area', icon: '🛝', category: 'Kids' },
      { name: '24x7 Security', title: '24x7 Security', icon: '🛡️', category: 'Safety' }
    ]),
    sample_house_photos: JSON.stringify([
      { url: 'https://spaceage-userside.vercel.app/images/img3.jpg', title: 'Sample Flat Living & Dining Room', mediaType: 'image' },
      { url: 'https://spaceage-userside.vercel.app/images/Hero2.jpg', title: 'Master Bedroom Suite Preview', mediaType: 'image' }
    ]),
    brochure: JSON.stringify({
      title: 'Taj Burhani Residency Luxury E-Brochure',
      url: 'https://spaceage-userside.vercel.app/images/TajBurhani.png',
      mediaType: 'image'
    }),
    virtual_tour: JSON.stringify({
      title: 'Sample Flat 360 Video Tour',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'Video'
    }),
    created_at: now,
    updated_at: now
  };

  await client.execute({ sql: 'DELETE FROM projects WHERE slug = ?', args: [p2Slug] });
  await client.execute({
    sql: `INSERT INTO projects (
      id, title, slug, status, category, headline, short_intro, address, est_year, featured, area, units,
      hero_images, floor_plans, layout_plan, common_specifications, commercial_specifications, amenities,
      sample_house_photos, brochure, virtual_tour, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: Object.values(p2Data)
  });
  console.log('✔ Inserted Project: Taj Burhani Residency (with Common & Commercial Specs)');

  console.log('✨ Both properties populated with complete specifications!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding projects:', err);
  process.exit(1);
});
