import { ActivityIndicator,View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/auth';
import { C } from '@/constants/app-theme';
export default function Index(){const{ready,user}=useAuth();if(!ready)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:C.navy}}><ActivityIndicator color="#fff"/></View>;return <Redirect href={user?(user.role==='user'?"/(tabs)/home":"/(tabs)/role"):"/login"}/>}
