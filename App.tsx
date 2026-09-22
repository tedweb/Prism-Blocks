import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { anyMove, Board, bounds, canPlace, emptyBoard, newTray, Piece, placeAndClear, SIZE } from './src/game';

const W = Dimensions.get('window').width;
const BOARD = Math.min(W - 32, 430);
const GAP = 3;
const CELL = (BOARD - GAP * (SIZE + 1)) / SIZE;
const LIFT = 112;

function Block({color, size=CELL}:{color:string,size?:number}) {
  return <View style={[styles.block,{width:size,height:size,backgroundColor:color,borderRadius:size*.18}]}><View style={styles.glint}/></View>;
}

function PieceView({piece, scale=.7}:{piece:Piece,scale?:number}) {
  const b=bounds(piece.shape), s=CELL*scale;
  return <View style={{width:b.w*s,height:b.h*s}}>{piece.shape.map(([r,c],i)=><View key={i} style={{position:'absolute',left:c*s,top:r*s,padding:1}}><Block color={piece.color} size={s-2}/></View>)}</View>;
}

function App() {
  const [board,setBoard]=useState<Board>(emptyBoard);
  const [tray,setTray]=useState<(Piece|null)[]>(newTray);
  const [score,setScore]=useState(0), [best,setBest]=useState(0), [combo,setCombo]=useState(0);
  const [over,setOver]=useState(false), [tutorial,setTutorial]=useState(false), [muted,setMuted]=useState(false);
  const [preview,setPreview]=useState<{piece:Piece,row:number,col:number,valid:boolean,x:number,y:number}|null>(null);
  const boardRef=useRef<View>(null), boardXY=useRef({x:0,y:0});
  const pulse=useRef(new Animated.Value(1)).current;

  useEffect(()=>{(async()=>{setBest(Number(await AsyncStorage.getItem('pb-best')||0)); if(!await AsyncStorage.getItem('pb-seen')) setTutorial(true);})();},[]);
  useEffect(()=>{if(score>best){setBest(score);AsyncStorage.setItem('pb-best',String(score));}},[score,best]);
  useEffect(()=>{if(!anyMove(board,tray)) setOver(true);},[board,tray]);
  const measure=()=>boardRef.current?.measureInWindow((x,y)=>boardXY.current={x,y});

  function commit(piece:Piece,index:number,row:number,col:number){
    if(!canPlace(board,piece,row,col)){ if(!muted) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    const result=placeAndClear(board,piece,row,col); const next=[...tray]; next[index]=null;
    const nextCombo=result.lines ? combo+1 : 0;
    setBoard(result.board); setCombo(nextCombo); setScore(s=>s+piece.shape.length*10+result.lines*100*Math.max(1,nextCombo));
    if(!muted) Haptics.impactAsync(result.lines?Haptics.ImpactFeedbackStyle.Heavy:Haptics.ImpactFeedbackStyle.Light);
    if(result.lines){Animated.sequence([Animated.timing(pulse,{toValue:1.13,duration:120,useNativeDriver:true}),Animated.spring(pulse,{toValue:1,useNativeDriver:true})]).start();}
    setTray(next.every(v=>!v)?newTray():next);
  }
  function reset(){setBoard(emptyBoard());setTray(newTray());setScore(0);setCombo(0);setOver(false);setPreview(null);}

  return <SafeAreaView style={styles.safe}><StatusBar style="light"/><View style={styles.header}>
    <View><Text style={styles.brand}>PRISM</Text><Text style={styles.subbrand}>BLOCKS</Text></View>
    <Animated.View style={[styles.scoreCard,{transform:[{scale:pulse}]}]}><Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.score}>{score.toLocaleString()}</Text></Animated.View>
    <View style={styles.bestCard}><Text style={styles.scoreLabel}>BEST</Text><Text style={styles.best}>{best.toLocaleString()}</Text></View>
  </View>
  <View style={styles.toolbar}><Pressable onPress={reset} style={styles.iconButton}><Text style={styles.icon}>↻</Text></Pressable><View style={styles.combo}>{combo>1&&<Text style={styles.comboText}>COMBO ×{combo}</Text>}</View><Pressable onPress={()=>setMuted(v=>!v)} style={styles.iconButton}><Text style={styles.icon}>{muted?'♢':'◈'}</Text></Pressable></View>
  <View ref={boardRef} onLayout={measure} style={styles.board}>
    {board.map((row,r)=>row.map((color,c)=>{
      const ghost=preview?.valid&&preview.piece.shape.some(([dr,dc])=>preview.row+dr===r&&preview.col+dc===c);
      return <View key={`${r}-${c}`} style={[styles.cell,{left:GAP+c*(CELL+GAP),top:GAP+r*(CELL+GAP),width:CELL,height:CELL}]}>{color&&<Block color={color}/>}<>{ghost&&<View style={[styles.ghost,{backgroundColor:preview!.piece.color}]}/>}</></View>
    }))}
  </View>
  <Text style={styles.hint}>Drag a piece onto the board • Fill rows or columns</Text>
  <View style={styles.tray}>{tray.map((piece,i)=><PieceSlot key={piece?.id||i} piece={piece} index={i} onMove={(p,x,y)=>{
    const col=Math.round((x-boardXY.current.x-GAP-CELL/2)/(CELL+GAP));
    const row=Math.round((y-LIFT-boardXY.current.y-GAP-CELL/2)/(CELL+GAP));
    setPreview({piece:p,row,col,valid:canPlace(board,p,row,col),x,y});
  }} onDrop={(p)=>{if(preview?.piece.id===p.id&&preview.valid)commit(p,i,preview.row,preview.col);setPreview(null);}}/>)}</View>
  {preview&&<View pointerEvents="none" style={{position:'absolute',left:preview.x-(bounds(preview.piece.shape).w*CELL*.82)/2,top:preview.y-LIFT-(bounds(preview.piece.shape).h*CELL*.82)/2,opacity:.92}}><PieceView piece={preview.piece} scale={.82}/></View>}
  <GameModal visible={over} title="NO MORE MOVES" body={`Final score\n${score.toLocaleString()}`} button="PLAY AGAIN" onPress={reset}/>
  <GameModal visible={tutorial} title="WELCOME TO PRISM" body={'Drag any of the three pieces onto the 8×8 board.\n\nComplete a full row or column to clear it. Chain clears to multiply your score.\n\nThe game ends when no piece fits.'} button="LET’S PLAY" onPress={()=>{setTutorial(false);AsyncStorage.setItem('pb-seen','1')}}/>
  </SafeAreaView>;
}

function PieceSlot({piece,index,onMove,onDrop}:{piece:Piece|null,index:number,onMove:(p:Piece,x:number,y:number)=>void,onDrop:(p:Piece)=>void}){
  const active=useRef(false); const current=useRef(piece); current.current=piece;
  const pan=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>!!current.current,onMoveShouldSetPanResponder:()=>!!current.current,onPanResponderGrant:e=>{active.current=true;const p=current.current;if(p)onMove(p,e.nativeEvent.pageX,e.nativeEvent.pageY)},onPanResponderMove:e=>{const p=current.current;if(p)onMove(p,e.nativeEvent.pageX,e.nativeEvent.pageY)},onPanResponderRelease:()=>{const p=current.current;if(p)onDrop(p);active.current=false},onPanResponderTerminate:()=>{const p=current.current;if(p)onDrop(p);active.current=false}}),[index,piece?.id]);
  return <View {...pan.panHandlers} style={styles.slot}>{piece&&<PieceView piece={piece}/>}</View>
}
function GameModal({visible,title,body,button,onPress}:{visible:boolean,title:string,body:string,button:string,onPress:()=>void}){
  return <Modal visible={visible} transparent animationType="fade"><View style={styles.overlay}><View style={styles.modal}><Text style={styles.modalTitle}>{title}</Text><Text style={styles.modalBody}>{body}</Text><Pressable onPress={onPress} style={styles.primary}><Text style={styles.primaryText}>{button}</Text></Pressable></View></View></Modal>
}
export default function Root(){return <SafeAreaProvider><App/></SafeAreaProvider>}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#07111F',alignItems:'center'},header:{width:'100%',paddingHorizontal:20,paddingTop:6,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},brand:{fontSize:25,fontWeight:'900',letterSpacing:5,color:'#F3F7FF'},subbrand:{fontSize:10,fontWeight:'800',letterSpacing:7,color:'#58D6FF'},scoreCard:{minWidth:108,alignItems:'center',backgroundColor:'#10233B',padding:10,borderRadius:18,borderWidth:1,borderColor:'#21456C'},bestCard:{minWidth:70,alignItems:'center'},scoreLabel:{fontSize:9,fontWeight:'800',letterSpacing:2,color:'#7F9AB9'},score:{fontSize:25,fontWeight:'900',color:'#fff'},best:{fontSize:18,fontWeight:'800',color:'#FFD166'},toolbar:{width:BOARD,flexDirection:'row',alignItems:'center',marginVertical:12},iconButton:{width:38,height:38,borderRadius:19,backgroundColor:'#10233B',alignItems:'center',justifyContent:'center'},icon:{fontSize:20,color:'#9BB5D4'},combo:{flex:1,alignItems:'center'},comboText:{fontWeight:'900',letterSpacing:2,color:'#FFD166'},board:{width:BOARD,height:BOARD,borderRadius:18,backgroundColor:'#0C1B2D',borderWidth:1,borderColor:'#173653',shadowColor:'#58D6FF',shadowOpacity:.15,shadowRadius:18,shadowOffset:{width:0,height:5}},cell:{position:'absolute',borderRadius:7,backgroundColor:'#122A43',overflow:'hidden'},block:{shadowColor:'#000',shadowOpacity:.3,shadowRadius:3,shadowOffset:{width:0,height:2},borderWidth:1,borderColor:'rgba(255,255,255,.24)'},glint:{position:'absolute',left:5,top:4,width:'45%',height:3,borderRadius:2,backgroundColor:'rgba(255,255,255,.32)'},ghost:{position:'absolute',inset:0,borderRadius:7,opacity:.45},hint:{fontSize:11,color:'#647F9E',marginTop:10},tray:{flex:1,width:BOARD,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingBottom:18},slot:{width:BOARD/3,height:105,alignItems:'center',justifyContent:'center'},overlay:{flex:1,backgroundColor:'rgba(2,7,14,.82)',alignItems:'center',justifyContent:'center',padding:28},modal:{width:'100%',maxWidth:380,backgroundColor:'#10233B',borderRadius:28,padding:26,alignItems:'center',borderWidth:1,borderColor:'#28527A'},modalTitle:{color:'#fff',fontSize:23,fontWeight:'900',letterSpacing:2,textAlign:'center'},modalBody:{color:'#AFC2D9',fontSize:16,lineHeight:24,textAlign:'center',marginVertical:20},primary:{backgroundColor:'#58D6FF',paddingHorizontal:30,paddingVertical:15,borderRadius:16,width:'100%',alignItems:'center'},primaryText:{color:'#07111F',fontWeight:'900',letterSpacing:2}}
);
