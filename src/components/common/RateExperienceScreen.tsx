import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal, TextInput, Pressable,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { Star, CheckCircle2, X } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { submitRating } from '../../api/ordersApi';
import { useOrders } from '../../context/OrderContext';

interface RateExperienceScreenProps {
  visible: boolean;
  onClose: () => void;
  pharmacyName?: string;
  orderId?: string;
}

export const RateExperienceScreen: React.FC<RateExperienceScreenProps> = ({
  visible,
  onClose,
  pharmacyName = 'MediCare Central Pharmacy',
  orderId,
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { fetchOrders } = useOrders();
  const [overallRating, setOverallRating]   = useState(5);
  const [serviceRating, setServiceRating]   = useState(5);
  const [availRating, setAvailRating]       = useState(5);
  const [pickupRating, setPickupRating]     = useState(5);
  const [comments, setComments]             = useState('');
  const [submitted, setSubmitted]           = useState(false);

  const handleSubmit = async () => {
    try {
      if (orderId) {
        await submitRating(orderId, {
          rating: {
            overall: overallRating,
            service: serviceRating,
            availability: availRating,
            pickup: pickupRating,
          },
          comment: comments,
        });
        await fetchOrders();
      }
    } catch (e) {
      console.log('Failed to submit rating', e);
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  const renderStars = (currentRating: number, onSelect: (rating: number) => void, size = 20) => (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onSelect(star)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <Star
            color={star <= currentRating ? '#F59E0B' : colors.borderSoft}
            fill={star <= currentRating ? '#F59E0B' : 'transparent'}
            size={size}
            strokeWidth={2}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.overlay, Platform.OS === 'web' && { height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 } as any]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={{ flex: 1, height: '100%', width: '100%', position: 'absolute' }} onPress={onClose} />
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Rate Your Experience</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={s.successBox}>
              <CheckCircle2 color={colors.midTeal} size={52} strokeWidth={2} />
              <Text style={s.successTitle}>Review Submitted!</Text>
              <Text style={s.successSub}>Thank you for rating {pharmacyName}.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
              {/* Question 1: Overall */}
              <View style={s.mainQuestionBox}>
                <Text style={s.mainQuestionLabel}>How was your overall experience?</Text>
                {renderStars(overallRating, setOverallRating, 32)}
              </View>

              <View style={s.divider} />

              {/* Sub Questions */}
              <View style={s.subQuestionsWrap}>
                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Pharmacy Service</Text>
                  {renderStars(serviceRating, setServiceRating, 22)}
                </View>

                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Product Availability</Text>
                  {renderStars(availRating, setAvailRating, 22)}
                </View>

                <View style={s.questionRow}>
                  <Text style={s.questionLabel}>Counter Pick Up Experience</Text>
                  {renderStars(pickupRating, setPickupRating, 22)}
                </View>
              </View>

              {/* Comments */}
              <View style={s.inputBox}>
                <Text style={s.inputLabel}>Additional comments (optional)</Text>
                <TextInput
                  style={s.textInput}
                  placeholder="Type here..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  value={comments}
                  onChangeText={setComments}
                />
              </View>

              {/* Actions */}
              <Button
                title="Submit Review"
                variant="primary"
                onPress={handleSubmit}
                style={{ marginTop: 4 }}
              />

              <TouchableOpacity style={s.skipBtn} onPress={onClose}>
                <Text style={s.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, maxHeight: '90%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  headerTitle: { fontFamily: FONTS.black, fontSize: 18, color: colors.textDark },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingTop: 16, gap: 16 },

  mainQuestionBox: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  mainQuestionLabel: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textSecondary },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },

  divider: { height: 1, backgroundColor: colors.borderSoft },

  subQuestionsWrap: { gap: 14 },
  questionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  questionLabel: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textSecondary },

  inputBox: { gap: 6 },
  inputLabel: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  textInput: {
    backgroundColor: colors.surfaceSubtle, borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft,
    padding: 12, height: 80, textAlignVertical: 'top',
    fontFamily: FONTS.regular, fontSize: 13, color: colors.textDark,
  },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textMuted },

  successBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  successTitle: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark },
  successSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
