import image_1 from '../assets/images/advantage_1.png';
import image_2 from '../assets/images/advantage_2.png';
import image_3 from '../assets/images/advantage_3.png';
import image_4 from '../assets/images/advantage_4.png';
import image_5 from '../assets/images/welcome_image_1.png';
import image_6 from '../assets/images/welcome_image_2.png';
import image_7 from '../assets/images/welcome_image_3.png';
import image_8 from '../assets/images/image_5.png';

const GALLERY_STORAGE_KEY = 'ghra_media_gallery';
const ARTICLES_STORAGE_KEY = 'ghra_media_articles';
const EVENT_NAME = 'ghra_media_updated';

export const GALLERY_CATEGORIES = [
  { key: 'all', label: 'All Moments' },
  { key: 'academics', label: 'Academics & Labs' },
  { key: 'early-years', label: 'Early Years' },
  { key: 'sports', label: 'Sports & Play' },
  { key: 'events', label: 'Events & Arts' },
  { key: 'faculty', label: 'Faculty & Mentorship' },
  { key: 'facilities', label: 'Campus Facilities' },
];

export const ARTICLE_CATEGORIES = [
  { key: 'all', label: 'All Updates' },
  { key: 'press', label: 'Press Releases', tag: 'Press Release' },
  { key: 'newsletter', label: 'School Gazettes', tag: 'School Gazette' },
  { key: 'announcement', label: 'Official Notices', tag: 'Official Notice' },
  { key: 'spotlight', label: 'Student Spotlights', tag: 'Student Spotlight' },
];

export const DEFAULT_GALLERY_ITEMS = [
  { 
    id: 1, 
    src: image_1, 
    category: 'academics', 
    title: 'Interactive Science Session', 
    caption: 'Hands-on practical exploration in our modern science lab',
    date: 'February 2025',
    isDefault: true
  },
  { 
    id: 2, 
    src: image_2, 
    category: 'faculty', 
    title: 'Specialized Classroom Mentorship', 
    caption: 'Individualized attention from qualified subject instructors',
    date: 'January 2025',
    isDefault: true
  },
  { 
    id: 3, 
    src: image_3, 
    category: 'academics', 
    title: 'Digital Literacy & Computer Lab', 
    caption: 'Building coding, ICT and digital research skills',
    date: 'January 2025',
    isDefault: true
  },
  { 
    id: 4, 
    src: image_4, 
    category: 'early-years', 
    title: 'Early Childhood Discovery', 
    caption: 'Play-based learning and cognitive foundation in Nursery',
    date: 'December 2024',
    isDefault: true
  },
  { 
    id: 5, 
    src: image_5, 
    category: 'sports', 
    title: 'Outdoor Athletics & Recreation', 
    caption: 'Physical fitness, teamwork and sportsmanship',
    date: 'December 2024',
    isDefault: true
  },
  { 
    id: 6, 
    src: image_6, 
    category: 'events', 
    title: 'Annual Cultural & Arts Celebration', 
    caption: 'Showcasing creativity, public speaking and talent',
    date: 'November 2024',
    isDefault: true
  },
  { 
    id: 7, 
    src: image_7, 
    category: 'academics', 
    title: 'Library & Quiet Study Space', 
    caption: 'Fostering lifelong reading habits and academic research',
    date: 'October 2024',
    isDefault: true
  },
  { 
    id: 8, 
    src: image_8, 
    category: 'events', 
    title: 'School Leadership Assembly', 
    caption: 'Cultivating discipline, public presentation and values',
    date: 'October 2024',
    isDefault: true
  },
];

export const DEFAULT_ARTICLES = [
  {
    id: 1,
    category: 'press',
    tag: 'Press Release',
    title: 'GHRA Records 100% University Admission Rate for Graduating Class',
    date: 'February 20, 2026',
    readTime: '3 min read',
    desc: 'Our graduating seniors have secured placements into prestigious federal, state, and international universities with numerous merit scholarships.',
    image: image_1,
    isDefault: true,
  },
  {
    id: 2,
    category: 'newsletter',
    tag: 'School Gazette',
    title: 'First Term Gazette: Academic Milestones, STEM Discoveries & Athletic Triumphs',
    date: 'January 15, 2026',
    readTime: '5 min read',
    desc: 'The complete review of Term 1 highlights, inter-house sports competitions, debate championships, and parent-teacher consultative outcomes.',
    image: image_2,
    isDefault: true,
  },
  {
    id: 3,
    category: 'announcement',
    tag: 'Official Notice',
    title: '2026/2027 Diagnostic Entrance Assessment Dates Announced',
    date: 'January 05, 2026',
    readTime: '2 min read',
    desc: 'Prospective candidates for Crèche, Nursery, Primary, and Junior/Senior Secondary are invited for scheduled evaluation sessions.',
    image: image_3,
    isDefault: true,
  },
  {
    id: 4,
    category: 'spotlight',
    tag: 'Student Spotlight',
    title: 'GHRA Robotics Team Wins Regional Science & Artificial Intelligence Olympiad',
    date: 'December 18, 2024',
    readTime: '4 min read',
    desc: 'Our JSS & SSS innovators constructed an autonomous solar-powered water filtration prototype awarded First Place overall.',
    image: image_4,
    isDefault: true,
  },
];

function notifySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

// ── GALLERY PICTURES CRUD ──────────────────────────────────────────

export function getMediaGallery() {
  try {
    const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_ITEMS));
      return DEFAULT_GALLERY_ITEMS;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : DEFAULT_GALLERY_ITEMS;
  } catch (error) {
    console.error('Error reading media gallery:', error);
    return DEFAULT_GALLERY_ITEMS;
  }
}

export function addMediaPicture(pictureData) {
  const current = getMediaGallery();
  const newItem = {
    id: Date.now(),
    src: pictureData.src || pictureData.image,
    category: pictureData.category || 'academics',
    title: pictureData.title || 'Untitled Moment',
    caption: pictureData.caption || '',
    date: pictureData.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    createdAt: new Date().toISOString(),
    isDefault: false,
    uploadedBy: pictureData.uploadedBy || 'Administrator',
  };

  const updated = [newItem, ...current];
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return newItem;
}

export function updateMediaPicture(id, updatedData) {
  const current = getMediaGallery();
  const updated = current.map(item => {
    if (item.id === id || String(item.id) === String(id)) {
      return {
        ...item,
        ...updatedData,
        src: updatedData.src || updatedData.image || item.src,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
}

export function deleteMediaPicture(id) {
  const current = getMediaGallery();
  const updated = current.filter(item => item.id !== id && String(item.id) !== String(id));
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
}

export function resetMediaGallery() {
  localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(DEFAULT_GALLERY_ITEMS));
  notifySubscribers();
  return DEFAULT_GALLERY_ITEMS;
}

// ── MEDIA ARTICLES CRUD ──────────────────────────────────────────

export function getMediaArticles() {
  try {
    const stored = localStorage.getItem(ARTICLES_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(DEFAULT_ARTICLES));
      return DEFAULT_ARTICLES;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : DEFAULT_ARTICLES;
  } catch (error) {
    console.error('Error reading media articles:', error);
    return DEFAULT_ARTICLES;
  }
}

export function addMediaArticle(articleData) {
  const current = getMediaArticles();
  const categoryConfig = ARTICLE_CATEGORIES.find(c => c.key === articleData.category) || { tag: 'Official Update' };
  
  const newItem = {
    id: Date.now(),
    category: articleData.category || 'announcement',
    tag: articleData.tag || categoryConfig.tag || 'Official Notice',
    title: articleData.title || 'New Announcement',
    date: articleData.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    readTime: articleData.readTime || '3 min read',
    desc: articleData.desc || '',
    image: articleData.image || image_1,
    createdAt: new Date().toISOString(),
    isDefault: false,
  };

  const updated = [newItem, ...current];
  localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return newItem;
}

export function updateMediaArticle(id, data) {
  const current = getMediaArticles();
  const updated = current.map(item => {
    if (item.id === id || String(item.id) === String(id)) {
      return {
        ...item,
        ...data,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });
  localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
}

export function deleteMediaArticle(id) {
  const current = getMediaArticles();
  const updated = current.filter(item => item.id !== id && String(item.id) !== String(id));
  localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(updated));
  notifySubscribers();
  return updated;
}

export function subscribeToMediaUpdates(callback) {
  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
  return () => {};
}
