import React, { createContext, useContext, useState, useCallback } from 'react';
import { submitOrder } from '../api';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

const initialOrder = {
  route: null,
  isToday: true,
  scheduledDate: new Date(),
  service: null,
  fullName: '',
  phoneNumber: '',
  pickup: null,
  destination: null,
};

export function OrderProvider({ children }) {
  const [order, setOrder] = useState(initialOrder);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [orderSent, setOrderSent] = useState(false);

  const orderDate =
    order.scheduledDate instanceof Date
      ? order.scheduledDate
      : new Date(order.scheduledDate || Date.now());

  const isValidPhone = (phone) => {
    const cleaned = (phone || '').replace(/\s|-/g, '');
    if (/^\+962/.test(cleaned)) return cleaned.length >= 12;
    if (/^962/.test(cleaned)) return cleaned.length >= 11;
    if (/^0/.test(cleaned)) return cleaned.length >= 9 && cleaned.length <= 10;
    return cleaned.length >= 9 && cleaned.length <= 10;
  };

  const updateOrder = useCallback((updates) => {
    setOrder((prev) => {
      const next = { ...prev, ...updates };
      // When route changes (e.g. user goes back and picks Amman instead of Irbid), reset page 4 form
      if ('route' in updates && updates.route !== prev.route) {
        next.fullName = '';
        next.phoneNumber = '';
        next.pickup = null;
        next.destination = null;
      }
      return next;
    });
  }, []);

  const isAirportRoute = ['airport_to_amman', 'airport_to_irbid', 'amman_to_airport', 'irbid_to_airport'].includes(order.route);

  const goNext = useCallback(() => {
    setCurrentStep((s) => {
      const next = s + 1;
      if (s === 2 && isAirportRoute) return 4;
      return Math.min(next, 5);
    });
  }, [order.route]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => {
      if (s === 4 && isAirportRoute) return 2;
      return Math.max(s - 1, 1);
    });
  }, [order.route]);

  const canProceedFromRoute = order.route !== null;
  const canProceedFromService =
    isAirportRoute ||
    (order.service !== null &&
      (order.service.type !== 'instant' || (order.service.description || '').trim()));
  const canProceedFromDetails =
    order.fullName.trim() &&
    isValidPhone(order.phoneNumber) &&
    order.pickup &&
    order.destination;

  const buildOrderPayload = useCallback(() => {
    const payload = {
      route: order.route,
      date: orderDate.toISOString(),
      service: formatService(order.service),
      fullName: order.fullName.trim(),
      phoneNumber: order.phoneNumber.trim(),
      pickup: {
        latitude: order.pickup.latitude,
        longitude: order.pickup.longitude,
        address: order.pickup.address,
      },
      destination: {
        latitude: order.destination.latitude,
        longitude: order.destination.longitude,
        address: order.destination.address,
      },
    };
    return payload;
  }, [order, orderDate]);

  const formatService = (service) => {
    if (!service) return null;
    if (service.type === 'basic') return { type: 'basic' };
    if (service.type === 'private') return { type: 'private', alone: service.alone };
    if (service.type === 'airport') return { type: 'airport', toAirport: service.toAirport };
    if (service.type === 'instant') return { type: 'instant', description: service.description };
    return null;
  };

  const submit = useCallback(async () => {
    if (!order.pickup || !order.destination) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitOrder(buildOrderPayload());
      setOrderSent(true);
    } catch (err) {
      setSubmitError(err.message || 'Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [order, buildOrderPayload]);

  const resetOrder = useCallback(() => {
    setOrder(initialOrder);
    setCurrentStep(1);
    setIsSubmitting(false);
    setSubmitError(null);
    setOrderSent(false);
  }, []);

  const value = {
    order,
    updateOrder,
    currentStep,
    goNext,
    goBack,
    setCurrentStep,
    canProceedFromRoute,
    canProceedFromService,
    canProceedFromDetails,
    orderDate,
    isSubmitting,
    submitError,
    orderSent,
    submit,
    resetOrder,
    buildOrderPayload,
    isValidPhone,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}
