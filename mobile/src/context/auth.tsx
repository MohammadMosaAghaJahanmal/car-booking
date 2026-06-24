import React,{createContext,useContext,useEffect,useState} from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { disconnectSocket } from '@/lib/socket';
import type { User } from '@/lib/types';

type AuthValue={user:User|null;token:string|null;ready:boolean;signIn:(email:string,password:string)=>Promise<void>;signUp:(name:string,email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>;updateUser:(user:User)=>Promise<void>};
const AuthContext=createContext<AuthValue|null>(null);
export function AuthProvider({children}:React.PropsWithChildren){
 const [user,setUser]=useState<User|null>(null);const[token,setToken]=useState<string|null>(null);const[ready,setReady]=useState(false);
 useEffect(()=>{Promise.all([storage.getItemAsync('token'),storage.getItemAsync('user')]).then(([t,u])=>{setToken(t);setUser(u?JSON.parse(u):null)}).finally(()=>setReady(true))},[]);
 const persist=async(t:string,u:User)=>{await storage.setItemAsync('token',t);await storage.setItemAsync('user',JSON.stringify(u));setToken(t);setUser(u)};
 const signIn=async(email:string,password:string)=>{const{data}=await api.post('/auth/login',{email,password});await persist(data.token,data.user)};
 const signUp=async(name:string,email:string,password:string)=>{await api.post('/auth/register',{name,email,password});await signIn(email,password)};
 const signOut=async()=>{disconnectSocket();await storage.deleteItemAsync('token');await storage.deleteItemAsync('user');setToken(null);setUser(null)};
 const updateUser=async(u:User)=>{await storage.setItemAsync('user',JSON.stringify(u));setUser(u)};
 const value={user,token,ready,signIn,signUp,signOut,updateUser};
 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be inside AuthProvider');return value}
