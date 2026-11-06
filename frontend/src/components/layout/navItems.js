import { FiGrid, FiFilm, FiLayers, FiFolder, FiVideo, FiClock, FiBookOpen, FiGift } from 'react-icons/fi';

// Sidebar navigation — names and order are fixed by the product spec. Logout is rendered last by the Sidebar.
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/film-studio', label: 'Film Studio', icon: FiFilm },
  { to: '/series-studio', label: 'Series Studio', icon: FiLayers },
  { to: '/my-projects', label: 'My Projects', icon: FiFolder },
  { to: '/my-videos', label: 'My Videos', icon: FiVideo },
  { to: '/gen-history', label: 'Gen History', icon: FiClock },
  { to: '/training', label: 'Training', icon: FiBookOpen },
  { to: '/bonuses', label: 'Bonuses', icon: FiGift },
];
