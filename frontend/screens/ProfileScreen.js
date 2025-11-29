import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { themes } from "../utils/themes";
import { translations } from "../utils/translations";
import { setTheme } from "../redux/slice/themeSlice";
import { setLanguage } from "../redux/slice/languageSlice";
import { logoutUser } from "../redux/slice/authSlice";

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const themeKey = useSelector(state => state.theme.theme);
  const language = useSelector(state => state.language.language);
  const colors = themes[themeKey];
  const t = translations[language];

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const handleSave = () => {
    Alert.alert(
      "Memory",
      language === "tr"
        ? "Bilgileriniz yakında güncellenecek."
        : "Profile updates will be available soon."
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPassword("");
  };

  const toggleTheme = value => {
    dispatch(setTheme(value ? "dark" : "light"));
  };

  const changeLanguage = value => {
    dispatch(setLanguage(value));
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t.profileTitle}</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {t.profileSubtitle}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t.personalInfo}
              </Text>
            </View>
            {!isEditing && (
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.primary + "15" }]}
                onPress={() => setIsEditing(true)}
              >
                <Feather name="edit-2" size={14} color={colors.primary} />
                <Text style={[styles.editButtonText, { color: colors.primary }]}>
                  {t.editProfile}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {!isEditing ? (
            <>
              <InfoRow label={t.nameLabel} value={name || "-"} colors={colors} />
              <Divider colors={colors} />
              <InfoRow label={t.emailLabel} value={email || "-"} colors={colors} />
            </>
          ) : (
            <>
              <InputField
                label={t.nameLabel}
                value={name}
                onChangeText={setName}
                colors={colors}
              />
              <InputField
                label={t.emailLabel}
                value={email}
                onChangeText={setEmail}
                colors={colors}
                keyboardType="email-address"
              />
              <InputField
                label={t.passwordLabel}
                value={password}
                onChangeText={setPassword}
                colors={colors}
                secureTextEntry
                placeholder="********"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.border }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.secondaryText, { color: colors.secondaryText }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.buttonBackground }]}
                  onPress={handleSave}
                >
                  <Text style={[styles.primaryText, { color: colors.buttonText }]}>{t.saveChanges}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons
              name="palette-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.themeSelection}
            </Text>
          </View>
          <Row
            label={themeKey === "dark" ? t.darkTheme : t.lightTheme}
            colors={colors}
            control={
              <Switch
                value={themeKey === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.muted, true: colors.primary + "80" }}
                thumbColor={themeKey === "dark" ? colors.primary : "#FFF"}
                ios_backgroundColor={colors.muted}
              />
            }
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons
              name="translate"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.languageSelection}
            </Text>
          </View>
          <View style={styles.languageRow}>
            {["tr", "en"].map((code, index) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.languageChip,
                  {
                    backgroundColor:
                      language === code ? colors.primary : colors.inputBackground,
                    marginRight: index === 0 ? 12 : 0,
                  },
                ]}
                onPress={() => changeLanguage(code)}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    {
                      color: language === code ? colors.buttonText : colors.text,
                    },
                  ]}
                >
                  {code === "tr" ? t.languageTurkish : t.languageEnglish}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeaderLeft}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t.exploreMore}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.menuButton, { borderColor: colors.border }]}
            onPress={() => setShowAboutModal(true)}
          >
            <MaterialCommunityIcons
              name="information-variant"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.menuButtonText, { color: colors.text }]}>
              {t.aboutButton}
            </Text>
            <Feather name="chevron-right" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuButton, { borderColor: colors.border }]}
            onPress={() => setShowFaqModal(true)}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.menuButtonText, { color: colors.text }]}>{t.faqButton}</Text>
            <Feather name="chevron-right" size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={[styles.logoutCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.danger }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#fff" />
            <Text style={[styles.logoutText, { color: "#fff" }]}>{t.logout}</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showAboutModal} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <MaterialCommunityIcons
                    name="information-variant"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {t.aboutApp}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => setShowAboutModal(false)}
                >
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalText, { color: colors.secondaryText }]}>
                  {t.aboutContentShort}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showFaqModal} animationType="slide" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, { backgroundColor: colors.modalBackground }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t.faqTitle}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalCloseButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => setShowFaqModal(false)}
                >
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalText, { color: colors.secondaryText }]}>
                  {t.faqContent}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const InputField = ({ label, colors, ...rest }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: colors.secondaryText }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: colors.inputBackground,
          color: colors.text,
          borderColor: colors.border,
        },
      ]}
      placeholderTextColor={colors.secondaryText}
      {...rest}
    />
  </View>
);

const InfoRow = ({ label, value, colors }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const Divider = ({ colors }) => (
  <View style={[styles.divider, { backgroundColor: colors.border }]} />
);

const Row = ({ label, control, colors }) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
    {control}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 8,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  languageRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  languageChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  languageChipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  infoRow: {
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  menuButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  logoutCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  logoutButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  modalText: {
    fontSize: 15,
    lineHeight: 24,
  },
});

export default ProfileScreen;

