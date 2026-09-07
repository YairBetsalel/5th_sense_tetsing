import * as Haptics from 'expo-haptics';

// Supported Strength of Vibration by iPhone
export type VibrationStrength =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'soft'
  | 'rigid'
  | 'success'
  | 'warning'
  | 'error';

// Triggers iPhone Vibration
export async function vibrate(strength: VibrationStrength = 'medium'): Promise<void> {
  try {
    switch (strength) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'soft':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        break;
      case 'rigid':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch (error) {
    console.warn('Haptics failed to trigger:', error);
  }
}