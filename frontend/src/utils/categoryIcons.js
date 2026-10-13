import {
  Shirt,
  Footprints,
  Dumbbell,
  Shield,
  Zap,
  Trophy,
  Activity,
  Sparkles,
  Tag,
  Flame,
  Award,
  Medal,
  HeartPulse,
  Compass,
  Target,
  Package
} from 'lucide-react';

/**
 * Peta nama string ikon kategori ke komponen ikon Lucide.
 */
export const CATEGORY_ICON_MAP = {
  Shirt,
  Footprints,
  Dumbbell,
  Shield,
  Zap,
  Trophy,
  Activity,
  Sparkles,
  Tag,
  Flame,
  Award,
  Medal,
  HeartPulse,
  Compass,
  Target,
  Package
};

/**
 * Daftar opsi simbol ikon kategori standar untuk dropdown ServerSideSelect.
 */
export const CATEGORY_ICON_OPTIONS = [
  { value: 'Shirt', label: 'Shirt (Jersey & Pakaian)', icon: Shirt },
  { value: 'Footprints', label: 'Footprints (Sepatu & Sepatu Olahraga)', icon: Footprints },
  { value: 'Dumbbell', label: 'Dumbbell (Peralatan & Gym)', icon: Dumbbell },
  { value: 'Shield', label: 'Shield (Aksesoris & Deker)', icon: Shield },
  { value: 'Zap', label: 'Zap (Running & Marathon)', icon: Zap },
  { value: 'Trophy', label: 'Trophy (Futsal & Sepakbola)', icon: Trophy },
  { value: 'Activity', label: 'Activity (Training & Fitness)', icon: Activity },
  { value: 'Sparkles', label: 'Sparkles (Koleksi Pro Player)', icon: Sparkles },
  { value: 'Flame', label: 'Flame (Populer & Best Seller)', icon: Flame },
  { value: 'Award', label: 'Award (Liga & Turnamen)', icon: Award },
  { value: 'Medal', label: 'Medal (Prestasi & Kejuaraan)', icon: Medal },
  { value: 'HeartPulse', label: 'HeartPulse (Kesehatan & Kardio)', icon: HeartPulse },
  { value: 'Compass', label: 'Compass (Outdoor & Petualangan)', icon: Compass },
  { value: 'Target', label: 'Target (Akurasi & Target)', icon: Target },
  { value: 'Tag', label: 'Tag (Kategori Umum)', icon: Tag }
];

/**
 * Mengembalikan komponen ikon Lucide berdasarkan nama string ikon.
 * @param {string} iconName
 * @returns {React.ComponentType}
 */
export function resolveCategoryIcon(iconName) {
  if (!iconName) return Tag;
  return CATEGORY_ICON_MAP[iconName] || Tag;
}
