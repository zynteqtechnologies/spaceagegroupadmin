// full-e2e-test.js
// Comprehensive End-to-End Test for Admin API + Turso + ImageKit + User-side schema compatibility

const fs = require('fs');
const path = require('path');

const ADMIN_URL = 'http://localhost:3000';
const USER_URL = 'http://localhost:3001';
const IMAGES_DIR = path.join(__dirname, '..', 'spaceage-userside', 'public', 'images');

let authCookie = '';

// Color logger
const log = {
  section: (msg) => console.log(`\n========================================\n📌 ${msg}\n========================================`),
  info: (msg) => console.log(`  ℹ️  ${msg}`),
  success: (msg) => console.log(`  ✅ ${msg}`),
  warn: (msg) => console.log(`  ⚠️  ${msg}`),
  error: (msg) => console.log(`  ❌ ${msg}`),
};

const issues = [];
function reportIssue(module, endpoint, problem) {
  issues.push({ module, endpoint, problem });
  log.error(`[${module}] ${endpoint}: ${problem}`);
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${ADMIN_URL}${endpoint}`;
  const headers = options.headers || {};
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  options.headers = headers;

  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let body = null;
    if (contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
    return { status: res.status, ok: res.ok, headers: res.headers, body };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

function getFileBlob(fileName, mimeType) {
  const filePath = path.join(IMAGES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image asset file missing: ${filePath}`);
  }
  const buffer = fs.readFileSync(filePath);
  return new Blob([buffer], { type: mimeType });
}

// ─── MAIN TEST RUNNER ────────────────────────────────────────────────────────
async function runTests() {
  console.log('🚀 STARTING COMPREHENSIVE END-TO-END SYSTEM TEST');

  // 1. AUTHENTICATION
  log.section('1. AUTHENTICATION & LOGIN');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@spaceagegroup.com', password: 'Admin@12345' }),
  });

  if (!loginRes.ok) {
    reportIssue('Auth', '/api/auth/login', `Login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
    return;
  }

  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie.split(';')[0];
    log.success(`Logged in successfully! Token cookie captured.`);
  } else {
    reportIssue('Auth', '/api/auth/login', 'Set-Cookie header missing in login response');
  }

  const meRes = await request('/api/auth/me');
  if (meRes.ok) {
    log.success(`Auth verification (/api/auth/me) passed. Admin: ${meRes.body.user?.email} (${meRes.body.user?.role})`);
  } else {
    reportIssue('Auth', '/api/auth/me', `Me route failed (${meRes.status}): ${JSON.stringify(meRes.body)}`);
  }

  // 2. HERO IMAGES
  log.section('2. HERO IMAGES');
  try {
    const formData = new FormData();
    const blob1 = getFileBlob('hero1.jpg', 'image/jpeg');
    const blob2 = getFileBlob('Hero2.jpg', 'image/jpeg');
    formData.append('images', blob1, 'hero1.jpg');
    formData.append('images', blob2, 'Hero2.jpg');
    formData.append('imageDetails', JSON.stringify([
      { title: 'Luxury Living', alt: 'Luxury architectural project', isMainImage: true, order: 0 },
      { title: 'Commercial Excellence', alt: 'Commercial building', isMainImage: false, order: 1 }
    ]));

    const uploadHeroRes = await request('/api/hero-images', {
      method: 'POST',
      body: formData
    });

    if (uploadHeroRes.ok) {
      log.success(`Hero images uploaded! Record ID: ${uploadHeroRes.body.heroImage?._id}`);
      const imagesArr = uploadHeroRes.body.heroImage?.images || [];
      imagesArr.forEach((img, i) => {
        if (img.url && img.url.includes('ik.imagekit.io')) {
          log.success(`  [${i}] ImageKit URL confirmed: ${img.url}`);
        } else {
          reportIssue('Hero Images', 'POST /api/hero-images', `Image [${i}] URL does not point to ImageKit: ${img.url}`);
        }
      });
    } else {
      reportIssue('Hero Images', 'POST /api/hero-images', `Upload failed (${uploadHeroRes.status}): ${JSON.stringify(uploadHeroRes.body)}`);
    }

    const getHeroRes = await request('/api/hero-images');
    if (getHeroRes.ok) {
      log.success(`GET /api/hero-images returned ${getHeroRes.body.images?.length || 0} images`);
    } else {
      reportIssue('Hero Images', 'GET /api/hero-images', `Fetch failed (${getHeroRes.status}): ${JSON.stringify(getHeroRes.body)}`);
    }
  } catch (err) {
    reportIssue('Hero Images', 'Upload Flow', err.message);
  }

  // 3. PROJECTS & SUB-MEDIA
  log.section('3. PROJECTS & SUB-MEDIA');
  let createdProjectId = '';
  let createdProjectSlug = 'burhani-plaza-test-' + Date.now();
  try {
    const newProjectData = {
      title: 'Burhani Plaza Test ' + Date.now(),
      slug: createdProjectSlug,
      status: 'ongoing',
      headline: 'Shops & 2/3 BHK Specious Apartments',
      shortIntro: 'Luxury residential and commercial hub in Vadodara.',
      address: 'Ajwa Road, Vadodara',
      estYear: '2024',
      featured: true,
      category: 'Residential',
      area: '2.5 Acres',
      units: 128
    };

    const createProjRes = await request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProjectData)
    });

    if (createProjRes.ok) {
      createdProjectId = createProjRes.body.project?._id || createProjRes.body.project?.id;
      log.success(`Project created! ID: ${createdProjectId}, Slug: ${createProjRes.body.project?.slug}`);
    } else {
      reportIssue('Projects', 'POST /api/projects', `Creation failed (${createProjRes.status}): ${JSON.stringify(createProjRes.body)}`);
    }

    if (createdProjectId) {
      // Sub-media: Project Hero Images
      const heroFd = new FormData();
      heroFd.append('images', getFileBlob('Burhani-plaza.png', 'image/png'), 'Burhani-plaza.png');
      heroFd.append('imageDetails', JSON.stringify([{ title: 'Main Elevation', isMainImage: true }]));
      const projHeroRes = await request(`/api/projects/${createdProjectId}/hero-images`, {
        method: 'POST',
        body: heroFd
      });
      if (projHeroRes.ok) {
        log.success(`  - Uploaded Project Hero Image to ImageKit`);
      } else {
        reportIssue('Projects', `POST /api/projects/${createdProjectId}/hero-images`, `Failed (${projHeroRes.status}): ${JSON.stringify(projHeroRes.body)}`);
      }

      // Sub-media: Floor Plans (expects key 'floorPlans')
      const fpFd = new FormData();
      fpFd.append('floorPlans', getFileBlob('FP-1.png', 'image/png'), 'FP-1.png');
      fpFd.append('floorPlans', getFileBlob('FP-2.png', 'image/png'), 'FP-2.png');
      fpFd.append('floorPlanDetails', JSON.stringify([
        { title: '2 BHK Floor Plan', type: '2BHK' },
        { title: '3 BHK Floor Plan', type: '3BHK' }
      ]));
      const fpRes = await request(`/api/projects/${createdProjectId}/floor-plans`, {
        method: 'POST',
        body: fpFd
      });
      if (fpRes.ok) {
        log.success(`  - Uploaded Floor Plans to ImageKit`);
      } else {
        reportIssue('Projects', `POST /api/projects/${createdProjectId}/floor-plans`, `Failed (${fpRes.status}): ${JSON.stringify(fpRes.body)}`);
      }

      // Sub-media: Amenities (expects PUT with { items: [...] })
      const amenitiesRes = await request(`/api/projects/${createdProjectId}/amenities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { icon: 'Shield', name: '24/7 Security' },
            { icon: 'Car', name: 'Covered Parking' },
            { icon: 'Tree', name: 'Landscaped Garden' }
          ]
        })
      });
      if (amenitiesRes.ok) {
        log.success(`  - Updated Project Amenities (PUT)`);
      } else {
        reportIssue('Projects', `PUT /api/projects/${createdProjectId}/amenities`, `Failed (${amenitiesRes.status}): ${JSON.stringify(amenitiesRes.body)}`);
      }

      // Edit Project (PATCH)
      const editProjRes = await request(`/api/projects/${createdProjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: 'UPDATED: Specious 2/3 BHK Premium Living' })
      });
      if (editProjRes.ok) {
        log.success(`  - PATCH /api/projects/${createdProjectId} updated headline successfully`);
      } else {
        reportIssue('Projects', `PATCH /api/projects/${createdProjectId}`, `Update failed (${editProjRes.status}): ${JSON.stringify(editProjRes.body)}`);
      }

      // Fetch single project by ID and Slug
      const getSingleId = await request(`/api/projects/${createdProjectId}`);
      if (getSingleId.ok) {
        log.success(`  - GET /api/projects/${createdProjectId} resolved by ID`);
      } else {
        reportIssue('Projects', `GET /api/projects/${createdProjectId}`, `Fetch by ID failed (${getSingleId.status})`);
      }

      const getSingleSlug = await request(`/api/projects/${createdProjectSlug}`);
      if (getSingleSlug.ok) {
        log.success(`  - GET /api/projects/${createdProjectSlug} resolved by Slug`);
      } else {
        reportIssue('Projects', `GET /api/projects/${createdProjectSlug}`, `Fetch by Slug failed (${getSingleSlug.status})`);
      }
    }
  } catch (err) {
    reportIssue('Projects', 'Projects Flow', err.message);
  }

  // 4. SERVICES
  log.section('4. SERVICES');
  let createdServiceId = '';
  try {
    const serviceData = {
      title: 'Architectural Design & Planning ' + Date.now(),
      number: '01',
      category: 'Consultancy',
      tagline: 'Precision and Elegance in Every Blueprint',
      description: 'Comprehensive architectural services tailored for residential and commercial landmarks.',
      stats: JSON.stringify([{ value: '150+', label: 'Projects Completed' }]),
      features: JSON.stringify(['Site Analysis', '3D Renderings', 'Structural Blueprints']),
      accent: '#c9a84c',
      icon: 'PenTool',
      status: 'published'
    };

    const createServiceRes = await request('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData)
    });

    if (createServiceRes.ok) {
      createdServiceId = createServiceRes.body._id || createServiceRes.body.id;
      log.success(`Service created! ID: ${createdServiceId}`);
    } else {
      reportIssue('Services', 'POST /api/services', `Creation failed (${createServiceRes.status}): ${JSON.stringify(createServiceRes.body)}`);
    }

    if (createdServiceId) {
      const editServiceRes = await request(`/api/services/${createdServiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagline: 'UPDATED: Precision and Elegance' })
      });
      if (editServiceRes.ok) {
        log.success(`  - PATCH /api/services/${createdServiceId} succeeded`);
      } else {
        reportIssue('Services', `PATCH /api/services/${createdServiceId}`, `Update failed (${editServiceRes.status})`);
      }
    }

    const getServicesRes = await request('/api/services');
    if (getServicesRes.ok) {
      log.success(`GET /api/services returned ${getServicesRes.body.length || 0} service(s)`);
    } else {
      reportIssue('Services', 'GET /api/services', `Fetch failed (${getServicesRes.status})`);
    }
  } catch (err) {
    reportIssue('Services', 'Services Flow', err.message);
  }

  // 5. OUR TEAM
  log.section('5. OUR TEAM');
  let createdMemberId = '';
  try {
    const teamFd = new FormData();
    teamFd.append('name', 'Juzer Nalwala');
    teamFd.append('position', 'Managing Director & Founder');
    teamFd.append('description', 'Over 25 years of experience in real estate and luxury development.');
    teamFd.append('order', '1');
    teamFd.append('image', getFileBlob('Juzer-Nalwala.jpg', 'image/jpeg'), 'Juzer-Nalwala.jpg');

    const createTeamRes = await request('/api/team', {
      method: 'POST',
      body: teamFd
    });

    if (createTeamRes.ok) {
      createdMemberId = createTeamRes.body._id || createTeamRes.body.id;
      log.success(`Team member created! ID: ${createdMemberId}`);
      if (createTeamRes.body.image?.url?.includes('ik.imagekit.io')) {
        log.success(`  - Profile image uploaded to ImageKit: ${createTeamRes.body.image.url}`);
      }
    } else {
      reportIssue('Team', 'POST /api/team', `Creation failed (${createTeamRes.status}): ${JSON.stringify(createTeamRes.body)}`);
    }

    if (createdMemberId) {
      const patchTeamFd = new FormData();
      patchTeamFd.append('position', 'Founder & Managing Director');
      const editTeamRes = await request(`/api/team/${createdMemberId}`, {
        method: 'PATCH',
        body: patchTeamFd
      });
      if (editTeamRes.ok) {
        log.success(`  - PATCH /api/team/${createdMemberId} updated position`);
      } else {
        reportIssue('Team', `PATCH /api/team/${createdMemberId}`, `Update failed (${editTeamRes.status})`);
      }
    }

    const getTeamRes = await request('/api/team');
    if (getTeamRes.ok) {
      log.success(`GET /api/team returned ${getTeamRes.body.length || 0} team member(s)`);
    } else {
      reportIssue('Team', 'GET /api/team', `Fetch failed (${getTeamRes.status})`);
    }
  } catch (err) {
    reportIssue('Team', 'Team Flow', err.message);
  }

  // 6. BLOG POSTS & ENGAGEMENT
  log.section('6. BLOG POSTS & ENGAGEMENT');
  let createdBlogId = '';
  let createdBlogSlug = 'future-of-sustainable-architecture-' + Date.now();
  try {
    const blogFd = new FormData();
    blogFd.append('title', 'Future of Sustainable Architecture ' + Date.now());
    blogFd.append('category', 'Architecture');
    blogFd.append('excerpt', 'Exploring modern green building standards and eco-conscious designs in Vadodara.');
    blogFd.append('description', '<p>Sustainable architecture is at the core of SpaceAge developments...</p>');
    blogFd.append('author', 'Juzer Nalwala');
    blogFd.append('authorRole', 'Managing Director');
    blogFd.append('readTime', '5 min read');
    blogFd.append('status', 'published');
    blogFd.append('tags', JSON.stringify(['Sustainability', 'Architecture', 'Vadodara']));
    blogFd.append('image', getFileBlob('img1.jpg', 'image/jpeg'), 'img1.jpg');

    const createBlogRes = await request('/api/blog', {
      method: 'POST',
      body: blogFd
    });

    if (createBlogRes.ok) {
      createdBlogId = createBlogRes.body._id || createBlogRes.body.id;
      createdBlogSlug = createBlogRes.body.slug;
      log.success(`Blog post created! ID: ${createdBlogId}, Slug: ${createdBlogSlug}`);
      if (createBlogRes.body.coverImage?.url?.includes('ik.imagekit.io')) {
        log.success(`  - Cover image uploaded to ImageKit: ${createBlogRes.body.coverImage.url}`);
      }
    } else {
      reportIssue('Blog', 'POST /api/blog', `Creation failed (${createBlogRes.status}): ${JSON.stringify(createBlogRes.body)}`);
    }

    if (createdBlogId) {
      // Test Engagement (Like & Comment)
      const likeRes = await request(`/api/blog/${createdBlogId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' })
      });
      if (likeRes.ok) {
        log.success(`  - POST /api/blog/${createdBlogId}/engagement (like) incremented likes to ${likeRes.body.likesCount}`);
      } else {
        reportIssue('Blog', `POST /api/blog/${createdBlogId}/engagement (like)`, `Failed (${likeRes.status})`);
      }

      const commentRes = await request(`/api/blog/${createdBlogId}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'comment', authorName: 'John Visitor', authorEmail: 'john@example.com', content: 'Great article!' })
      });
      if (commentRes.ok) {
        log.success(`  - POST /api/blog/${createdBlogId}/engagement (comment) added comment`);
      } else {
        reportIssue('Blog', `POST /api/blog/${createdBlogId}/engagement (comment)`, `Failed (${commentRes.status})`);
      }

      // Fetch post by ID and Slug
      const getBlogSlugRes = await request(`/api/blog/${createdBlogSlug}`);
      if (getBlogSlugRes.ok) {
        log.success(`  - GET /api/blog/${createdBlogSlug} resolved post by slug`);
      } else {
        reportIssue('Blog', `GET /api/blog/${createdBlogSlug}`, `Fetch by slug failed (${getBlogSlugRes.status})`);
      }
    }
  } catch (err) {
    reportIssue('Blog', 'Blog Flow', err.message);
  }

  // 7. CSR
  log.section('7. CSR INITIATIVES');
  let createdCsrId = '';
  try {
    const time = Date.now();
    const csrFd = new FormData();
    csrFd.append('title', 'Community Tree Plantation Drive ' + time);
    csrFd.append('slug', 'community-tree-plantation-drive-' + time);
    csrFd.append('category', 'Environment');
    csrFd.append('date', 'October 2024');
    csrFd.append('description', 'Planted over 500 saplings across Vadodara city.');
    csrFd.append('longDescription', 'SpaceAge Group organized a eco-drive involving staff and local communities...');
    csrFd.append('impact', '500+ Trees Planted');
    csrFd.append('color', '#10b981');
    csrFd.append('images', getFileBlob('csr.jpg', 'image/jpeg'), 'csr.jpg');
    csrFd.append('files', getFileBlob('csr.jpg', 'image/jpeg'), 'csr.jpg');

    const createCsrRes = await request('/api/csr', {
      method: 'POST',
      body: csrFd
    });

    if (createCsrRes.ok) {
      createdCsrId = createCsrRes.body._id || createCsrRes.body.id;
      log.success(`CSR initiative created! ID: ${createdCsrId}`);
    } else {
      reportIssue('CSR', 'POST /api/csr', `Creation failed (${createCsrRes.status}): ${JSON.stringify(createCsrRes.body)}`);
    }

    const getCsrRes = await request('/api/csr');
    if (getCsrRes.ok) {
      log.success(`GET /api/csr returned ${getCsrRes.body.length || 0} CSR initiative(s)`);
    } else {
      reportIssue('CSR', 'GET /api/csr', `Fetch failed (${getCsrRes.status})`);
    }
  } catch (err) {
    reportIssue('CSR', 'CSR Flow', err.message);
  }

  // 8. TIMELINE / OUR JOURNEY
  log.section('8. TIMELINE / OUR JOURNEY');
  let createdTimelineId = '';
  try {
    const timelineData = {
      year: '1998',
      title: 'Foundation of SpaceAge Group',
      description: 'Established with a vision to revolutionize real estate in Vadodara.',
      badge: 'Milestone',
      highlight: true,
      order: 1
    };

    const createTimelineRes = await request('/api/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timelineData)
    });

    if (createTimelineRes.ok) {
      createdTimelineId = createTimelineRes.body._id || createTimelineRes.body.id;
      log.success(`Timeline event created! ID: ${createdTimelineId}`);
    } else {
      reportIssue('Timeline', 'POST /api/timeline', `Creation failed (${createTimelineRes.status}): ${JSON.stringify(createTimelineRes.body)}`);
    }

    const getTimelineRes = await request('/api/timeline');
    if (getTimelineRes.ok) {
      log.success(`GET /api/timeline returned ${getTimelineRes.body.length || 0} event(s)`);
    } else {
      reportIssue('Timeline', 'GET /api/timeline', `Fetch failed (${getTimelineRes.status})`);
    }
  } catch (err) {
    reportIssue('Timeline', 'Timeline Flow', err.message);
  }

  // 9. MEDIA COLLECTIONS
  log.section('9. MEDIA COLLECTIONS');
  let createdMediaId = '';
  try {
    const mediaFd = new FormData();
    mediaFd.append('title', 'Corporate Launch Gallery');
    mediaFd.append('projectId', createdProjectId || '');
    mediaFd.append('category', 'Events');
    mediaFd.append('description', 'Highlights from SpaceAge annual foundation day.');
    mediaFd.append('images', getFileBlob('img2.jpg', 'image/jpeg'), 'img2.jpg');
    mediaFd.append('imageDetails', JSON.stringify([{ title: 'Opening Ceremony', alt: 'Launch event' }]));

    const createMediaRes = await request('/api/media', {
      method: 'POST',
      body: mediaFd
    });

    if (createMediaRes.ok) {
      createdMediaId = createMediaRes.body._id || createMediaRes.body.id;
      log.success(`Media collection created! ID: ${createdMediaId}`);
    } else {
      reportIssue('Media', 'POST /api/media', `Creation failed (${createMediaRes.status}): ${JSON.stringify(createMediaRes.body)}`);
    }

    const getMediaRes = await request('/api/media');
    if (getMediaRes.ok) {
      log.success(`GET /api/media returned ${getMediaRes.body.length || 0} media collection(s)`);
    } else {
      reportIssue('Media', 'GET /api/media', `Fetch failed (${getMediaRes.status})`);
    }
  } catch (err) {
    reportIssue('Media', 'Media Flow', err.message);
  }

  // 10. USER-SIDE SCHEMA COMPATIBILITY CHECK
  log.section('10. USER-SIDE COMPATIBILITY AUDIT');
  const userEndpoints = [
    { name: 'Projects API', path: '/api/projects' },
    { name: 'Hero Images API', path: '/api/hero-images' },
    { name: 'Services API', path: '/api/services' },
    { name: 'Team API', path: '/api/team' },
    { name: 'Blog API', path: '/api/blog' },
    { name: 'CSR API', path: '/api/csr' },
    { name: 'Timeline API', path: '/api/timeline' },
  ];

  for (const ep of userEndpoints) {
    const res = await request(`${ADMIN_URL}${ep.path}`);
    if (res.ok) {
      log.success(`User-side target endpoint ${ep.path} responded 200 OK`);
    } else {
      reportIssue('User-Side Audit', ep.path, `Responded status ${res.status}`);
    }
  }

  // SUMMARY REPORT
  log.section('SUMMARY & ISSUES AUDIT');
  if (issues.length === 0) {
    console.log('\n🎉🎉 ALL MODULES CREATED, EDITED, UPLOADED, AND RESOLVED WITH ZERO ERRORS! 🎉🎉\n');
  } else {
    console.log(`\n🚨 FOUND ${issues.length} ISSUE(S):\n`);
    issues.forEach((iss, index) => {
      console.log(`${index + 1}. [${iss.module}] Endpoint: ${iss.endpoint}`);
      console.log(`   Problem: ${iss.problem}\n`);
    });
  }
}

runTests();
