export interface WeightOption {
  key: string;
  label: string;
  multiplier: number;
  price?: number;
  available?: boolean;
  stock?: number;
}

export interface Product {
  id: number | string;
  numericId?: number;
  title: string;
  description: string;
  image: any;
  category: 'nuts' | 'seeds' | string;
  price: number;
  weights: string;
  weightOptions: WeightOption[];
  inStock?: boolean;
  isFeatured?: boolean;
}

export type CategoryFilter = 'all' | 'nuts' | 'seeds';
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export const LOCAL_IMAGES: Record<number, any> = {
  1: require('../../assets/1.jpg'),
  2: require('../../assets/2.jpg'),
  3: require('../../assets/3.jpg'),
  4: require('../../assets/4.jpg'),
  5: require('../../assets/5.jpg'),
  6: require('../../assets/6.jpg'),
  7: require('../../assets/7.jpg'),
  8: require('../../assets/8.jpg'),
};

/**
 * Intelligent Image Resolver for Mobile:
 * Accurately maps MongoDB documents, remote URLs, and product titles to their unique images.
 */
export const resolveProductImage = (p: any): any => {
  if (!p) return LOCAL_IMAGES[1];

  // 1. Remote HTTP/HTTPS URL
  if (typeof p.image === 'string' && (p.image.startsWith('http://') || p.image.startsWith('https://'))) {
    return { uri: p.image };
  }

  // 2. Uploaded image on backend server
  if (typeof p.image === 'string' && p.image.startsWith('/uploads')) {
    return { uri: `https://ecom-xpht.onrender.com${p.image}` };
  }

  // 3. Image string contains filename like "/assets/2.jpg" or "3.jpg"
  if (typeof p.image === 'string') {
    const match = p.image.match(/([1-8])\.(jpg|jpeg|png)/i);
    if (match && match[1]) {
      const idx = Number(match[1]);
      if (LOCAL_IMAGES[idx]) return LOCAL_IMAGES[idx];
    }
  }

  // 4. Match by numericId or integer id
  const numId = Number(p.numericId || (typeof p.id === 'number' ? p.id : NaN));
  if (!isNaN(numId) && LOCAL_IMAGES[numId]) {
    return LOCAL_IMAGES[numId];
  }

  // 5. Foolproof keyword matching on product title
  const title = (p.title || '').toLowerCase();
  if (title.includes('almond') || title.includes('badam')) return LOCAL_IMAGES[1];
  if (title.includes('cashew') || title.includes('kaju') || title.includes('mundhiri')) return LOCAL_IMAGES[2];
  if (title.includes('walnut') || title.includes('akhrot')) return LOCAL_IMAGES[3];
  if (title.includes('pista') || title.includes('pistachio')) return LOCAL_IMAGES[4];
  if (title.includes('date') || title.includes('khajoor')) return LOCAL_IMAGES[5];
  if (title.includes('sunflower')) return LOCAL_IMAGES[6];
  if (title.includes('pumpkin') || title.includes('pepita')) return LOCAL_IMAGES[7];
  if (title.includes('watermelon') || title.includes('magaz')) return LOCAL_IMAGES[8];

  return LOCAL_IMAGES[1];
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    numericId: 1,
    title: "California Almonds",
    description: "Premium handpicked California almonds packed with crunch, protein, and essential nutrients.",
    image: LOCAL_IMAGES[1],
    price: 1000,
    weights: "1 kg",
    category: "nuts",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 50 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    id: 2,
    numericId: 2,
    title: "Whole White Cashews",
    description: "Grade-A whole white cashews rich in buttery aroma and naturally heart-healthy fats.",
    image: LOCAL_IMAGES[2],
    price: 1000,
    weights: "1 kg",
    category: "nuts",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 280, available: true, stock: 45 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 520, available: true, stock: 45 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1000, available: true, stock: 45 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    id: 3,
    numericId: 3,
    title: "Chilean Walnut Kernels",
    description: "Extra-light brain-shaped walnut halves rich in plant omega-3 fatty acids.",
    image: LOCAL_IMAGES[3],
    price: 1500,
    weights: "1 kg",
    category: "nuts",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 30 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 30 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 30 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    id: 4,
    numericId: 4,
    title: "Roasted Salted Pistachios",
    description: "Naturally opened California pistachios lightly roasted with sea salt for savory crunch.",
    image: LOCAL_IMAGES[4],
    price: 1500,
    weights: "1 kg",
    category: "nuts",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 420, available: true, stock: 40 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 780, available: true, stock: 40 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 1500, available: true, stock: 40 }
    ],
    inStock: true,
    isFeatured: true
  },
  {
    id: 5,
    numericId: 5,
    title: "Omani Black Dates",
    description: "Sweet, soft, luscious dark dates loaded with dietary fiber, iron, and potassium.",
    image: LOCAL_IMAGES[5],
    price: 800,
    weights: "1 kg",
    category: "nuts",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 60 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 60 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 60 }
    ],
    inStock: true
  },
  {
    id: 6,
    numericId: 6,
    title: "Raw Sunflower Seeds",
    description: "Shelled clean sunflower seeds rich in Vitamin E, magnesium, and healthy energy.",
    image: LOCAL_IMAGES[6],
    price: 500,
    weights: "1 kg",
    category: "seeds",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 140, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 260, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 500, available: true, stock: 50 }
    ],
    inStock: true
  },
  {
    id: 7,
    numericId: 7,
    title: "Raw Green Pumpkin Seeds",
    description: "Grade-A pumpkin pepitas packed with zinc, protein, and sleep-boosting tryptophan.",
    image: LOCAL_IMAGES[7],
    price: 800,
    weights: "1 kg",
    category: "seeds",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 224, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 416, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 800, available: true, stock: 50 }
    ],
    inStock: true
  },
  {
    id: 8,
    numericId: 8,
    title: "Shelled Watermelon Seeds",
    description: "Natural nutty watermelon magaz seeds perfect for snacking and blending into smoothies.",
    image: LOCAL_IMAGES[8],
    price: 700,
    weights: "1 kg",
    category: "seeds",
    weightOptions: [
      { key: "250g", label: "250 gram", multiplier: 0.28, price: 196, available: true, stock: 50 },
      { key: "500g", label: "500 gram", multiplier: 0.52, price: 364, available: true, stock: 50 },
      { key: "1kg", label: "1 kg", multiplier: 1.0, price: 700, available: true, stock: 50 }
    ],
    inStock: true
  }
];

