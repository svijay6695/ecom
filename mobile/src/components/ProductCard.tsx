import React, { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Check, Star, AlertCircle } from 'lucide-react-native';
import { Product, resolveProductImage } from '../types/product';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

interface EffectiveWeightOption {
  key: string;
  label: string;
  price: number;
  stock: number;
  available: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cartItems, updateQuantity } = useCart();

  // Normalize effective weight options from live MongoDB data
  const effectiveOptions: EffectiveWeightOption[] = useMemo(() => {
    if (product.weightOptions && product.weightOptions.length > 0) {
      return product.weightOptions.map(opt => ({
        key: opt.key,
        label: opt.label,
        price: Number(opt.price || Math.round(product.price * (opt.multiplier || 1))),
        stock: opt.stock !== undefined ? Number(opt.stock) : 50,
        available: opt.available !== false && (opt.stock === undefined || Number(opt.stock) > 0)
      }));
    }
    return [
      { key: '250g', label: '250 gram', price: Math.round(product.price * 0.28), stock: 50, available: true },
      { key: '500g', label: '500 gram', price: Math.round(product.price * 0.52), stock: 50, available: true },
      { key: '1kg', label: '1 kg', price: product.price, stock: 50, available: true }
    ];
  }, [product.weightOptions, product.price]);

  // Initial selection defaults to first available in-stock option (e.g. 500g for Almonds)
  const defaultOption = effectiveOptions.find(o => o.available) || effectiveOptions[0];
  const [selectedWeightKey, setSelectedWeightKey] = useState<string>(defaultOption.key);
  const [justAdded, setJustAdded] = useState(false);

  // Find currently active weight option
  const currentOption = effectiveOptions.find(w => w.key === selectedWeightKey) || defaultOption;

  const isCurrentDisabled = !currentOption.available;
  const currentPrice = currentOption.price;
  const currentStock = currentOption.stock;
  const maxQtyAllowed = isCurrentDisabled ? 0 : Math.max(1, Math.min(10, currentStock));

  // Cart item matching this specific product & selected weight
  const cartItemId = `${product.id}-${currentOption.label}`;
  const existingItem = cartItems.find(item => item.cartItemId === cartItemId);
  const quantityInCart = existingItem?.quantity || 0;

  // Resolve unique image accurately
  const imageSource = resolveProductImage(product);

  const handleAdd = () => {
    if (isCurrentDisabled || maxQtyAllowed === 0) return;
    addToCart(product, currentOption.label, currentPrice);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <View style={[styles.card, isCurrentDisabled && styles.cardDisabled]}>
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

        {/* Weight Selector Pills showing live prices & stock badges */}
        <View style={styles.weightRow}>
          {effectiveOptions.map(opt => {
            const isSelected = opt.key === currentOption.key;
            const disabled = !opt.available;

            let pillSuffix = ` - ₹${opt.price}`;
            if (disabled) {
              pillSuffix = ' (Out of stock)';
            } else if (opt.stock <= 5) {
              pillSuffix = ` - ₹${opt.price} (Only ${opt.stock} left)`;
            }

            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.weightPill,
                  isSelected && styles.weightPillSelected,
                  disabled && styles.weightPillDisabled
                ]}
                onPress={() => setSelectedWeightKey(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.weightText,
                    isSelected && styles.weightTextSelected,
                    disabled && styles.weightTextDisabled
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}{pillSuffix}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price & Stock Status Tag Row matching Frontend */}
        <View style={styles.priceStockRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{currentPrice}</Text>
            <Text style={styles.mrpText}>₹{Math.round(currentPrice * 1.15)}</Text>
          </View>

          {isCurrentDisabled ? (
            <View style={styles.outOfStockBadge}>
              <AlertCircle size={12} color="#DC2626" />
              <Text style={styles.outOfStockText}>Out of stock</Text>
            </View>
          ) : currentStock <= 5 ? (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Only {currentStock} left!</Text>
            </View>
          ) : null}
        </View>

        {/* Actions Row: Quantity & Add Button */}
        <View style={styles.actionsRow}>
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
                style={[
                  styles.stepperBtn,
                  quantityInCart >= maxQtyAllowed && styles.stepperBtnDisabled
                ]}
                onPress={() => {
                  if (quantityInCart < maxQtyAllowed) {
                    updateQuantity(cartItemId, 1);
                  }
                }}
                disabled={quantityInCart >= maxQtyAllowed}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : isCurrentDisabled ? (
            <View style={styles.unavailableBtn}>
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, justAdded && styles.addButtonSuccess]}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              {justAdded ? (
                <>
                  <Check size={15} color="#FFF" />
                  <Text style={styles.addText}>Added!</Text>
                </>
              ) : (
                <>
                  <Plus size={15} color="#FFF" />
                  <Text style={styles.addText}>ADD</Text>
                </>
              )}
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
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.9,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#FAF5EE',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B4513',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: '#8B4513',
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
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#7A6B60',
    lineHeight: 16,
    marginBottom: 10,
  },
  weightRow: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  weightPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F7F3EE',
    borderWidth: 1.5,
    borderColor: '#E6DCCE',
  },
  weightPillSelected: {
    backgroundColor: '#FAF0E6',
    borderColor: '#8B4513',
  },
  weightPillDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  weightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4838',
  },
  weightTextSelected: {
    color: '#8B4513',
    fontWeight: '800',
  },
  weightTextDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  mrpText: {
    fontSize: 12,
    color: '#A09287',
    textDecorationLine: 'line-through',
  },
  lowStockBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lowStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    minWidth: 100,
  },
  addButtonSuccess: {
    backgroundColor: '#2E7D32',
  },
  addText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unavailableBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  unavailableText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperQty: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
});
