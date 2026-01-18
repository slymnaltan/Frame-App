import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
  Share,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { themes } from "../utils/themes";
import { translations } from "../utils/translations";
import { fetchEvents, getDownloadLink, deleteEvent } from "../services/eventService";
import GradientBackground from "../components/GradientBackground";

const ActivitiesScreen = () => {
  const token = useSelector(state => state.auth.token);
  const themeKey = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.language.language);
  const colors = themes[themeKey];
  const t = translations[language];

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const { data } = await fetchEvents();
      setEvents(data || []);
    } catch (error) {
      console.error("Activities fetch error", error);
      Alert.alert("Memory", t.errorOccurred);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t.errorOccurred]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const openEventDetails = async event => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleShareLink = async () => {
    if (!selectedEvent) return;
    try {
      await Share.share({
        message: selectedEvent.uploadUrl,
        url: selectedEvent.uploadUrl,
      });
    } catch (error) {
      console.error("Share error", error);
      Alert.alert("Memory", t.errorOccurred);
    }
  };

  const handleDownloadQRPDF = async () => {
    if (!selectedEvent?.qrCodeImage) return;

    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                margin: 0;
              }
              .container {
                text-align: center;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #333;
              }
              .qr-code {
                margin: 20px 0;
              }
              .url {
                margin-top: 20px;
                font-size: 12px;
                color: #666;
                word-break: break-all;
              }
              .event-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="event-name">${selectedEvent.name || "Event QR Code"}</div>
              <div class="qr-code">
                <img src="${selectedEvent.qrCodeImage}" width="300" height="300" />
              </div>
              <div class="url">${selectedEvent.uploadUrl || ""}</div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      const fileName = `QR-${selectedEvent.name?.replace(/[^a-z0-9]/gi, "_") || "event"}-${selectedEvent._id}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: fileUri,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: t.downloadQR || "Download QR Code",
        });
      } else {
        Alert.alert(
          "Memory",
          language === "tr"
            ? "PDF oluşturuldu ancak paylaşım mevcut değil."
            : "PDF created but sharing is not available."
        );
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Memory", t.errorOccurred);
    }
  };

  const handleDownload = async event => {
    if (!event) return;
    try {
      const url = getDownloadLink(event._id, token);
      await Linking.openURL(url);
    } catch (error) {
      console.error("Download link error", error);
      Alert.alert("Memory", t.errorOccurred);
    }
  };

  const handleDeleteEvent = async (event) => {
    Alert.alert(
      language === 'tr' ? 'Etkinliği Sil' : 'Delete Event',
      language === 'tr' 
        ? `"${event.name}" etkinliğini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
        : `Are you sure you want to delete "${event.name}"? This action cannot be undone.`,
      [
        {
          text: language === 'tr' ? 'İptal' : 'Cancel',
          style: 'cancel',
        },
        {
          text: language === 'tr' ? 'Sil' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event._id);
              Alert.alert(
                'Memory',
                language === 'tr' ? 'Etkinlik başarıyla silindi' : 'Event deleted successfully'
              );
              loadEvents(); // Listeyi yenile
            } catch (error) {
              console.error('Delete event error:', error);
              Alert.alert('Memory', t.errorOccurred);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isActive =
      item.rentalEnd ? new Date(item.rentalEnd) > new Date() : true;
    const canDownload =
      item.rentalEnd ? new Date(item.rentalEnd) <= new Date() : false;
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: colors.chip,
              },
            ]}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {isActive ? t.eventStatusActive : t.eventStatusEnded}
            </Text>
          </View>
        </View>
        {!!item.rentalEnd && (
          <Text style={[styles.cardSubtitle, { color: colors.secondaryText }]}>
            {t.rentalEndLabel}: {formatDate(item.rentalEnd)}
          </Text>
        )}
        <View style={styles.cardActions}>
          <ActionButton
            icon="eye"
            label={t.viewDetails}
            colors={colors}
            onPress={() => openEventDetails(item)}
          />
          <ActionButton
            icon="download"
            label={t.downloadArchive}
            colors={colors}
            onPress={() => handleDownload(item)}
            disabled={!canDownload}
          />
          <ActionButton
            icon="trash-2"
            label={language === 'tr' ? 'Sil' : 'Delete'}
            colors={colors}
            onPress={() => handleDeleteEvent(item)}
            isDelete={true}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientBackground />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t.activitiesTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          {t.activitiesSubtitle}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={40}
                color={colors.secondaryText}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.emptyEventsTitle}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
                {t.emptyEventsSubtitle}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Feather name="arrow-left" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedEvent?.name}
            </Text>
            <TouchableOpacity onPress={handleShareLink}>
              <Feather name="share-2" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <InfoRow
              label={t.rentalStartLabel}
              value={formatDate(selectedEvent?.rentalStart)}
              colors={colors}
            />
            <InfoRow
              label={t.rentalEndLabel}
              value={formatDate(selectedEvent?.rentalEnd)}
              colors={colors}
            />
            <InfoRow
              label={t.storageExpiresLabel}
              value={formatDate(selectedEvent?.storageExpiresAt)}
              colors={colors}
            />
            <InfoRow
              label={t.planLabel}
              value={`${selectedEvent?.pricingPlan || "-"}`}
              colors={colors}
            />
            {selectedEvent?.description ? (
              <View style={[styles.descriptionBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.descriptionLabel, { color: colors.secondaryText }]}>
                  {t.descriptionLabel}
                </Text>
                <Text style={{ color: colors.text }}>{selectedEvent.description}</Text>
              </View>
            ) : null}

            {selectedEvent?.qrCodeImage ? (
              <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.qrTitle, { color: colors.text }]}>{t.showQr}</Text>
                <Image
                  source={{ uri: selectedEvent.qrCodeImage }}
                  style={{ width: 180, height: 180, alignSelf: "center", marginVertical: 12 }}
                />
                <Text style={{ textAlign: "center", color: colors.secondaryText }}>
                  {t.qrHint}
                </Text>
                <View style={styles.qrButtons}>
                  <TouchableOpacity
                    style={[
                      styles.qrButton,
                      styles.shareButton,
                      { backgroundColor: colors.buttonBackground },
                    ]}
                    onPress={handleShareLink}
                  >
                    <Feather name="share-2" size={16} color={colors.buttonText} />
                    <Text style={[styles.shareText, { color: colors.buttonText }]}>
                      {t.shareUploadLink}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.qrButton,
                      styles.pdfButton,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={handleDownloadQRPDF}
                  >
                    <Feather name="download" size={16} color={colors.primary} />
                    <Text style={[styles.pdfText, { color: colors.primary }]}>
                      {t.downloadQR || "PDF İndir"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Yüklenen resimler listesi kaldırıldı */}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const ActionButton = ({ icon, label, colors, onPress, disabled, isDelete }) => (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      { 
        borderColor: isDelete ? colors.danger : colors.border, 
        opacity: disabled ? 0.4 : 1 
      },
    ]}
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
  >
    <Feather name={icon} size={16} color={isDelete ? colors.danger : colors.primary} />
    <Text style={[styles.actionText, { color: isDelete ? colors.danger : colors.primary }]}>{label}</Text>
  </TouchableOpacity>
);

const InfoRow = ({ label, value, colors }) => (
  <View style={styles.infoRow}>
    <Text style={{ color: colors.secondaryText, fontSize: 13 }}>{label}</Text>
    <Text style={{ color: colors.text, fontWeight: "600" }}>{value || "-"}</Text>
  </View>
);

const formatDate = value => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  empty: {
    marginTop: 60,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: "center",
    marginTop: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  descriptionBox: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  qrCard: {
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  qrButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  qrButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  shareButton: {
    // backgroundColor handled inline
  },
  pdfButton: {
    borderWidth: 1.5,
    // backgroundColor and borderColor handled inline
  },
  shareText: {
    fontWeight: "600",
    fontSize: 14,
  },
  pdfText: {
    fontWeight: "600",
    fontSize: 14,
  },
  uploadsHeader: {
    marginTop: 24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  uploadsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  uploadCard: {
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});

export default ActivitiesScreen;

