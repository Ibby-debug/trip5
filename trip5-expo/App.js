import React, { useState, useEffect, useCallback, Component } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import i18n, { initI18n } from './src/i18n';
import { colors, ios } from './src/theme';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }}>
          <Text style={{ fontSize: 18, marginBottom: 12, color: colors.text }}>Something went wrong</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
import { OrderProvider, useOrder } from './src/context/OrderContext';
import StepProgress from './src/components/StepProgress';
import LanguageToggle from './src/components/LanguageToggle';
import UnifiedFlowScreen from './src/screens/UnifiedFlowScreen';

function MainFlow() {
  const {
    order,
    updateOrder,
    currentStep,
    goNext,
    goBack,
    canProceedFromRoute,
    canProceedFromService,
    canProceedFromDetails,
    orderDate,
    isSubmitting,
    submitError,
    orderSent,
    submit,
    resetOrder,
    isValidPhone,
  } = useOrder();

  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    initI18n()
      .then((lang) => setLocale(lang))
      .catch(() => setLocale('ar'));
  }, []);

  const refreshLocale = useCallback(() => {
    setLocale(i18n.locale);
  }, []);

  const getStepHeading = (step) => {
    const keys = ['step_heading_1', 'step_heading_2', 'step_heading_3', 'step_heading_4', 'step_heading_5'];
    return i18n.t(keys[step - 1] || 'step_heading_1');
  };
  return (
    <View style={styles.safe}>
      <SafeAreaView style={styles.safeInner} edges={['top']}>
      <StatusBar style="dark" />
      <View style={[styles.headerWrapper, Platform.OS !== 'ios' && styles.headerWrapperAndroid]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={currentStep > 1 && !orderSent ? goBack : undefined}
              style={styles.backBtn}
              activeOpacity={0.6}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={currentStep <= 1 || orderSent}
            >
              <Text style={[styles.backChevron, (currentStep <= 1 || orderSent) && styles.backChevronDisabled]}>‹</Text>
              <Text style={[styles.backText, (currentStep <= 1 || orderSent) && styles.backChevronDisabled]}>{i18n.t('back')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerSpacer} />
          <View style={styles.headerRight}>
            <LanguageToggle onToggle={refreshLocale} />
          </View>
        </View>
      </View>
      {!orderSent && (
        <StepProgress
          current={currentStep}
          total={5}
          heading={currentStep === 1 ? null : getStepHeading(currentStep)}
          routeText={
            order.route
              ? (() => {
                  const r = order.route;
                  if (i18n.locale === 'ar') {
                    if (r === 'irbid_to_amman') return i18n.t('from_irbid_to_amman');
                    if (r === 'amman_to_irbid') return i18n.t('from_amman_to_irbid');
                    if (r === 'airport_to_amman') return i18n.t('route_airport_to_amman');
                    if (r === 'airport_to_irbid') return i18n.t('route_airport_to_irbid');
                    if (r === 'amman_to_airport') return i18n.t('route_amman_to_airport');
                    if (r === 'irbid_to_airport') return i18n.t('route_irbid_to_airport');
                  } else {
                    if (r === 'irbid_to_amman') return i18n.t('route_irbid_to_amman');
                    if (r === 'amman_to_irbid') return i18n.t('route_amman_to_irbid');
                    if (r === 'airport_to_amman') return i18n.t('route_airport_to_amman');
                    if (r === 'airport_to_irbid') return i18n.t('route_airport_to_irbid');
                    if (r === 'amman_to_airport') return i18n.t('route_amman_to_airport');
                    if (r === 'irbid_to_airport') return i18n.t('route_irbid_to_airport');
                  }
                  return null;
                })()
              : null
          }
        />
      )}
      <View style={styles.content}>
        <UnifiedFlowScreen
          order={order}
          updateOrder={updateOrder}
          goNext={goNext}
          goBack={goBack}
          currentStep={currentStep}
          canProceedFromRoute={canProceedFromRoute}
          canProceedFromService={canProceedFromService}
          canProceedFromDetails={canProceedFromDetails}
          orderDate={orderDate}
          isSubmitting={isSubmitting}
          submitError={submitError}
          orderSent={orderSent}
          submit={submit}
          resetOrder={resetOrder}
          isValidPhone={isValidPhone}
        />
      </View>
    </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <OrderProvider>
          <MainFlow />
        </OrderProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, minHeight: 200 },
  safeInner: { flex: 1 },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerWrapperAndroid: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ios.spacing.lg,
    paddingVertical: ios.spacing.sm,
    minHeight: 36,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', minWidth: 80 },
  headerSpacer: { flex: 1 },
  headerRight: { minWidth: 80, alignItems: 'flex-end' },
  t5Logo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  t5LogoDisabled: { color: colors.textSecondary, opacity: 0.7 },
  backChevronDisabled: { color: colors.textSecondary, opacity: 0.7 },
  title: {
    fontSize: ios.fontSize.title3,
    fontWeight: ios.fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 8,
  },
  backChevron: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.primary,
    marginTop: -4,
    marginRight: 4,
  },
  backText: {
    fontSize: ios.fontSize.body,
    color: colors.primary,
    fontWeight: ios.fontWeight.regular,
  },
  content: { flex: 1 },
});
