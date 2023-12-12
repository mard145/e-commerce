
require('dotenv').config()
const path = require('path')
const port = process.env.PORT
const express = require('express')
const app = express()
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors')
const jwt = require('jsonwebtoken');
const tokenSecret = process.env.TOKEN_SECRET
const  eAdmin  = require('./controllers/auth');
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const methodOverride = require('method-override')
const User = require('./models/User')
const Product = require('./models/Product')
const Order = require('./models/Order')
const passportJWT = require('passport-jwt');
const { v4: uuidv4 } = require('uuid');

// Configuqrcração do Passport
const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
app.use(session({
    secret: tokenSecret,
    resave: false,
    saveUninitialized: true,
  }));
app.use(passport.initialize());
app.use(passport.session());

// Configuração do Passport e estratégia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.TOKEN_SECRET,
};
passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Busque os detalhes do usuário no banco de dados usando o payload._id
      const user = await User.findById(payload._id);

      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (error) {
      return done(error, false);
    }
  })
);
//const pix = require('qrcode-pix')
//const multer = require('multer'); // Biblioteca para lidar com uploads de arquivos
// const sharp = require('sharp')
mongoose.connect(process.env.MONGO_URL).then(()=>{
      console.log('mongo connected')
  }).catch(err=>{
      console.log(err)
  })
  
  // Configuração do express-session

  
  let db = mongoose.connection
  
  db.on('error',()=>{
      console.log('error')
  })
  db.once('open',()=>{
      console.log('mongo connection')
  })
// Step 1: Import the parts of the module you want to use
let { MercadoPagoConfig, Payment, Customer, MerchantOrder } = require('mercadopago');


// Step 2: Initialize the client object
const client = new MercadoPagoConfig({ accessToken: 'TEST-2786362695625116-120401-0596ae3d8c32e13740229eb17d033c5e-1058457871'});


// Step 3: Initialize the API object
const payment = new Payment(client);
const customer = new Customer(client)
const merchantOrder = new MerchantOrder(client)
const mercadoPagoPublicKey = 'TEST-130be883-07a6-4f31-8cb7-94b71d5e1f50';
if (!mercadoPagoPublicKey) {
  console.log("Error: public key not defined");
  process.exit(1);
}


// Step 5: Make the request
//payment.create(body).then(console.log).catch(console.log);

const fs = require('fs');
app.use(cors())
app.use(express.static(path.join(__dirname,'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.json({limit: '100mb'}))
app.use(express.urlencoded({extended:true,limit: '100mb'}))
app.use(methodOverride('_method'))

app.post('/capture_payment/:id',(req,res)=>{
  let {id, transaction_amount} = req.body
if(!id) {
  id = req.params.id
}
console.log(transaction_amount)
  payment.capture({
    id: id,
    transaction_amount: parseInt(transaction_amount),
    requestOptions: {
    idempotencyKey: uuidv4()
    }
    }).then(console.log).catch(console.log);
})

app.post('/capture_parcial_payment/:id',(req,res)=>{
  let {id, transaction_amount} = req.body
if(!id) {
  id = req.params.id
}

let captureInfo = {id: id, transaction_amount: transaction_amount}

mercadopago.p.capturePartial(captureInfo, mercadopago, (error, response) => {
    if (error){
        console.log(error);
    }else{
        console.log(response)
    }
});

})


app.post('/process_payment', async (req,res)=>{


   try {
    let user = req.user
    const { payer,token,description,transaction_amount,paymentMethodId,installments,issuerId,phone,street_number, cep,address,whatsapp,name,lastname,email,cpf,city } = await req.body;
  
    let srt_number = parseInt(street_number)
    console.log(transaction_amount, payer,token,description,cep,city,address,phone)
  
    const timestamp = Date.now();
    const stringTimestamp = timestamp.toString();
    //let stringSemEspacosEHifens = cep.replace(/[\s-]/g, "");
    const clientData = {
      email: email,
      first_name: name,
      last_name: lastname,
      phone: payer.phone,
      identification: {
        type: 'CPF',
        number: cpf
      },
      default_address: 'Home',
      address: {
        id: address,
        zip_code: cep,
        street_name: address,
        street_number: srt_number,
        city: {
          name:city
        }
      },
      date_registered: stringTimestamp,
      description: 'Description del user',
      default_card: 'None'
    };
    
  
    const paymentData = {
      transaction_amount: transaction_amount,
      token: token,
      description: description,
      installments: Number(installments),
      payment_method_id: paymentMethodId,
      issuer_id: issuerId,
      payer: {
        email: payer.email,
        
     // phone:{ area_code:'55', number:phone},
        first_name:name,
        last_name:lastname,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      capture:false
    };
    
    customer.search({options:{email:payer.email}}).then((data)=>{
      console.log(data,data.results.length)
    if(data.results.length == 0 || !data.id )
  {
  
    customer.create({ body: clientData }).then((data)=>{
      console.log(data)
      console.log('novo cliente')
    }).catch(console.log);
  
    payment
      .create({ body: paymentData })
      .then(async function (data) {
        res.status(201).json({
          detail: data.status_detail,
          status: data.status,
          id: data.id,
          
        });
       console.log(data,' <- pagamento criado' )
      
    /*  let order = new Order({
        payer:payer,
       order:data.metadata,
        total:data.transaction_amount, //transactions_amount
        status:data.status,
        status_detail:data.status_detail,
        currency:data.currency_id,
        description:data.description,
        authorization_code:data.authorization_code,
        taxes_amount:data.taxes_amount,
        shipping_amount:data.shipping_amount,
        collector_id:data.collector_id,
        total_refunded:data.transaction_amount_refunded,  //transactions_refunded_amount
        cupum_amount:data.coupon_amount,
        installments:data.installments,
        transaction_details:data.transaction_details,
        fee_details:data.fee_details,
        card:data.card,
        refunds:data.refunds,
        processing_mode:data.processing_mode,
        point_of_interaction:data.point_of_interaction,
        accounts_info:data.accounts_info,
        captured:data.captured
  
      })
      await order.save()*/
      })
      .catch(function (error) {
        console.log(error);
    //    const { errorMessage, errorStatus } = validateError(error);
        res.json({ error });
      });
  }else{
    customer.update({ email: payer.email, body: paymentData,
  }).then((data)=>{

    console.log(data,'usuario atualizado pois ja existe um usuario com essas informções.Pedidos e pagamentos atualizados')
  }).catch(console.log);
  
  }  
    console.log(data)
      }).catch(console.log);
  
   } catch (error) {
    console.log(error)
   }


 


})

//app.get('/', (req,res)=>{
  //  res.render('index',{msg:false,error:false})
//})

app.get('/loja',async (req,res)=>{
  try {
    let user = await req.user
    let products = await Product.find({})
    res.render('loja',{user:user,publicKey:mercadoPagoPublicKey, products:products}) 
  } catch (error) {
    console.log(error)
  }

})

app.get('/admin',eAdmin,async(req,res)=>{

  try {
  let user = await req.user
  let users = await User.find({})
  let payments = await payment.search()
 // console.log(payments.results,'payments')

  res.render('admin/admin',{user:user,users:users,payments:payments.results})
  } catch (error) {
    console.log(error)
  }
  
})

app.get('/',(req,res)=>{
  res.render('index')
})

app.get('/quem-somos',(req,res)=>{
  res.render('about')
})

app.get('/consultoria',(req,res)=>{
  res.render('consultoria')
})

app.get('/perguntas-frequentes',(req,res)=>{
  res.render('perguntasfrequentes')
})

app.get('/politica-de-privacidade',(req,res)=>{
  res.render('politicadeprivacidade')
})

app.get('/termos-e-condicoes',(req,res)=>{
  res.render('termosecondicoes')
})

app.get('/cadastro',(req,res)=>{
  res.render('cadastro',{msg:false})
})

app.get('/minha-conta',eAdmin,(req,res)=>{
  let user = req.user
  res.render('profile',{user:user})
})

app.post('/sendEmail', express.urlencoded({extended:true}),express.json(),async (req,res)=>{

  try {

      
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: 'suporte@adaupsoft.com', // sender address
    to: "suporte@adaupsoft.com", // list of receivers
    subject: `${await req.body.assunto}`, // Subject line
   
    html: `
    <b>Nome:</b>${ req.body.nome}\n
    <b>Telefone:</b>${await req.body.telefone}\n
    <b>Email:</b>${await req.body.email}\n
    <b>Mensagem:</b>${await req.body.message}\n
    `, 
    dkim:{
      domainName:'ielabag.com.br',
      privateKey:'"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAn4ZfHUOe2JbR4YqpFJizQ2nn1krqJMIKB2Sy4K3Qy5u8EN5CNvdCi5YhZou9i5jNv0KEtANDb0gFeydiX1axLxUHVhBaWZBpxDjPHHF/Ntk3vG+arPH7aiz4+7EVwMgJSdMpj6lsVtk38zn7Rsnf7ixb/x3WygaBsNqcvzBOQQIDAQAB"',
      keySelector:'titan2._domainkey.ielabag.com.br.'
    }
  }).then(async ()=>{
      const info = await transporter.sendMail({
          from: 'suporte@adaupsoft.com', // sender address
          to: `${req.body.email}`, // list of receivers
          subject: `${await req.body.assunto}`, // Subject line
         
          html: `
        
<!DOCTYPE html>    
<html>    
<head>
<title>App Release</title>
<link rel="shortcut icon" href="favicon.ico">
<style type="text/css">
table[name="blk_permission"], table[name="blk_footer"] {display:none;} 
</style>
<meta name="googlebot" content="noindex" />
<META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW"/>    
<meta content="width=device-width, initial-scale=1.0" name="viewport">       
</head>    
<body marginheight=0 marginwidth=0 topmargin=0 leftmargin=0 style="height: 100% !important; margin: 0; padding: 0; width: 100% !important;min-width: 100%;">    
  
<table name="bmeMainBody" style="background-color: rgb(245, 245, 245);" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f5f5f5"><tbody><tr><td width="100%" valign="top" align="center"><table name="bmeMainColumnParentTable" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmeMainColumnParent" style="border: 0px none transparent; border-radius: 0px; border-collapse: separate; border-spacing: 0px;"> <table name="bmeMainColumn" class="" style="max-width: 100%; overflow: visible;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">    <tbody><tr><td class="blk_container bmeHolder" name="bmePreHeader" style="color: rgb(102, 102, 102); border: 0px none transparent; background-color: rgb(219, 65, 145);" width="100%" valign="top" bgcolor="#db4191" align="center"><div id="dv_2" class="blk_wrapper"><table class="blk" name="blk_permission" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="tblCell" style="padding:20px;" valign="top" align="left"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmePermissionText" style="text-align:left;" align="left"><span style="font-family: Arial, Helvetica, sans-serif; font-weight: normal; font-size: 11px;line-height: 140%;"><a style="color: #16a7e0;" target="_new" href="[ViewWebURL]">View this email in your browser</a></span></td></tr></tbody></table></td></tr></tbody></table></div></td></tr> <tr><td class="bmeHolder" name="bmeMainContentParent" style="border: 0px none transparent; border-radius: 0px; border-collapse: separate; border-spacing: 0px; overflow: hidden;" width="100%" valign="top" align="center"> <table name="bmeMainContent" style="border-radius: 0px; border-collapse: separate; border-spacing: 0px; border: 0px none transparent;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center"> <tbody><tr><td class="blk_container bmeHolder" name="bmeHeader" style="color: rgb(56, 56, 56); border: 0px none transparent; background-color: rgb(245, 245, 245);" width="100%" valign="top" bgcolor="#f5f5f5" align="center">
<div id="dv_1" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_7" class="blk_wrapper"><table class="blk" name="blk_text" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeContainerRow" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top" align="center"><table name="tblText" style="float:left; background-color:transparent;" width="600" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tblCell" style="padding-top: 10px; padding-bottom:10px; padding-left:20px; padding-right:20px; font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 150%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 48px; color: #3c3d3c; line-height: 150%;">App Release!</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_8" class="blk_wrapper"><table class="blk" name="blk_text" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeContainerRow" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top" align="center"><table name="tblText" style="float:left; background-color:transparent;" width="600" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tblCell" style="padding-top: 10px; padding-bottom:10px; padding-left:20px; padding-right:20px; font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #b0b0b0; line-height: 200%;">You had to be excited enough about something to decide to send this email campaign. This is where that news goes. Think of it as your mountaintop to shout from.</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_9" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_5" class="blk_wrapper"><table class="blk" name="blk_image" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="bmeImage" style="border-collapse: collapse;padding-left:20px; padding-right: 20px;padding-top:20px; padding-bottom: 20px; " align="center"><img src="https://www.benchmarkemail.com/images/templates_n/new_editor/Templates/AppRelease/Hero.png" style="max-width: 1200px; display: block; width: 560px;" alt="" width="560" border="0"></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_3" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div></td></tr> <tr><td class="blk_container bmeHolder" name="bmeBody" style="color: rgb(56, 56, 56); border: 0px none transparent; background-color: rgb(255, 255, 255);" width="100%" valign="top" bgcolor="#ffffff" align="center">

<div id="dv_12" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_11" class="blk_wrapper"><table class="blk" name="blk_text" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeContainerRow" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top" align="center"><table name="tblText" style="float:left; background-color:transparent;" width="600" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tblCell" style="padding-top: 10px; padding-bottom:10px; padding-left:20px; padding-right:20px; font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 30px; color: #3c3d3c; line-height: 200%;">Features</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_13" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_15" class="blk_wrapper"><table class="blk" name="blk_imagecaption" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeCaptionContainer" style="padding-left:20px; padding-right:20px; padding-top:10px; padding-bottom:10px;border-collapse:separate;" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td class="bmeImageContainerRow" gutter="10" valign="top"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top"><table class="bmeImageContainer" style="float:left;" width="180" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tdContainer" valign="top"><table class="bmeImageTable" dimension="100%" imgid="1" width="180" height="74" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmeImgHolder" class="" width="177" valign="top" height="74" align="center"><img src="https://www.benchmarkemail.com/images/templates_n/new_editor/Templates/AppRelease/Apple.png" style="max-width: 74px; display: block;" width="74" border="0"></td></tr></tbody></table><table class="bmeCaptionTable" style="padding-top:20px; border-collapse:separate;" width="180" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="tblCell" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #3c3d3c; line-height: 200%;">Apple</span><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #8d8d8d; line-height: 200%;">Some totally newsworthy newsletter copy goes here.</span></div></td></tr></tbody></table></td></tr></tbody></table></td><td gutter="10" class="bmeImageGutterRow" valign="top" align="center"><table width="10" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td></td></tr></tbody></table></td><td class="tdPart" valign="top"><table class="bmeImageContainer" style="float:right;" width="180" cellspacing="0" cellpadding="0" border="0" align="right"><tbody><tr><td name="tdContainer" valign="top"><table class="bmeImageTable" dimension="100%" imgid="2" width="180" height="74" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmeImgHolder" class="" width="177" valign="top" height="74" align="center"><img src="https://www.benchmarkemail.com/images/templates_n/new_editor/Templates/AppRelease/Android.png" style="max-width: 74px; display: block;" width="74" border="0"></td></tr></tbody></table><table class="bmeCaptionTable" style="padding-top:20px; border-collapse:separate;" width="180" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="tblCell" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #3c3d3c; line-height: 200%;">Android</span><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #8d8d8d; line-height: 200%;">Some totally newsworthy newsletter copy goes here.</span></div></td></tr></tbody></table></td></tr></tbody></table></td><td gutter="10" class="bmeImageGutterRow" valign="top" align="center"><table width="10" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td></td></tr></tbody></table></td><td class="tdPart" valign="top"><table class="bmeImageContainer" style="float:right;" width="180" cellspacing="0" cellpadding="0" border="0" align="right"><tbody><tr><td name="tdContainer" valign="top"><table class="bmeImageTable" dimension="100%" imgid="3" width="180" height="74" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmeImgHolder" class="" width="177" valign="top" height="74" align="center"><img src="https://www.benchmarkemail.com/images/templates_n/new_editor/Templates/AppRelease/Windows.png" style="max-width: 74px; display: block;" width="74" border="0"></td></tr></tbody></table><table class="bmeCaptionTable" style="padding-top:20px; border-collapse:separate;" width="180" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="tblCell" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #3c3d3c; line-height: 200%;">Windows</span><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #8d8d8d; line-height: 200%;">Some totally newsworthy newsletter copy goes here.</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_14" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_6" class="blk_wrapper"><table class="blk" name="blk_button" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td width="20"></td><td align="center"><table class="tblContainer" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td height="10"></td></tr><tr><td align="center"><table class="bmeButton" style="border-collapse: separate;" cellspacing="0" cellpadding="0" border="0" align="center"><tbody><tr><td class="bmeButtonText" style="border-radius: 0px; border: 0px none transparent; text-align: center; padding: 15px 30px; font-weight: normal; background-color: rgb(148, 77, 169);"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: rgb(255, 255, 255);"><a target="_blank" style="color:#FFFFFF;text-decoration:none;">Download Now</a></span></td></tr></tbody></table></td></tr><tr><td height="10"></td></tr></tbody></table></td><td width="20"></td></tr></tbody></table></div><div id="dv_17" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div>
</td></tr> <tr><td class="blk_container bmeHolder" name="bmePreFooter" style="color: rgb(56, 56, 56); border: 0px none transparent; background-color: rgb(219, 65, 145);" width="100%" valign="top" bgcolor="#db4191" align="center">

<div id="dv_4" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_18" class="blk_wrapper"><table class="blk" name="blk_text" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeContainerRow" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top" align="center"><table name="tblText" style="float:left; background-color:transparent;" width="295" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tblCell" style="padding: 10px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; color: rgb(56, 56, 56); text-align: left;" class="" valign="top" align="left"><div style="line-height: 150%;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #ffffff; line-height: 150%;">About Our App</span><br><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #ffffff; line-height: 150%;">You are totally stoked about the piece of information that goes here and your subscribers will be too.</span><br><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #ffffff; line-height: 150%;">You are totally stoked about the piece of information that goes here and your subscribers will be too.</span></div></td></tr></tbody></table></td><td class="tdPart" valign="top" align="center"><table name="tblGtr" style="float:right;" width="10" cellspacing="0" cellpadding="0" border="0" align="right"><tbody><tr><td> </td></tr></tbody></table></td><td class="tdPart" valign="top" align="center"><table name="tblText" style="float:right;" width="295" cellspacing="0" cellpadding="0" border="0" align="right"><tbody><tr><td name="tblCell" style="padding: 10px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; color: rgb(56, 56, 56); text-align: left;" class="" valign="top" align="left"><div style="line-height: 150%;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #ffffff; line-height: 150%;">Spec Details</span><br><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #ffffff; line-height: 150%;">You are totally stoked about the piece of information that goes here and your subscribers will be too.</span><br><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #ffffff; line-height: 150%;">You are totally stoked about the piece of information that goes here and your subscribers will be too.</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_20" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_21" class="blk_wrapper"><table class="blk" name="blk_button" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td width="20"></td><td align="center"><table class="tblContainer" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td height="10"></td></tr><tr><td align="center"><table class="bmeButton" style="border-collapse: separate;" cellspacing="0" cellpadding="0" border="0" align="center"><tbody><tr><td class="bmeButtonText" style="border-radius: 0px; border: 0px none transparent; text-align: center; padding: 15px 30px; font-weight: normal; background-color: rgb(255, 255, 255);"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: rgb(219, 65, 145);"><a target="_blank" style="color: rgb(219, 65, 145); text-decoration: none;">Learn More</a></span></td></tr></tbody></table></td></tr><tr><td height="10"></td></tr></tbody></table></td><td width="20"></td></tr></tbody></table></div><div id="dv_22" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_23" class="blk_wrapper"><table class="blk" name="blk_divider" style="background-color: rgb(255, 255, 255);" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_24" class="blk_wrapper"><table class="blk" name="blk_imagecaption" style="background-color: rgb(255, 255, 255);" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><table class="bmeCaptionContainer" style="padding-left:20px; padding-right:20px; padding-top:10px; padding-bottom:10px;border-collapse:separate;" width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td class="bmeImageContainerRow" gutter="10" valign="top"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tdPart" valign="top"><table class="bmeImageContainer" style="float:left;" width="560" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tdContainer" valign="top"><table class="bmeImageTable" dimension="50%" imgid="1" style="float:right;" width="270" height="272" cellspacing="0" cellpadding="0" border="0" align="right"><tbody><tr><td name="bmeImgHolder" width="280" valign="top" height="272" align="center"><img src="https://www.benchmarkemail.com/images/templates_n/new_editor/Templates/AppRelease/Screenshot.png" style="max-width: 680px; display: block;" width="270" border="0"></td></tr></tbody></table><table class="bmeCaptionTable" style="float:left;" width="270" cellspacing="0" cellpadding="0" border="0" align="left"><tbody><tr><td name="tblCell" style="font-family: Arial,Helvetica,sans-serif; font-size: 14px; font-weight: normal; color: #383838; text-align: left;" valign="top" align="left"><div style="line-height: 200%; text-align: center;"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 24px; color: #3c3d3c; line-height: 200%;">Appz $9.99</span><br><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: #8d8d8d; line-height: 200%;">You know how when something totally awesome happens during your day and you cannot wait to share the story with a significant other, family or friends? You rush home or dial as fast as you can and it's the first thing that's blurted out of your mouth after pleasantries. This section is that story.</span></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_25" class="blk_wrapper"><table class="blk" name="blk_button" style="background-color: rgb(255, 255, 255);" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td width="20"></td><td align="center"><table class="tblContainer" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td height="10"></td></tr><tr><td align="center"><table class="bmeButton" style="border-collapse: separate;" cellspacing="0" cellpadding="0" border="0" align="center"><tbody><tr><td class="bmeButtonText" style="border-radius: 0px; border: 0px none transparent; text-align: center; padding: 15px 30px; font-weight: normal; background-color: rgb(148, 77, 169);"><span style="font-family: Helvetica, Calibri, Arial, sans-serif; font-size: 14px; color: rgb(255, 255, 255);"><a target="_blank" style="color:#FFFFFF;text-decoration:none;">Download Now</a></span></td></tr></tbody></table></td></tr><tr><td height="10"></td></tr></tbody></table></td><td width="20"></td></tr></tbody></table></div><div id="dv_26" class="blk_wrapper"><table class="blk" name="blk_divider" style="background-color: rgb(255, 255, 255);" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding-top:20px; padding-bottom:20px;padding-left:20px;padding-right:20px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div><div id="dv_27" class="blk_wrapper"><table class="blk" name="blk_divider" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="tblCellMain" style="padding: 40px 0px;"><table class="tblLine" style="border-top-width: 0px; border-top-style: none; min-width: 1px;" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td><span></span></td></tr></tbody></table></td></tr></tbody></table></div></td></tr> </tbody></table> </td></tr>  <tr><td class="blk_container bmeHolder" name="bmeFooter" style="color: rgb(102, 102, 102); border: 0px none transparent; background-color: rgb(255, 255, 255);" width="100%" valign="top" bgcolor="#ffffff" align="center"><div id="dv_10" class="blk_wrapper"><table class="blk" name="blk_footer" style="" width="600" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="tblCell" style="padding:20px;" valign="top" align="left"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td name="bmeBadgeText" style="text-align:left; word-break: break-all;" align="left"><span id="spnFooterText" style="font-family: Arial, Helvetica, sans-serif; font-weight: normal; font-size: 11px; line-height: 140%;"><var type="BME_CANSPAM">This message was sent to test@benchmarkemail.com by <span style="text-decoration:underline;">Benchmark Templates</span></var><br><var type="BME_ADDRESS">10621 Calle Lee, Building 141, Los Alamitos, CA, 90720</var></span><br><br><span style="font-family: Arial, Helvetica, sans-serif; font-weight: normal; font-size: 11px; line-height: 140%;"><var type="BME_LINKS"><span style="text-decoration:underline" href="#"><img src="https://www.benchmarkemail.com/images/verified.png" alt="Unsubscribe from all mailings" title="Unsubscribe from all mailings" border="0"></span><span style="text-decoration:underline;">Unsubscribe</span> | <span style="text-decoration:underline;">Manage Subscription</span> |  <span style="text-decoration:underline;">Forward Email</span>  |  <span style="text-decoration:underline;">Report Abuse</span></var><br></span></td></tr><tr><td name="bmeBadgeImage" style="text-align: left; padding-top: 20px; word-break: break-all;" align="left"><var type="BME_BADGE"><img src="https://www.benchmarkemail.com/images/web4/misc/emailfooter/opt9.png" name="bmeBadgeImage" border="0"></var></td></tr></tbody></table></td></tr></tbody></table></div></td></tr> </tbody></table></td></tr></tbody></table></td></tr></tbody></table>    
</body>    
</html><img    
src='http://benchmarkemail.benchurl.com/c/o?e=8E4B52&c=91CEA&t=1&l=7889F345&email=hL2iimIGZvj2QooSzVze1t7P%2FZjRPRKrj2c0%2B7DqUhU%3D&relid=' alt='' border=0 style="display:none;" height=1 width=1>        
 

          `, 
        })
  })

  console.log("Message sent: %s", info.messageId);
    

      res.render('index',{error:false,msg:'E-mail enviado aguarde o contato do suporte ou admnistração'})
  } catch (error) {
      res.render('index',{error:error,msg:false} )
  }


})

app.post('/login',async (req,res,next)=>{

    try {
    
        const {email,password} = await req.body
        const user = await User.findOne({email:email})
      
        if( user.password == null || !user.password || user.password == undefined){
          res.render('index', {msg:'Usuário ou senha incorretos',error:false})
        }
      
        const pass = bcrypt.compareSync(password, user.password)
      
        if(!user || !pass ){
          res.render('index', {msg:'Usuário ou password incorretos', error:false})
        }
        
        if(user && pass){
          const token = jwt.sign({ _id:user._id }, process.env.TOKEN_SECRET, {
            expiresIn: '7d' // expires in 5min
          });
          res.cookie('Authorization', `${token}`)
      console.log(token)
      
        if(user.admin == true){
          res.redirect('/admin')
        }else if(user.admin == false){
          res.redirect('/minha-conta')
        }else{
          res.redirect('/')
        }
       
        }
        } catch (error) {
          console.log(error)
        }
      
})

app.get('/admin/barman',eAdmin,async(req,res)=>{
  let orders = await Order.find({})
  let produtos = await Product.find({})
  let user = req.user
  res.render('barman',{user:user, produtos:produtos,orders:orders})
})

app.post('/saveProduct', async (req,res)=>{

  try {
    let {name,photo,description,price, category} = await req.body
    let produto = new Product({
      name:name,
      price:price,
      description:description,
      category:category,
      photo:photo
    })
   await produto.save()
   
   res.redirect('/admin')

// Consulta para obter documentos ordenados por data de criação
  try {
      const items = await Product.find({})
        .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
    
      // Atribuir valores numéricos com base na ordem
      items.forEach((item, index) => {
        item.rank = index + 1; // +1 porque os índices começam em 0
      });
    
      // Salvar os documentos atualizados
      await Promise.all(items.map((item) => item.save()));
    
      console.log('Documentos atualizados com sucesso.');
    } catch (error) {
      console.error('Erro ao atualizar documentos:', error);
    }


  } catch (error) {
    console.log(error)
  }
 
})


app.post('/saveOrder',eAdmin, async (req,res)=>{

  try {
    let { userClient, order,total} = await req.body
    let pedido = new Order({
      userClient:userClient,
      order: order,
      total:total,
    })
   await pedido.save()
   res.redirect(`/admin`)
    try {
        const items = await Order.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
 
  } catch (error) {
    res.json(error)
  }
 
})

app.post('/saveUser', async (req,res)=>{

  try {
    let {name,email,address,photo,cep,cpf,city,country,state,cnpj,password} = await req.body
    let user = new User({
      name:name,
      email:email,
      password:bcrypt.hashSync(password, 8),
      address:address,
      photo:photo,
      cep:cep,
      cpf:cpf,
      city:city,
      country:country,
      state:state,
      cnpj:cnpj
    })
   await user.save()
   console.log('usuário salvo')

   res.redirect('/admin')
    try {
        const items = await User.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
 
  } catch (error) {
    console.log(error)
  }
 
})

app.post('/iela/saveUser', async (req,res)=>{

  try {
    let {name,email,address,cep,city,state,password,bairro,country,phone,lastname,address_id} = await req.body
    let cpf = ''
    let street_number = '0000'
    let user = new User({
      name:name,
      email:email,
      password:bcrypt.hashSync(password, 8),
      address:address,
      cep:cep,
      city:city,
      country:country,
      state:state,
      bairro:bairro,
      phone:phone,
      lastname:lastname,
      cpf:cpf,
      address_id:address_id
    })
   await user.save()
   console.log('usuário salvo')
   let srt_number = parseInt(street_number)

   const timestamp = Date.now();
   const stringTimestamp = timestamp.toString();
   let stringSemEspacosEHifens = cep.replace(/[\s-]/g, "");
  

   const body = {
     email: email,
     first_name: name,
     last_name: lastname,
     phone: {
       area_code: '55',
       number: phone
     },
     identification: {
       type: 'CPF',
       number: cpf
     },
     default_address: 'Home',
     address: {
       id: address_id,
       zip_code: stringSemEspacosEHifens,
       street_name: address,
       street_number: srt_number,
       city: {
         name:city
       }
     },
     date_registered: stringTimestamp,
     description: 'Description del user',
     default_card: 'None'
   };
   
   customer.create({ body: body }).then(console.log).catch(console.log);

   res.redirect('/')
    try {
        const items = await User.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }


 
  } catch (error) {
    console.log(error)
  }
 
})

app.post('/iela/check-email',async (req,res)=>{

  try {
    let email = await req.body.email;

    const userExists = await User.findOne({$or: [{email: email}]})
    console.log(userExists)
    // Realize a validação de acordo com suas regras
      if (userExists == null || userExists == undefined || !userExists) {
         res.status(200).send('E-mail válido');
      }else{
        res.status(403).send('E-mail inválido')

      }       

      // Você pode adicionar regras de validação mais complexas aqui

      // Se a validação passar, você pode salvar no banco de dados ou retornar uma mensagem de sucesso
      // Exemplo de salvamento no banco de dados:

       res.status(200)

     
  } catch (error) {
      console.error(error);
      return res.status(500).send('Erro interno do servidor.');
  }
})

app.get('/admin/products',eAdmin,async (req,res)=>{
  try {
    let user = req.user
    let produtos = await Product.find({})
    res.render('produtos',{produtos:produtos,user:user})
  } catch (error) {
    console.log(error)
  }
  })
  

app.get('/admin/users',eAdmin,async (req,res)=>{
  try {
    let user = req.user
    let users = await User.find({})
    res.render('users',{users:users,user:user})
  } catch (error) {
    console.log(error)
  }
  })

  /*app.get('/admin/Orders',eAdmin,async (req,res)=>{
    try {
      let user = req.user
      let Orders = await Order.find({})
      res.render('Orders',{Orders:Orders,user:user})
    } catch (error) {
      console.log(error)
    }
    })*/


app.delete('/admin/produto/:id',eAdmin,async (req,res)=>{
  let id = req.params.id
  if(!id){
    id = req.body.id
  }
try {
  await Product.findByIdAndDelete(id)
  res.redirect('/admin/produtos')
    try {
        const items = await Product.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
  
} catch (error) {
  console.log(error)
}
})


app.delete('/admin/user/:id',eAdmin,async (req,res)=>{
  let id = req.params.id
  if(!id){
    id = req.body.id
  }
try {
  await User.findByIdAndDelete(id)
  res.redirect('/admin')

    try {
        const items = await User.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
  
} catch (error) {
  console.log(error)
}
})

app.delete('/admin/order/:id',eAdmin,async (req,res)=>{
  let user = req.user
  let id = req.params.id
  if(!id){
    id = req.body.id
  }
try {
  await Order.findByIdAndDelete(id)
  res.redirect(`/admin`)
    try {
        const items = await Order.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
 
} catch (error) {
  console.log(error)
}
})


app.put('/admin/editUser/:id', eAdmin,async (req,res)=>{
  let id = await req.params.id
  if(!id){
    id = await req.body.id
  }

  let {name,email,address,photo,cep,cpf,city,country,state,cnpj,phone,whatsapp} = req.body

  let user = await User.findByIdAndUpdate({_id:id},{
    name:name,
    email:email,
    address:address,
    cep:cep,
    cpf:cpf,
    cep:cep,
    state:state,
    cnpj:cnpj,
    city:city,
    country:country,
    photo:photo,
    phone:phone,
    whatsapp:whatsapp
  },{new:true})
  
  res.redirect('/admin')
  // console.log(motoReferer)
 
  // let doc = await check.save()
  // let mt =await Moto.findByIdAndUpdate({_id:id},{checklists:doc},{new:false})
  const items = await User.find({})
  .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt

// Atribuir valores numéricos com base na ordem
items.forEach((item, index) => {
  item.rank = index + 1; // +1 porque os índices começam em 0
});

// Salvar os documentos atualizados
await Promise.all(items.map((item) => item.save()));

console.log('Documentos atualizados com sucesso.');
 
 
  
})

app.put('/admin/editProduct/:id',eAdmin, async (req,res)=>{
  let id = await req.params.id
  if(!id){
    id = await req.body.id
  }

  let {name,price,description,photo,category} = req.body

  let product = await Product.findByIdAndUpdate({_id:id},{
    name:name,
    price:price,
    photo:photo,
    category:category,
    description:description
  },{new:true})
  
  res.redirect('/admin/produtos')
  // console.log(motoReferer)
 
  // let doc = await check.save()
  // let mt =await Moto.findByIdAndUpdate({_id:id},{checklists:doc},{new:false})
  const items = await Product.find({})
  .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt

// Atribuir valores numéricos com base na ordem
items.forEach((item, index) => {
  item.rank = index + 1; // +1 porque os índices começam em 0
});

// Salvar os documentos atualizados
await Promise.all(items.map((item) => item.save()));

console.log('Documentos atualizados com sucesso.');
 
 
  
})



app.listen(port, (error)=>{
  if(error){
    console.log(error)
  }else{
    console.log('runnin on port', port)
  }
})