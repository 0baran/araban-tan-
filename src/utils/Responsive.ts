import {Dimensions, PixelRatio, Platform} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Standard design width and height (e.g., iPhone 11/12/13 Pro scale)
const scale = SCREEN_WIDTH / 390;
const scaleHeight = SCREEN_HEIGHT / 844;

/**
 * Ölçeklendirilmiş genişlik (Responsive Width)
 */
export function rw(size: number): number {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * Ölçeklendirilmiş yükseklik (Responsive Height)
 */
export function rh(size: number): number {
  const newSize = size * scaleHeight;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * Responsive Font Size (Metin boyutlandırma)
 */
export function rf(size: number, maxScale = 1.2): number {
  const newSize = size * scale;
  const pixelRatioScaled = PixelRatio.roundToNearestPixel(newSize);

  // Fontun aşırı büyümesini engellemek için sınır
  if (pixelRatioScaled > size * maxScale) {
    return size * maxScale;
  }
  return Platform.OS === 'ios'
    ? Math.round(pixelRatioScaled)
    : Math.round(pixelRatioScaled) - 1;
}

/**
 * Responsive Padding/Margin/BorderRadius
 */
export function rs(size: number): number {
  return rw(size);
}
