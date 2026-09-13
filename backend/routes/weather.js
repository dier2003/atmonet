import {Router} from 'express';
const r=Router(); r.get('/',(req,res)=>res.json({location:req.query.location||'Mbeya',rainfall:82,temperature:24,humidity:86,condition:'Heavy Rain',forecast:[{hour:'Now',rain:82},{hour:'+3h',rain:74},{hour:'+6h',rain:51}]})); export default r;
