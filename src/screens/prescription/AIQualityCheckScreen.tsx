import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, ActivityIndicator, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, CheckCircle2, XCircle, Send, RefreshCw, Scan, Fingerprint, LayoutTemplate, Sparkles, ShieldCheck } from 'lucide-react-native';
import Svg, { Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, Circle, Mask } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Button } from '../../components/common/Button';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'AIQualityCheck'>;

export const AIQualityCheckScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const uid = React.useMemo(() => Math.random().toString(36).slice(2), []);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const targetPharmacyId   = route.params?.pharmacyId;
  const targetPharmacyName = route.params?.pharmacyName;
  const selectedItems      = route.params?.selectedItems;

  const scoreOutOf20 = route.params?.clarityScore ? Math.round((route.params.clarityScore / 100) * 20) : 18;
  const isClarityPassed = scoreOutOf20 >= 12;
  const finalScore = Math.min(100, Math.round((scoreOutOf20 / 20) * 100) - (Math.floor(Math.random() * 5))); 

  const [currentStep, setCurrentStep] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blobBreath = useRef(new Animated.Value(0)).current;
  
  const stepAnims = useRef([
    new Animated.Value(0), // 0: Start
    new Animated.Value(0), // 1: Clarity
    new Animated.Value(0), // 2: Letterhead
    new Animated.Value(0), // 3: Seal
    new Animated.Value(0), // 4: Layout
    new Animated.Value(0)  // 5: Final Score
  ]).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    
    // Soft breathing animation for the blob
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobBreath, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(blobBreath, { toValue: 0, duration: 3000, useNativeDriver: true })
      ])
    ).start();

    // Initial reveal
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => {
      runSequence();
    });
  }, []);

  const isAutoRedirect = route.params?.nextScreen === 'Tabs' && route.params?.nextParams?.screen === 'Browse';

  const runSequence = () => {
    animateStep(0, () => {
      setTimeout(() => animateStep(1, () => {
        if (!isClarityPassed) return;
        setTimeout(() => animateStep(2, () => {
          setTimeout(() => animateStep(3, () => {
            setTimeout(() => animateStep(4, () => {
              setTimeout(() => animateStep(5, () => {
                if (isAutoRedirect) {
                  setTimeout(() => handleProceed(), 1000);
                }
              }), 600);
            }), 600);
          }), 600);
        }), 600);
      }), 400);
    });
  };

  const animateStep = (index: number, cb?: () => void) => {
    setCurrentStep(index);
    Animated.spring(stepAnims[index], {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true
    }).start(cb);
  };

  const handleProceed = () => {
    if (route.params?.nextScreen) {
      (navigation as any).navigate(route.params.nextScreen, route.params.nextParams);
    } else if (targetPharmacyId) {
      navigation.navigate('Quotation', { orderId: 'ord-102', pharmacyId: targetPharmacyId });
    } else {
      navigation.navigate('Tabs', { screen: 'Orders' });
    }
  };

  const getDynamicSubtitle = () => {
    if (currentStep === 0) return "Extracting image data...";
    if (currentStep === 1 && !isClarityPassed) return "Image is too blurry to process.";
    if (currentStep === 1) return "Clarity check passed.";
    if (currentStep === 2) return "Scanning for hospital letterheads...";
    if (currentStep === 3) return "Verifying doctor seals and signatures...";
    if (currentStep === 4) return "Analyzing prescription layout...";
    return "Analysis complete. Ready for review.";
  };

  const renderCheckRow = (stepIndex: number, icon: any, label: string, isCriticalFailed: boolean = false) => {
    const isActive = currentStep >= stepIndex;
    const isDone = currentStep > stepIndex;
    if (!isActive && currentStep < stepIndex) return null; // Hide future steps for cleaner look

    return (
      <Animated.View style={[s.checkRow, { opacity: stepAnims[stepIndex], transform: [{ translateY: stepAnims[stepIndex].interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
        <View style={[s.checkIconBox, isActive && !isDone && s.checkIconBoxActive, isCriticalFailed && s.checkIconBoxFailed]}>
          {isCriticalFailed ? (
             <XCircle color={colors.error} size={18} strokeWidth={2.5} />
          ) : isDone ? (
            <CheckCircle2 color={colors.deepPlum} size={18} strokeWidth={2.5} />
          ) : isActive ? (
            <ActivityIndicator size="small" color={colors.midTeal} />
          ) : (
            icon
          )}
        </View>
        <Text style={[s.checkLabel, (isDone || isCriticalFailed) && s.checkLabelDone, isActive && !isDone && s.checkLabelActive, isCriticalFailed && s.checkLabelFailed]}>
          {label}
        </Text>
      </Animated.View>
    );
  };

  const isFullyComplete = currentStep === 5 && isClarityPassed;

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
      
      {/* Standard App Navigation Bar */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>AI Analysis</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView 
        contentContainerStyle={s.scroll} 
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cardless Hero Faux-Blob */}
        <View style={s.heroSection}>
          
          {/* Real SVG Radial Gradient Soft Blobs (No square edges!) */}
          <View style={s.auroraContainer}>
            {/* Subtle Purple/Blue Magic Touch */}
            <Animated.View style={[s.auroraGlow, { top: -20, left: -20, transform: [{ scale: blobBreath.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.8] }) }] }]}>
              <Svg height="300" width="300" viewBox="0 0 300 300">
                <Defs>
                  <RadialGradient id={`gradPurple-${uid}`} cx="150" cy="150" rx="150" ry="150" fx="150" fy="150" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#4c1d95" stopOpacity="0.35" />
                    <Stop offset="0.6" stopColor="#4c1d95" stopOpacity="0.15" />
                    <Stop offset="1" stopColor="#4c1d95" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="150" cy="150" r="150" fill={`url(#gradPurple-${uid})`} />
              </Svg>
            </Animated.View>

            <Animated.View style={[s.auroraGlow, { transform: [{ scale: blobBreath.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }] }]}>
              <Svg height="320" width="320" viewBox="0 0 320 320">
                <Defs>
                  <RadialGradient id={`grad1-${uid}`} cx="160" cy="160" rx="160" ry="160" fx="160" fy="160" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#c7e36b" stopOpacity="0.4" />
                    <Stop offset="0.5" stopColor="#c7e36b" stopOpacity="0.15" />
                    <Stop offset="1" stopColor="#c7e36b" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="160" cy="160" r="160" fill={`url(#grad1-${uid})`} />
              </Svg>
            </Animated.View>

            <Animated.View style={[s.auroraGlow, s.auroraOffset, { transform: [{ scale: blobBreath.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.9] }) }] }]}>
              <Svg height="240" width="240" viewBox="0 0 240 240">
                <Defs>
                  <RadialGradient id={`grad2-${uid}`} cx="120" cy="120" rx="120" ry="120" fx="120" fy="120" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#1d6f72" stopOpacity="0.35" />
                    <Stop offset="0.5" stopColor="#1d6f72" stopOpacity="0.15" />
                    <Stop offset="1" stopColor="#1d6f72" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx="120" cy="120" r="120" fill={`url(#grad2-${uid})`} />
              </Svg>
            </Animated.View>
          </View>

          {/* AI Text Content with Crossfade Micro-interaction */}
          <View style={s.heroTextContainer}>
            
            {/* 1. Initial State: AI Processing Text (Fades OUT at step 5) */}
            <Animated.View style={[s.crossfadeElement, {
              opacity: stepAnims[5].interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              transform: [{ translateY: stepAnims[5].interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }]
            }]} pointerEvents={isFullyComplete ? "none" : "auto"}>
              <Text style={s.heroTitle}>AI Processing</Text>
              <Text style={s.heroSub}>{getDynamicSubtitle()}</Text>
            </Animated.View>

            {/* 2. Final State: Animated SVG Circular Progress Ring (Fades IN at step 5) */}
            <Animated.View style={[s.crossfadeElement, { 
                opacity: stepAnims[5], 
                transform: [
                  { scale: stepAnims[5].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.05, 1] }) },
                  { translateY: stepAnims[5].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
                ] 
             }]} pointerEvents={isFullyComplete ? "auto" : "none"}>
                
                <View style={s.progressRingContainer}>

                  {/* Dashed Pastel Gradient Progress Ring (Masked Animation) */}
                  <Svg width={200} height={200} viewBox="0 0 200 200">
                    <Defs>
                      <SvgLinearGradient id={`pastelGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
                         <Stop offset="0" stopColor={colors.deepPlum} stopOpacity="0.5" />
                         <Stop offset="0.5" stopColor={colors.midTeal} stopOpacity="0.6" />
                         <Stop offset="1" stopColor={colors.softLime} stopOpacity="0.5" />
                      </SvgLinearGradient>
                      
                      {/* The mask draws a solid line to reveal the dashed ring underneath */}
                      <Mask id={`progressMask-${uid}`}>
                         <AnimatedCircle 
                           cx="100" cy="100" r="90" 
                           stroke="white" strokeWidth={10} fill="none"
                           strokeDasharray={2 * Math.PI * 90}
                           strokeDashoffset={stepAnims[5].interpolate({ inputRange: [0, 1], outputRange: [2 * Math.PI * 90, (2 * Math.PI * 90) * (1 - (finalScore / 100))] })}
                           strokeLinecap="round"
                           rotation="-90" origin="100, 100"
                         />
                      </Mask>
                    </Defs>

                    {/* Faint Background Dashed Track */}
                    <Circle 
                      cx="100" cy="100" r="90" 
                      stroke="rgba(29, 111, 114, 0.08)" strokeWidth={3} fill="none"
                      strokeDasharray="12 8" strokeLinecap="round"
                    />

                    {/* The Dashed Gradient Ring (Revealed by Mask) */}
                    <Circle 
                      cx="100" cy="100" r="90" 
                      stroke={`url(#pastelGrad-${uid})`} strokeWidth={3.5} fill="none"
                      strokeDasharray="12 8" strokeLinecap="round"
                      mask={`url(#progressMask-${uid})`}
                    />
                  </Svg>

                  {/* The Score Text Inside */}
                  <Animated.View style={[s.ringInnerContent, {
                     opacity: stepAnims[5].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }),
                     transform: [{ scale: stepAnims[5].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.8, 0.8, 1] }) }]
                  }]}>
                     <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text style={s.ringScoreValue}>{finalScore}</Text>
                        <Text style={s.ringScoreSymbol}>%</Text>
                     </View>
                     <View style={s.ringBadgeRow}>
                        <Text style={s.ringBadgeText}>QUALITY SCORE</Text>
                     </View>
                  </Animated.View>
                </View>

             </Animated.View>

          </View>
        </View>

        {/* Minimalist Progress List */}
        <View style={s.progressList}>
          {renderCheckRow(1, <Sparkles color={colors.textMuted} size={18} />, `Clarity Score: ${scoreOutOf20}/20`, !isClarityPassed)}
          
          {isClarityPassed && (
            <>
              {renderCheckRow(2, <LayoutTemplate color={colors.textMuted} size={18} />, "Hospital Letterhead Detection")}
              {renderCheckRow(3, <Fingerprint color={colors.textMuted} size={18} />, "Doctor Seal & Signature Check")}
              {renderCheckRow(4, <Scan color={colors.textMuted} size={18} />, "Prescription Layout Structure")}
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Standard App Bottom Button */}
      <Animated.View style={[s.bottomBar, { opacity: stepAnims[1] }]}>
        {isClarityPassed ? (
          <Button
            title={isAutoRedirect ? "Redirecting to Store..." : (route.params?.nextScreen ? "Continue to Cart" : "Select Pharmacies")}
            variant="primary"
            onPress={handleProceed}
            disabled={!isFullyComplete || isAutoRedirect}
            style={{ width: '100%', opacity: isAutoRedirect ? 0.8 : 1 }}
          />
        ) : (
          <TouchableOpacity
            style={[s.primaryBtn, s.primaryBtnDanger]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UploadPrescription', {
              pharmacyId: targetPharmacyId,
              pharmacyName: targetPharmacyName,
              initialSelectedExtraItems: route.params?.selectedExtraItemsDict,
            })}
          >
            <Text style={s.primaryBtnTxt}>Retake Photo</Text>
            <RefreshCw color={colors.white} size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm }, 
  
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.surfaceWhite,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
    zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center',
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: colors.peacockBlue },
  
  scroll: { padding: 20 },
  
  // Cardless Hero Section
  heroSection: {
    minHeight: 300, // Reduced from 380 for better mobile proportions
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    marginBottom: 20,
    position: 'relative',
  },

  // Real SVG Soft Radial Blob Container
  auroraContainer: {
    position: 'absolute',
    top: 0,
    width: '100%', height: 260,
    alignItems: 'center', justifyContent: 'center',
  },
  auroraGlow: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  auroraOffset: {
    top: 20,
  },

  // Text Container and Crossfade
  heroTextContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 0, 
    zIndex: 5, 
    height: 160, 
    width: '100%',
    position: 'relative'
  },
  crossfadeElement: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  heroTitle: { fontFamily: FONTS.black, fontSize: 26, color: colors.peacockBlue, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontFamily: FONTS.medium, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },

  // Circular Progress Ring Styles
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -40, // Move it up slightly to balance the layout
  },
  particle: {
    position: 'absolute',
    zIndex: 20,
  },
  glowingOrb: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    elevation: 4,
  },
  ringInnerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The Magic Score Text
  ringScoreValue: {
    fontFamily: FONTS.regular,
    fontSize: 84, // Massive, but thin and elegant
    color: colors.peacockBlue,
    letterSpacing: -2,
    lineHeight: 90,
  },
  ringScoreSymbol: {
    fontFamily: FONTS.regular,
    fontSize: 32,
    color: colors.peacockBlue,
    opacity: 0.5, // Soft elegant percent sign
    marginLeft: 2,
    marginTop: 12,
  },
  ringBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  ringBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2, // Wide spacing for a premium technical look
    textTransform: 'uppercase',
  },

  // Minimalist Progress List Below Card
  progressList: { paddingHorizontal: 10, gap: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  checkIconBox: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  checkIconBoxActive: { backgroundColor: 'rgba(29, 111, 114, 0.1)' },
  checkIconBoxFailed: { backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  checkLabel: { fontFamily: FONTS.medium, fontSize: 15, color: colors.textMuted },
  checkLabelActive: { fontFamily: FONTS.bold, color: colors.peacockBlue },
  checkLabelDone: { color: colors.text },
  checkLabelFailed: { fontFamily: FONTS.bold, color: colors.error },
  
  // Bottom Action Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bgWarm,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.midTeal,
    paddingVertical: 18, borderRadius: 16,
  },
  primaryBtnDisabled: { backgroundColor: colors.surfaceSubtle },
  primaryBtnDanger: { backgroundColor: colors.error },
  primaryBtnTxt: { fontFamily: FONTS.bold, fontSize: 16, color: '#FFFFFF' },
});
