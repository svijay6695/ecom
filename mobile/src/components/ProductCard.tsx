import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Check, Star } from 'lucide-react-native';
import { Product, resolveProductImage } from '../types/product';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();
  const weightOptions = product.weightOptions && product.weightOptions.length > 0
    ? product.weightOptions
    : [
        { key: '250g', label: '250g', multiplier: 0.28 },
        { key: '500g', label: '500g', multiplier: 0.52 },
        { key: '1kg', label: '1kg', multiplier: 1.0 }
      ];

  const [selectedWeightKey, setSelectedWeightKey] = useState<string>(weightOptions[0]?.key || '1kg');

  const selectedOpt = weightOptions.find(w => w.key === selectedWeightKey) || weightOptions[0];
  const unitPrice = selectedOpt.price || Math.round(product.price * selectedOpt.multiplier);

  // Cart item matching this specific product & selected weight
  const cartItemId = `${product.id}-${selectedOpt.label}`;
  const existingItem = cartItems.find(item => item.cartItemId === cartItemId);
  const quantityInCart = existingItem?.quantity || 0;

  // Resolve unique image accurately
  const imageSource = resolveProductImage(product);

  const handleAdd = () => {
    addToCart(product, selectedOpt.label, unitPrice);
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />

        {product.isFeatured ? (
          <View style={styles.featuredBadge}>
            <Star size={10} color="#FFF" fill="#FFF" />
            <Text style={styles.featuredText}>Bestseller</Text>
          </View>
        ) : (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {product.category === 'seeds' ? 'Healthy Seed' : 'Premium Dry Fruit'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{product.description}</Text>

        {/* Weight selector pills */}
        <View style={styles.weightRow}>
          {weightOptions.map(opt => {
            const isSelected = opt.key === selectedWeightKey;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.weightPill, isSelected && styles.weightPillSelected]}
                onPress={() => setSelectedWeightKey(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.weightText, isSelected && styles.weightTextSelected]}>
                  {opt.label.replace('gram', 'g')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price and Add/Stepper button */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Price ({selectedOpt.label.replace('gram', 'g')})</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{unitPrice}</Text>
              <Text style={styles.mrpText}>₹{Math.round(unitPrice * 1.15)}</Text>
            </View>
          </View>

          {quantityInCart > 0 ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(cartItemId, -1)}
                activeOpacity={0.7}
              >
                <Minus size={14} color="#FFF" />
              </TouchableOpacity>

              <Text style={styles.stepperQty}>{quantityInCart}</Text>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(cartItemId, 1)}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Plus size={15} color="#FFF" />
              <Text style={styles.addText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE3D8',
    overflow: 'hidden',
    shadowColor: '#4A2E18',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#F7EFE6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#8B4513',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#6A5649',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    color: '#7A6B60',
    lineHeight: 16,
    marginBottom: 10,
  },
  weightRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  weightPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFD2C4',
    backgroundColor: '#FAF6F0',
  },
  weightPillSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  weightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C4A3E',
  },
  weightTextSelected: {
    color: '#FFF',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5ECE3',
  },
  priceLabel: {
    fontSize: 10,
    color: '#8A7A70',
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: '900',
    color: '#8B4513',
  },
  mrpText: {
    fontSize: 12,
    color: '#A09287',
    textDecorationLine: 'line-through',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 8,
    overflow: 'hidden',
    height: 32,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  stepperQty: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
});
