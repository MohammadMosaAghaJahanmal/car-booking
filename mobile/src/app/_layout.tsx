import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from '@/context/auth';

export default function RootLayout(){
 return <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY||''} urlScheme="carbooking">
  <AuthProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:'#f4f7fb'}}}/></AuthProvider>
 </StripeProvider>
}
