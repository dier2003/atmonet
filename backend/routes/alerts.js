import {Router} from 'express';
const r=Router(); r.get('/',(req,res)=>res.json({alerts:[
{id:1,title:'Critical water level',location:'Sisimba river station',severity:'critical',time:'2 min ago'},
{id:2,title:'Heavy rainfall detected',location:'Mbeya Urban',severity:'high',time:'18 min ago'},
{id:3,title:'Flood probability rising',location:'Iganzo catchment',severity:'moderate',time:'41 min ago'}]})); export default r;
