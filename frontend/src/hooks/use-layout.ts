import { useWindowDimensions } from 'react-native';

import { WideLayoutMinWidth } from '@/constants/theme';

/** true en pantallas anchas (escritorio/tablet horizontal): la barra lateral se muestra fija. */
export function useIsWideLayout() {
  const { width } = useWindowDimensions();
  return width >= WideLayoutMinWidth;
}
