import { Redirect } from 'expo-router';

/** La pantalla principal es la de incidencias. */
export default function Index() {
  return <Redirect href="/incidents" />;
}
