import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import i18n, { initI18n } from '../i18n';
import { colors, ios } from '../theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LanguageToggle from '../components/LanguageToggle';
import WalletModal from '../components/WalletModal';
import {
  partitionBookings,
  formatBookingDate,
  pickupSummary,
  destinationSummary,
  isTerminalStatus,
} from '../utils/bookings';

function getRouteLabel(route) {
  if (!route) return '';
  const r = route;
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
  return r;
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return i18n.t('order_status_completed');
  if (s === 'cancelled') return i18n.t('order_status_cancelled');
  if (s === 'confirmed') return i18n.t('order_status_confirmed');
  return i18n.t('order_status_pending');
}

export default function DashboardScreen({ navigation }) {
  const { signOut } = useAuth();
  const [locale, setLocale] = useState(i18n.locale);
  const [walletVisible, setWalletVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const refreshLocale = useCallback(() => {
    setLocale(i18n.locale);
  }, []);

  const loadOrders = useCallback(async () => {
    setError(null);
    const { data, error: qErr } = await supabase
      .from('orders')
      .select('*')
      .order('scheduled_at', { ascending: false });
    if (qErr) {
      setError(qErr.message || 'fetch failed');
      setRows([]);
      return;
    }
    setRows(data || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      initI18n()
        .then((lang) => {
          if (!cancelled) setLocale(lang);
        })
        .catch(() => {
          if (!cancelled) setLocale('ar');
        });
      setLoading(true);
      loadOrders().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [loadOrders])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const { active, history } = partitionBookings(rows);
  const now = new Date();

  const renderHistoryRow = (item) => {
    const scheduled = new Date(item.scheduled_at);
    const isFuture = scheduled.getTime() >= now.getTime() && !isTerminalStatus(item.status);
    return (
      <View key={item.id} style={styles.historyCard}>
        <View style={styles.historyRowTop}>
          <Text style={styles.historyRoute} numberOfLines={2}>
            {getRouteLabel(item.route)}
          </Text>
          {isFuture ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i18n.t('dashboard_upcoming_badge')}</Text>
            </View>
          ) : (
            <Text style={styles.historyStatus}>{statusLabel(item.status)}</Text>
          )}
        </View>
        <Text style={styles.historyWhen}>{formatBookingDate(item.scheduled_at, i18n.locale)}</Text>
        <Text style={styles.historyLine} numberOfLines={1}>
          {i18n.t('pickup_location')}: {pickupSummary(item.pickup) || '—'}
        </Text>
        <Text style={styles.historyLine} numberOfLines={1}>
          {i18n.t('destination')}:{' '}
          {item.destination?.pending ? i18n.t('no_destination_selected') : destinationSummary(item.destination) || '—'}
        </Text>
      </View>
    );
  };

  const chromeHeader = (
    <View style={[styles.headerWrapper, Platform.OS !== 'ios' && styles.headerWrapperAndroid]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <View style={styles.headerSpacer} />
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setWalletVisible(true)}
            style={styles.walletBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('wallet_title')}
          >
            <Ionicons name="wallet-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.signOutText}>{i18n.t('sign_out')}</Text>
          </TouchableOpacity>
          <LanguageToggle onToggle={refreshLocale} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      <SafeAreaView style={styles.safeInner} edges={['top', 'left', 'right', 'bottom']}>
        {chromeHeader}
        <ScrollView
          key={locale}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: ios.spacing.xxl + 88 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{i18n.t('dashboard_title')}</Text>
          <Text style={styles.subtitle}>{i18n.t('dashboard_subtitle')}</Text>

          <Text style={styles.sectionLabel}>{i18n.t('dashboard_active_section')}</Text>
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.muted}>{i18n.t('dashboard_loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>{i18n.t('dashboard_error')}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryBtnText}>{i18n.t('dashboard_retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : active ? (
            <View style={styles.activeCard}>
              <View style={styles.activeTop}>
                <Text style={styles.activeRoute}>{getRouteLabel(active.route)}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statusLabel(active.status)}</Text>
                </View>
              </View>
              <Text style={styles.activeWhen}>{formatBookingDate(active.scheduled_at, i18n.locale)}</Text>
              <Text style={styles.activeLine} numberOfLines={2}>
                {i18n.t('pickup_location')}: {pickupSummary(active.pickup) || '—'}
              </Text>
              <Text style={styles.activeLine} numberOfLines={2}>
                {i18n.t('destination')}:{' '}
                {active.destination?.pending
                  ? i18n.t('no_destination_selected')
                  : destinationSummary(active.destination) || '—'}
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyHint}>{i18n.t('dashboard_no_active')}</Text>
          )}

          <Text style={styles.sectionLabel}>{i18n.t('dashboard_history_section')}</Text>
          {!loading && !error && history.length === 0 ? (
            <Text style={styles.emptyHint}>{i18n.t('dashboard_no_history')}</Text>
          ) : (
            !loading &&
            !error &&
            history.map(renderHistoryRow)
          )}
        </ScrollView>

        <View style={styles.fabWrap} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('Booking')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('dashboard_schedule_cta')}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.white} style={styles.fabIcon} />
            <Text style={styles.fabText}>{i18n.t('dashboard_schedule_cta')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <WalletModal visible={walletVisible} onClose={() => setWalletVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
    minHeight: 44,
  },
  headerLeft: { width: 40 },
  headerSpacer: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  walletBtn: { paddingVertical: 6, paddingHorizontal: 4, marginRight: 4 },
  signOutBtn: { paddingVertical: 6, paddingHorizontal: 4, marginRight: 8 },
  signOutText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: ios.spacing.lg,
  },
  title: {
    fontSize: ios.fontSize.title2,
    fontWeight: ios.fontWeight.bold,
    color: colors.text,
    marginTop: ios.spacing.md,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: ios.fontSize.footnote,
    color: colors.textSecondary,
    marginTop: ios.spacing.xs,
    marginBottom: ios.spacing.lg,
  },
  sectionLabel: {
    fontSize: ios.fontSize.subhead,
    fontWeight: ios.fontWeight.semibold,
    color: colors.text,
    marginBottom: ios.spacing.sm,
  },
  centerBox: {
    paddingVertical: ios.spacing.lg,
    alignItems: 'center',
  },
  muted: {
    marginTop: ios.spacing.sm,
    fontSize: ios.fontSize.footnote,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: ios.fontSize.footnote,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: ios.spacing.md,
    paddingVertical: ios.spacing.sm,
    paddingHorizontal: ios.spacing.lg,
    backgroundColor: colors.primaryLight,
    borderRadius: ios.radius.md,
  },
  retryBtnText: {
    color: colors.primaryDark,
    fontWeight: ios.fontWeight.semibold,
    fontSize: ios.fontSize.subhead,
  },
  activeCard: {
    backgroundColor: colors.surface,
    borderRadius: ios.radius.lg,
    padding: ios.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: ios.spacing.lg,
  },
  activeTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ios.spacing.sm,
  },
  activeRoute: {
    flex: 1,
    fontSize: ios.fontSize.callout,
    fontWeight: ios.fontWeight.semibold,
    color: colors.text,
  },
  activeWhen: {
    fontSize: ios.fontSize.footnote,
    color: colors.textSecondary,
    marginTop: ios.spacing.xs,
    marginBottom: ios.spacing.sm,
  },
  activeLine: {
    fontSize: ios.fontSize.footnote,
    color: colors.text,
    marginTop: 4,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: ios.spacing.sm,
    paddingVertical: 4,
    borderRadius: ios.radius.sm,
  },
  badgeText: {
    fontSize: ios.fontSize.caption,
    fontWeight: ios.fontWeight.semibold,
    color: colors.primaryDark,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: ios.spacing.md,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: ios.spacing.md,
    paddingHorizontal: ios.spacing.xl,
    minHeight: ios.minTouchTarget,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  fabIcon: { marginRight: ios.spacing.sm },
  fabText: {
    color: colors.white,
    fontSize: ios.fontSize.callout,
    fontWeight: ios.fontWeight.semibold,
  },
  emptyHint: {
    fontSize: ios.fontSize.footnote,
    color: colors.textSecondary,
    marginBottom: ios.spacing.lg,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: ios.radius.md,
    padding: ios.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: ios.spacing.sm,
  },
  historyRowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ios.spacing.sm,
  },
  historyRoute: {
    flex: 1,
    fontSize: ios.fontSize.subhead,
    fontWeight: ios.fontWeight.medium,
    color: colors.text,
  },
  historyStatus: {
    fontSize: ios.fontSize.caption,
    color: colors.textSecondary,
    fontWeight: ios.fontWeight.medium,
  },
  historyWhen: {
    fontSize: ios.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: ios.spacing.xs,
  },
  historyLine: {
    fontSize: ios.fontSize.caption,
    color: colors.text,
  },
});
