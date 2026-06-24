import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewProps } from 'react-native';
import { C, shadow } from '@/constants/app-theme';

export function Screen({children,style,...props}:ViewProps){return <View {...props} style={[s.screen,style]}>{children}</View>}
export function Card({children,style,...props}:ViewProps){return <View {...props} style={[s.card,style]}>{children}</View>}
export function Title({children}:React.PropsWithChildren){return <Text style={s.title}>{children}</Text>}
export function Label({children}:React.PropsWithChildren){return <Text style={s.label}>{children}</Text>}
export function Field(props:TextInputProps){return <TextInput placeholderTextColor="#94a3b8" {...props} style={[s.field,props.style]}/>}
export function Button({title,onPress,loading,disabled,variant='primary'}:{title:string;onPress?:()=>void;loading?:boolean;disabled?:boolean;variant?:'primary'|'secondary'|'danger'}) {
 return <Pressable onPress={onPress} disabled={disabled||loading} style={({pressed})=>[s.button,variant==='secondary'&&s.secondary,variant==='danger'&&s.danger,(disabled||loading)&&s.disabled,pressed&&{opacity:.82}]}>{loading?<ActivityIndicator color={variant==='secondary'?C.blue:'#fff'}/>:<Text style={[s.buttonText,variant==='secondary'&&{color:C.blue}]}>{title}</Text>}</Pressable>
}
export function AlertBox({message,type='error'}:{message?:string|null;type?:'error'|'success'|'info'}){if(!message)return null;const color=type==='error'?C.red:type==='success'?C.green:C.blue;const bg=type==='error'?C.redSoft:type==='success'?C.greenSoft:C.blueSoft;return <View style={[s.alert,{borderColor:color+'33',backgroundColor:bg}]}><Text style={{color,fontWeight:'700',lineHeight:20}}>{message}</Text></View>}
const s=StyleSheet.create({
 screen:{flex:1,backgroundColor:C.bg},card:{backgroundColor:C.card,borderRadius:24,padding:20,borderWidth:1,borderColor:C.line,...shadow},
 title:{fontSize:28,fontWeight:'900',color:C.text,letterSpacing:-.7},label:{fontSize:12,fontWeight:'800',color:C.muted,textTransform:'uppercase',letterSpacing:.8,marginBottom:8},
 field:{borderWidth:1,borderColor:C.line,borderRadius:14,paddingHorizontal:15,paddingVertical:14,fontSize:15,color:C.text,backgroundColor:'#f8fafc'},
 button:{minHeight:52,borderRadius:15,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',paddingHorizontal:18},
 secondary:{backgroundColor:C.blueSoft,borderWidth:1,borderColor:'#bfdbfe'},danger:{backgroundColor:C.red},
 disabled:{opacity:.55},buttonText:{color:'#fff',fontWeight:'900',fontSize:15},alert:{borderWidth:1,borderRadius:14,padding:13}
});
