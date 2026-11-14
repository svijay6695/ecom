import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Search, X, ArrowRight, ShoppingBag, Sparkles, Truck, Tag } from 'lucide-react-native';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Product, CategoryFilter, INITIAL_PRODUCTS, resolveProductImage } from '../types/product';
import { getProductsApi } from '../api/client';
import { useCart } from '../context/CartContext';

export const HomeScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { cartCount, cartTotal } = useCart();

  const fetchLiveProducts = async () => {
    const liveData = await getProductsApi();
    if (liveData && Array.isArray(liveData) && liveData.length > 0) {
      const mapped: Product[] = liveData.map((p: any) => {
        const imageSource = resolveProductImage(p);
        const numId = Number(p.numericId || (typeof p.id === 'number' ? p.id : 1));
        return {
          id: p.id || p._id || numId,
          numericId: numId,
          title: p.title,
          description: p.description || `Premium ${p.title} handpicked for quality and aroma.`,
          category: p.category || 'nuts',
          price: Number(p.price),
          weights: p.weights || '1 kg',
          image: imageSource,
          weightOptions: p.weightOptions || [],
          inStock: p.inStock !== false,
          isFeatured: p.isFeatured
        };
      });
      setProducts(mapped);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveProducts();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Header onCartPress={() => navigation.navigate('Cart')} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B4513']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Fast Tamil Nadu Delivery Strip */}
        <View style={styles.deliveryStrip}>
          <Truck size={13} color="#8B4513" />
          <Text style={styles.deliveryStripText}>
            Direct from Kumbakonam Hub • 1-2 Days Express Delivery
          </Text>
        </View>

        {/* Hero Brand Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../assets/banner.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        {/* Festive Promo Pill */}
        <View style={styles.promoPillCard}>
          <View style={styles.promoPillLeft}>
            <Tag size={16} color="#8B4513" />
            <Text style={styles.promoPillText}>
              Get 10% OFF on all dry fruits with code <Text style={styles.promoCodeBold}>VPNUTS10</Text>
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#8A7A70" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search almonds, cashews, walnuts, seeds..."
            placeholderTextColor="#A09287"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#8A7A70" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Sparkles size={14} color={selectedCategory === 'all' ? '#FFF' : '#8B4513'} />
            <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'nuts' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('nuts')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'nuts' && styles.categoryTextActive]}>
              Dry Fruits & Nuts 🥜
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'seeds' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('seeds')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'seeds' && styles.categoryTextActive]}>
              Healthy Seeds 🌱
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Product Count Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'Featured Catalog' : selectedCategory === 'nuts' ? 'Dry Fruits & Nuts' : 'Healthy Seeds'}
          </Text>
          <Text style={styles.sectionCount}>{filteredProducts.length} items</Text>
        </View>

        {/* Products List with Unique Images */}
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartIcon}>
              <ShoppingBag size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.floatingCartCount}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
              <Text style={styles.floatingCartTotal}>₹{cartTotal}</Text>
            </View>
          </View>

          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartBtnText}>View Cart</Text>
            <ArrowRight size={18} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 95,
  },
  deliveryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5EBE1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
  },
  deliveryStripText: {
    fontSize: 11,
    color: '#8B4513',
    fontWeight: '700',
  },
  bannerContainer: {
    width: '100%',
    height: 145,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#8B4513',
    elevation: 3,
    shadowColor: '#4A2E18',
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  promoPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  promoPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  promoPillText: {
    fontSize: 12,
    color: '#5C4A3E',
    fontWeight: '500',
  },
  promoCodeBold: {
    fontWeight: '800',
    color: '#8B4513',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    marginBottom: 14,
    gap: 8,
    shadowColor: '#4A2E18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2C1810',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
  },
  categoryChipActive: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6A5649',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2C1810',
    letterSpacing: 0.3,
  },
  sectionCount: {
    fontSize: 13,
    color: '#8A7A70',
    fontWeight: '600',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#8B4513',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCount: {
    fontSize: 11,
    color: '#FFD7B5',
    fontWeight: '600',
  },
  floatingCartTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingCartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
