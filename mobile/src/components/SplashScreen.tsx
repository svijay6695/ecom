import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Award, Leaf } from 'lucide-react-native';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Luxury Gold Border Badge */}
        <View style={styles.logoBadgeContainer}>
          <View style={styles.goldRing}>
            <View style={styles.innerBadge}>
              <Text style={styles.logoText}>VP</Text>
            </View>
          </View>
        </View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>VP NUTS</Text>
        <Text style={styles.tagline}>KUMBAKONAM • TAMIL NADU</Text>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>Farm-Fresh Premium Dry Fruits & Nuts</Text>

        {/* Quality Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badgePill}>
            <Award size={13} color="#D4AF37" />
            <Text style={styles.badgeText}>Export Grade</Text>
          </View>
          <View style={styles.badgePill}>
            <Leaf size={13} color="#D4AF37" />
            <Text style={styles.badgeText}>100% Natural</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#381E0D',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoBadgeContainer: {
    marginBottom: 20,
  },
  goldRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  innerBadge: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E6C66E',
  },
  logoText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#D4AF37',
    opacity: 0.6,
    marginBottom: 16,
    borderRadius: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#F0E6D8',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  badgeText: {
    color: '#F4DE9C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
