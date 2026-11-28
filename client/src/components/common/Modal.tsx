import React,{useEffect,useId,useRef} from 'react';
import {createPortal} from 'react-dom';
import {motion,AnimatePresence,useReducedMotion} from 'framer-motion';
import {X,Sparkles} from 'lucide-react';
import {useTranslation} from '../../hooks/useTranslation';
interface ModalProps{isOpen:boolean;onClose:()=>void;title:string;subtitle?:string;children:React.ReactNode;maxWidth?:string;icon?:React.ElementType}
const focusable='button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const Modal:React.FC<ModalProps>=({isOpen,onClose,title,subtitle,children,maxWidth='600px',icon:Icon=Sparkles})=>{
 const {language}=useTranslation();const titleId=useId(),descriptionId=useId();const panel=useRef<HTMLDivElement>(null);const closeRef=useRef(onClose);closeRef.current=onClose;const reduce=useReducedMotion();
 useEffect(()=>{if(!isOpen)return;const previous=document.activeElement as HTMLElement|null;const frame=requestAnimationFrame(()=>panel.current?.focus());
 const keydown=(event:KeyboardEvent)=>{const dialogs=Array.from(document.querySelectorAll('[data-lumo-dialog="true"]'));if(dialogs[dialogs.length-1]!==panel.current)return;if(event.key==='Escape'){event.preventDefault();closeRef.current();return}if(event.key!=='Tab'||!panel.current)return;
 const controls=Array.from(panel.current.querySelectorAll<HTMLElement>(focusable)).filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true'&&el.getClientRects().length>0);
 if(!controls.length){event.preventDefault();panel.current.focus();return}const first=controls[0],last=controls[controls.length-1],current=document.activeElement;
 if(event.shiftKey&&(current===first||current===panel.current||!panel.current.contains(current))){event.preventDefault();last.focus()}else if(!event.shiftKey&&(current===last||!panel.current.contains(current))){event.preventDefault();first.focus()}};
 document.addEventListener('keydown',keydown);return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',keydown);if(previous?.isConnected)previous.focus()};},[isOpen]);
 return createPortal(<AnimatePresence>{isOpen&&<motion.div className="lumo-modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduce?0:.16}} onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><motion.div ref={panel} data-lumo-dialog="true" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitle?descriptionId:undefined} tabIndex={-1} className="lumo-modal" style={{maxWidth}} initial={{opacity:0,y:reduce?0:10,scale:reduce?1:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:reduce?0:6}} transition={{duration:reduce?0:.2}}><header className="lumo-modal-header"><div className="lumo-modal-icon"><Icon size={20} aria-hidden="true"/></div><div style={{flex:1,minWidth:0}}><h2 id={titleId} className="lumo-modal-title">{title}</h2>{subtitle&&<p id={descriptionId} className="lumo-modal-subtitle">{subtitle}</p>}</div><button type="button" className="lumo-modal-close" aria-label={language==='en'?'Close':'Fermer'} onClick={onClose}><X size={18}/></button></header>{children}</motion.div></motion.div>}</AnimatePresence>,document.body);
};
export default Modal;
