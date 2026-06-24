import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const webStorage = {
 getItemAsync: async (key:string) => typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
 setItemAsync: async (key:string,value:string) => { if(typeof localStorage !== 'undefined') localStorage.setItem(key,value); },
 deleteItemAsync: async (key:string) => { if(typeof localStorage !== 'undefined') localStorage.removeItem(key); },
};
export const storage = Platform.OS === 'web' ? webStorage : SecureStore;
