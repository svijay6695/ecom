import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { Package, Truck, Calendar, MapPin, X, CheckCircle, Clock, Ban } from 'lucide-react-native';
import { useOrders } from '../context/OrderContext';
import { Order } from '../types/order';
import { resolveProductImage } from '../types/product';

export const OrdersScreen = () => {
  const { orders, cancelOrder } = useOrders();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#2E7D32';
      case 'Cancelled': return '#C62828';
      case 'In Transit': return '#E65100';
      case 'Packed': return '#F57C00';
      default: return '#1565C0';
    }
  };

  const handleCancel = (orderId: string) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const res = await cancelOrder(orderId);
            if (res.success) {
              Alert.alert('Order Cancelled', 'Your order has been cancelled.');
              setActiveOrder(null);
            } else {
              Alert.alert('Notice', res.error || 'Could not cancel order.');
            }
          }
        }
      ]
    );
  };

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Package size={48} color="#8B4513" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            When you place an order, live tracking of your Tamil Nadu dispatch journey will appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders ({orders.length})</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {orders.map(order => {
          const statusColor = getStatusColor(order.status);

          return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => setActiveOrder(order)}
              activeOpacity={0.8}
            >
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderId}>#{order.id}</Text>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#8A7A70" />
                    <Text style={styles.dateText}>{order.date}</Text>
                  </View>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderCardBody}>
                <Text style={styles.itemsSummary} numberOfLines={2}>
                  {order.items.map(it => `${it.title} (${it.selectedWeight || '1kg'}) × ${it.quantity}`).join(', ')}
                </Text>

                <View style={styles.orderBottomRow}>
                  <View style={styles.cityRow}>
                    <MapPin size={13} color="#8B4513" />
                    <Text style={styles.cityText}>{order.deliveryCity}, TN</Text>
                  </View>

                  <Text style={styles.orderTotal}>₹{order.total}</Text>
                </View>
              </View>

              <View style={styles.trackAction}>
                <Truck size={14} color="#8B4513" />
                <Text style={styles.trackActionText}>Tap to View Live Tracking</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Live Order Tracking Modal */}
      <Modal
        visible={!!activeOrder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveOrder(null)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tracking #{activeOrder?.id}</Text>
              <Text style={styles.modalSubtitle}>Tamil Nadu Express Journey</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveOrder(null)}>
              <X size={22} color="#2C1810" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Status Summary Banner */}
            <View style={styles.statusBanner}>
              <View style={styles.bannerRow}>
                <Text style={styles.bannerStatus}>{activeOrder?.status}</Text>
                <Text style={styles.bannerEta}>{activeOrder?.estimatedDelivery}</Text>
              </View>
              <Text style={styles.bannerRecipient}>
                Delivering to {activeOrder?.recipientName} • {activeOrder?.deliveryCity}
              </Text>
            </View>

            {/* Stepper Timeline */}
            <View style={styles.timelineCard}>
              <Text style={styles.timelineHeading}>Dispatch Progress</Text>

              {activeOrder?.trackingSteps.map((step, idx) => {
                const isLast = idx === (activeOrder.trackingSteps.length - 1);
                return (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepIndicatorCol}>
                      <View style={[
                        styles.stepDot,
                        step.completed && styles.stepDotCompleted,
                        step.current && styles.stepDotCurrent
                      ]}>
                        {step.completed && <CheckCircle size={14} color="#FFF" />}
                      </View>
                      {!isLast && (
                        <View style={[
                          styles.stepConnector,
                          step.completed && styles.stepConnectorCompleted
                        ]} />
                      )}
                    </View>

                    <View style={styles.stepContent}>
                      <View style={styles.stepTopLine}>
                        <Text style={[styles.stepTitle, step.current && styles.stepTitleCurrent]}>
                          {step.title}
                        </Text>
                        <Text style={styles.stepTime}>{step.time}</Text>
                      </View>
                      <Text style={styles.stepDesc}>{step.description}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Ordered Items Breakdown */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Ordered Items</Text>
              {activeOrder?.items.map((it, idx) => (
                <View key={idx} style={styles.orderItemRow}>
                  <Image source={resolveProductImage(it)} style={styles.orderItemImg} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.orderItemTitle}>{it.title}</Text>
                    <Text style={styles.orderItemWeight}>Pack: {it.selectedWeight || '1kg'} • Qty: {it.quantity}</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>₹{it.unitPrice * it.quantity}</Text>
                </View>
              ))}
            </View>

            {/* Order Items & Address info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Delivery Destination</Text>
              <Text style={styles.infoText}>{activeOrder?.recipientName} ({activeOrder?.recipientPhone})</Text>
              <Text style={styles.infoText}>{activeOrder?.deliveryAddress}, {activeOrder?.deliveryCity} - {activeOrder?.deliveryPincode}</Text>
            </View>

            {/* Cancel Button if eligible */}
            {activeOrder && activeOrder.status !== 'Delivered' && activeOrder.status !== 'Cancelled' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancel(activeOrder.id)}
              >
                <Ban size={16} color="#C62828" />
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFDF9',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
    backgroundColor: '#FFFDF9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#8A7A70',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5ECE3',
    marginVertical: 10,
  },
  orderCardBody: {
    marginBottom: 10,
  },
  itemsSummary: {
    fontSize: 13,
    color: '#4A2E18',
    lineHeight: 18,
    marginBottom: 8,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#8B4513',
  },
  trackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF7F2',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  trackActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B4513',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7A6B60',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '600',
    marginTop: 2,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  statusBanner: {
    backgroundColor: '#8B4513',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  bannerEta: {
    fontSize: 12,
    color: '#FFD7B5',
    fontWeight: '600',
  },
  bannerRecipient: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
  },
  timelineCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0D5C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#2E7D32',
  },
  stepDotCurrent: {
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#FFD7B5',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0D5C7',
    marginVertical: 4,
  },
  stepConnectorCompleted: {
    backgroundColor: '#2E7D32',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A2E18',
  },
  stepTitleCurrent: {
    color: '#8B4513',
    fontWeight: '800',
  },
  stepTime: {
    fontSize: 11,
    color: '#8A7A70',
    fontWeight: '600',
  },
  stepDesc: {
    fontSize: 12,
    color: '#7A6B60',
    marginTop: 2,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFE7DC',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2C1810',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#4A2E18',
    lineHeight: 18,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5ECE3',
  },
  orderItemImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F7EFE6',
  },
  orderItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  orderItemWeight: {
    fontSize: 11,
    color: '#8A7A70',
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B4513',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '700',
  },
});

