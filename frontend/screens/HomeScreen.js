import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { themes } from "../utils/themes";
import { translations } from "../utils/translations";
import { createEvent, fetchEvents } from "../services/eventService";
import GradientBackground from "../components/GradientBackground";

const initialForm = {
  name: "",
  rentalDurationDays: "1",
  retentionDays: "30",
  description: "",
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useSelector(state => state.auth);
  const themeKey = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.language.language);
  const colors = themes[themeKey];
  const t = translations[language];

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalUploads: 0,
    daysUntilNextEnd: null,
  });

  const calculateStats = useCallback((eventsList) => {
    const now = new Date();
    const active = eventsList.filter(
      (e) => (e.rentalEnd ? new Date(e.rentalEnd) > now : true)
    ).length;

    const upcomingEnds = eventsList
      .filter((e) => e.rentalEnd && new Date(e.rentalEnd) > now)
      .map((e) => new Date(e.rentalEnd))
      .sort((a, b) => a - b);

    const daysUntilNext =
      upcomingEnds.length > 0
        ? Math.ceil((upcomingEnds[0] - now) / (1000 * 60 * 60 * 24))
        : null;

    setStats({
      totalEvents: eventsList.length,
      activeEvents: active,
      totalUploads: eventsList.reduce(
        (sum, e) => sum + (e.uploadCount || 0),
        0
      ),
      daysUntilNextEnd: daysUntilNext,
    });
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchEvents();
      const eventsList = data || [];
      setEvents(eventsList);
      calculateStats(eventsList);
    } catch (error) {
      console.error("Events fetch error", error);
      Alert.alert("Memory", t.errorOccurred);
    } finally {
      setLoading(false);
    }
  }, [t.errorOccurred, calculateStats]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const handleInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateEvent = async () => {
    if (!form.name.trim()) {
      Alert.alert("Memory", t.eventNameLabel);
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const rentalDuration = Number(form.rentalDurationDays) || 1;
      const rentalEnd = new Date(now);
      rentalEnd.setDate(rentalEnd.getDate() + rentalDuration);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        rentalStart: now.toISOString(),
        rentalEnd: rentalEnd.toISOString(),
        retentionDays: Number(form.retentionDays) || 30,
      };

      await createEvent(payload);
      setForm(initialForm);
      setModalVisible(false);
      loadEvents();
      Alert.alert("Memory", language === "tr" ? "Etkinlik oluşturuldu" : "Event created");
    } catch (error) {
      console.error("Create event error", error);
      Alert.alert("Memory", t.errorOccurred);
    } finally {
      setSubmitting(false);
    }
  };

  const recentEvents = useMemo(() => events.slice(0, 3), [events]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.welcome, { color: colors.text }]}>
                {t.homeWelcome}, {user?.name || t.user}
              </Text>
              <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
                {t.homeSubtitle}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.cardElevated }]}>
          <MaterialCommunityIcons name="qrcode" size={46} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t.createEventCardTitle}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.secondaryText }]}>
              {t.createEventCardSubtitle}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: colors.buttonBackground }]}
            onPress={() => navigation.navigate('CreateEvent')}
          >
            <Feather name="plus" size={22} color={colors.buttonText} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.statistics || "İstatistikler"}
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="calendar"
              value={stats.totalEvents}
              label={t.totalEvents || "Toplam Etkinlik"}
              colors={colors}
            />
            <StatCard
              icon="check-circle"
              value={stats.activeEvents}
              label={t.activeEvents || "Aktif Etkinlik"}
              colors={colors}
            />
            <StatCard
              icon="image"
              value={stats.totalUploads}
              label={t.totalUploads || "Yüklenen Dosya"}
              colors={colors}
            />
            <StatCard
              icon="clock"
              value={stats.daysUntilNextEnd !== null ? `${stats.daysUntilNextEnd}` : "-"}
              label={t.daysUntilEnd || "Gün Kaldı"}
              colors={colors}
              suffix={stats.daysUntilNextEnd !== null ? " gün" : ""}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.recentEvents}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.secondaryText, marginTop: 8 }}>{t.loading}</Text>
          </View>
        ) : recentEvents.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={32} color={colors.secondaryText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.emptyEventsTitle}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
              {t.emptyEventsSubtitle}
            </Text>
          </View>
        ) : (
          recentEvents.map(event => (
            <EventCard key={event._id} event={event} colors={colors} t={t} />
          ))
        )}

        <TouchableOpacity
          style={[styles.activitiesButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate("Activities")}
        >
          <Text style={[styles.activitiesText, { color: colors.primary }]}>{t.goToActivities}</Text>
          <Feather name="arrow-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalBackdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
            <ScrollView
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t.newEventTitle}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={22} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
              {[
                ["name", t.eventNameLabel],
                ["rentalDurationDays", t.rentalDurationLabel],
                ["retentionDays", t.retentionLabel],
              ].map(([key, label]) => (
                <View key={key} style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
                  <TextInput
                    keyboardType={key === "name" ? "default" : "number-pad"}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={form[key]}
                    onChangeText={value => handleInput(key, value)}
                    placeholder={label}
                    placeholderTextColor={colors.secondaryText}
                  />
                </View>
              ))}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.secondaryText }]}>{t.descriptionLabel}</Text>
                <TextInput
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.textarea,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={form.description}
                  onChangeText={value => handleInput("description", value)}
                  placeholder={t.descriptionLabel}
                  placeholderTextColor={colors.secondaryText}
                />
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={[styles.secondaryText, { color: colors.secondaryText }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.buttonBackground, opacity: submitting ? 0.6 : 1 },
                  ]}
                  onPress={handleCreateEvent}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.buttonText} />
                  ) : (
                    <Text style={[styles.primaryText, { color: colors.buttonText }]}>{t.createEventButton}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const formatDate = value => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const StatCard = ({ icon, value, label, colors, suffix = "" }) => (
  <View style={[styles.statCard, { backgroundColor: colors.card }]}>
    <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    <Text style={[styles.statValue, { color: colors.text }]}>
      {value}{suffix}
    </Text>
    <Text style={[styles.statLabel, { color: colors.secondaryText }]}>
      {label}
    </Text>
  </View>
);

const EventCard = ({ event, colors, t }) => {
  const isActive =
    event.rentalEnd ? new Date(event.rentalEnd) > new Date() : true;
  return (
    <View style={[styles.eventCard, { backgroundColor: colors.card }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eventTitle, { color: colors.text }]}>{event.name}</Text>
        <Text style={{ color: colors.secondaryText }}>{formatDate(event.eventDate)}</Text>
        <Text style={{ color: colors.secondaryText }}>{event.venue || "-"}</Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: colors.chip }]}>
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {isActive ? t.eventStatusActive : t.eventStatusEnded}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 70,
    height: 70,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  statsSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  heroButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingWrap: {
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
  eventCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activitiesButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activitiesText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalBody: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  inputGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1.5,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryText: {
    fontWeight: "600",
    fontSize: 15,
  },
});

export default HomeScreen;