
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
const Bag = require('./models/Bag')
const Product = require('./models/Product')
const Signature = require('./models/Signature')
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
  app.use(logger('dev'));
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser())

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
//const multer = require('multer'); // Biblioteca para lidar com uploads de arquivoss
// const sharp = require('sharp')
mongoose.connect(process.env.MONGO_ATLAS).then(()=>{
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

const axios = require('axios')

let { MercadoPagoConfig, Payment, Customer, MerchantOrder,PreApproval, PreApprovalPlan, CustomerCard , CardToken} = require('mercadopago');


// Step 2: Initialize the client object
const client = new MercadoPagoConfig({ accessToken: 'TEST-4911284730753864-010809-73732c6bb200ed0a86ceaea651e856c0-1058457871'});


// Step 3: Initialize the API object
const payment = new Payment(client)
const customer = new Customer(client)
const merchantOrder = new MerchantOrder(client)
const preApproval = new PreApproval(client) 
const preApprovalPlan = new PreApprovalPlan(client)
const customerCard = new CustomerCard(client)
const cardToken = new CardToken(client)
const mercadoPagoPublicKey = 'TEST-f609a46a-df09-4fe6-a4b2-e7688d449f94';
if (!mercadoPagoPublicKey) {
  console.log("Error: public key not defined");
  process.exit(1);
}
 
async function jk(){
  let hj = await customer.listCards({customerId:'1642011778-8UfOsg4PcyvaKy' })
console.log(hj)
}
jk()


const fs = require('fs');
const { truncate } = require('fs/promises')
const Cart = require('cestino')
app.use(cors())
app.use(express.static(path.join(__dirname,'public')))
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.json({limit: '100mb'}))
app.use(express.urlencoded({extended:true,limit: '100mb'}))
app.use(methodOverride('_method'))

app.post('/create_signaturePlan',async(req,res)=>{
  try {
    let user = req.user
    let { reason, auto_recurring, frequency_type, repetitions, frequency,billing_day, billing_day_proportional, frequency_trial, frequency_type_trial, transaction_amount } = await req.body;
 
 const signatureData =   {
      reason: reason,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequency_type,
        repetitions: repetitions,
        billing_day: billing_day,
        billing_day_proportional: billing_day_proportional,
        free_trial: {
          frequency: frequency_trial,
          frequency_type: frequency_type_trial
        },
        transaction_amount: transaction_amount,
        currency_id: "BRL"
      },
      /*payment_methods_allowed: {
        payment_types: [
          {
            id:'credit_card'
          }
        ],
        payment_methods: [
          {}
        ]
      },*/
      back_url: "/admin"
    }

 let signature = await preApprovalPlan.create({body:signatureData})
 console.log(signature)
  
   } catch (error) {
    console.log(error)
   }


})

app.post('/create_signature',async(req,res)=>{
  try {
    let user = req.user
    
    let { transaction_amount, payer_email, email, cpf, name, address, city, state, country, cep,phone, method, token} = await req.body;
   // let token = await req.body.token
    console.log(token)
    console.log(req.body)
   console.log(method)
    const dataAtual = new Date();
    // Adicionar 2 dias
    const data2 = new Date(dataAtual);
    const data30 = new Date(dataAtual);

    data2.setDate(dataAtual.getDate() );
    data30.setDate(dataAtual.getDate() + 2);

    // Formatar as datas para o formato ISO 8601
const formatoISO = { timeZone: 'UTC' };
const dataAtualFormatada = data2.toISOString().split('T')[0];
const dataFuturaFormatada = data30.toISOString().split('T')[0];

console.log('Data Atual:', dataAtualFormatada);
console.log('Data Futura (2 dias depois):', dataFuturaFormatada);
    
 const signatureData =   {
      reason: 'IelaBag assinatura',
      //external_reference:external_reference,
      card_token_id:token,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'days',
        start_date:data2,
        end_date: data30, 
        transaction_amount: transaction_amount,
        currency_id: "BRL"
      },
      status:'pending',
      payer_email:email,
    /*  external_reference:cpf,
      payment_methods_allowed: {
        payment_types: [
          {
            id:method
          }
        ],
      },*/
    
      back_url: "https://google.com"
    }

 let signature = await preApproval.create({body:signatureData})
 
 console.log(signature,'3333333')
 const userexist = await User.findOne({$or: [{payer_id: signature.payer_id}]})

if(userexist == null || userexist == undefined || !userexist){
  const usrexist = await User.findOne({$or: [{email: email}]})
    if(usrexist == null || usrexist == undefined || !usrexist){
        let newuser = new User({
          name:name,
          lastname:lastname,
          payer_id: signature.payer_id,
          email:email,
          password:bcrypt.hashSync(uuidv4(), 8),
          address:address,
          cep:cep,
          cpf:cpf,
          city:city,
          country:country,
          state:state,
     
          phone:phone
        })
        await newuser.save()
        console.log('usuario salvo mediante assinatura sem plano associado')
        res.redirect('/')
    }else{
      await User.findByIdAndUpdate({_id:usrexist._id},{
        payer_id:signature.payer_id
      },{new:true})
      console.log('payer_id atualizado')
      res.redirect('/')
    }
}
 

 //console.log(signature)
  res.redirect('/quiz')
   } catch (error) {
    console.log(error, 'create_signature')
   }


})

app.post('/capture_payment/:id',async(req,res)=>{

  try {
    let user = await req.user
  let {id, transaction_amount, _id, userid} = await req.body
if(!id) {
  id = req.params.id
}
console.log(transaction_amount, id, _id,userid, 'HEYAH')
  payment.capture({
    id: id,
    transaction_amount: parseInt(transaction_amount),
    requestOptions: {
    idempotencyKey: uuidv4()
    }
    }).then(async (da)=>{
//console.log(da)

const updatedUser = await User.findByIdAndUpdate(
  userid,
  { $set: { "orders.$[elem].order.status_detail": da.status_detail } },
  { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
);
console.log(updatedUser, 'updated capture')

let nowOrder1 = await Order.findByIdAndUpdate({_id:_id}, {order:da}, { new: true })
console.log(nowOrder1,'PEDIDO ATUALIZADO')
      res.redirect('/minha-conta')

    }).catch(async err=>{
    res.json(err.message)
    });
  } catch (error) {
    console.log(error)
  }

})

app.put('/update_signature/:id',async(req,res)=>{

  try {

    let {id, transaction_amount} = await req.body
    if(!id) {
      id =  req.params.id
    }
    
    let updateSignature = await preApproval.update({
      id: id,
      body:{
        auto_recurring:{
        transaction_amount: parseInt(transaction_amount),
        },
      },
      requestOptions: {
      idempotencyKey:  uuidv4()
      }
      })
    console.log(updateSignature)
    res.redirect('/admin')
  } catch (error) {
    console.log(error)
  }
 
})

app.put('/cancel_signature/:id',async (req,res)=>{

  try {
    let {id, transaction_amount} =await  req.body
    if(!id) {
      id = req.params.id
    }
    console.log(transaction_amount)
    preApproval.update({
      id: id,
      body:{
        transaction_amount: parseInt(transaction_amount),
        status:'cancelled'
      },
      requestOptions: {
      idempotencyKey:  uuidv4()
      }
      }).then(()=>{



      res.redirect('/admin')
    }).catch(console.log);
     
  } catch (error) {
    console.log(error)
  }

})

app.post('/parcial/:id',async (req,res)=>{

  try {
    let user = await req.user
    let {id, transaction_amount, _id, userid, issuer_id, cart} = await req.body
   
    console.log(JSON.stringify(cart))
  if(!id) {
    id = await req.params.id
  }
  console.log(await req.body, 'HEYAH')

/*  let cap = await payment.capture({
    id: id,
    transaction_amount: 12.34,
    requestOptions: {
    idempotencyKey: '123'
    
    },
    status:true
    })
    console.log(cap)
      let accessToken = 'TEST-4911284730753864-010809-73732c6bb200ed0a86ceaea651e856c0-1058457871'
    let tr = parseFloat(transaction_amount)
    const url = `https://api.mercadopago.com/v1/payments/${id}`;
    const updateData = {
      status_detail:'accredited',
      transaction_amount:tr,
      
      // Adicione outros campos que deseja atualizar
    };
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer TEST-4911284730753864-010809-73732c6bb200ed0a86ceaea651e856c0-1058457871`,
      },
    };    
let rsp = await axios.put(url, updateData, config)
console.log(rsp)

let da = await payment.capture({
  id: id,
  transaction_amount: parseInt(transaction_amount),

  }) 

const updatedUser = await User.findByIdAndUpdate(
  userid,
  { $set: { "orders.$[elem].order.status_detail": rsp.data.status_detail } },
  { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
);
let nowOrder1 = await Order.findByIdAndUpdate({_id:_id}, {order:da}, { new: true })
console.log(nowOrder1,'PEDIDO ATUALIZADO')
      res.redirect('/minha-conta')    */
   
      const timestamp1 = await Date.now();
      const stringTimestamp1 = await timestamp1.toString();


  let userid1 = await User.findById({_id:userid})
  let ord = await Order.findById({_id:_id})

  let customerSearch = await  customer.search({options:{email:userid1.email}})
  console.log(customerSearch, 'SEARCHED')
  console.log(ord.order.payer.email, ord.order.payer)

 const clientData1 = {
    email: userid1.email,
   first_name: ord.order.payer.first_name,
    last_name: ord.order.payer.last_name,
    phone:{
      number:ord.order.payer.phone.number,
      area_code:ord.order.payer.phone.area_code
    },
    identification: {
      type: ord.order.payer.identification.type,
      number: ord.order.payer.identification.number
    },
 //   default_address: 'Home',
    address: {
      id: userid1.address,
      zip_code: userid1.cep,
      street_name: userid1.address,
      street_number: userid1.street_number,
      city: {
        name:userid1.city
      },
    
   
    },
   
  
  };

  if(customerSearch.results.length == 0){
  let nCustomer =  await customer.create({ body: clientData1 })
  console.log(cardCustomer)

  let cardCustomer =  await customerCard.create({customerId:nCustomer,body:{token:nCustomer.token}})
  console.log(cardCustomer)
  }

    const userEmail1 = await User.findOne({$or: [{email: ord.order.payer.email}]})
//console.log(userEmail1)

let customerGet = await customer.get({ customerId: '1642011778-8UfOsg4PcyvaKy' })

console.log(customerGet,'RESUKTTTTT')

const body = {
     cardholder : ord.order.card.cardholder,
     issuer_id: ord.order.issuer_id,
     payment_method: ord.order.payment_method.type,
     card:ord.order.card,
};

let crCustomer = await cardToken.create({ body:body })
console.log(crCustomer,'CRRRRRRRRRRR')
let y = {
  token: crCustomer,
   transaction_amount: parseFloat(transaction_amount),
   description: `Pagamento parcial capturado ${id}`,
   payment_method_id: ord.order.payment_method_id,
   issuer_id:issuer_id,
   installments:1,
   capture:true,
   payer:{
     first_name:ord.order.payer.first_name,
     last_name:ord.order.payer.lasr_name,
     identification:ord.order.payer.identification,
     entity_type:ord.order.payer.entity_type,
     email:userid1.email
   }
   }

   let npayment = await payment.create({ body: y})
    
  
        let order3 = await new Order({
          order:npayment,
          items:await JSON.parse(cart)
        })
  
       await order3.save()
       let usrs = await User.findByIdAndUpdate({_id:userid1._id},{$push: { orders: order3 }},{new:true})
  
        console.log(npayment,'PAGAMENTO CAPTURADO')
  
        const removeOrderIndUser = await User.findByIdAndUpdate(
          userid,
          { $pull: { orders: { _id: new mongoose.Types.ObjectId(_id) } } },
          { new: true }
        );
        console.log(removeOrderIndUser, 'removed order and its related array');
  
  
        // Excluir o documento relacionado na coleção Order
  const removedOrder = await Order.findByIdAndRemove({ _id: _id });
  console.log(removedOrder, 'removed order');
  console.log('pedido re,ovido ou atualizado')  
  
      
  
    //let customerCreate = await customer.create({ body: clientData1 })
  
  
    
  
  
  
  
  
    
          res.redirect('/minha-conta')







  } catch (error) {
    console.log(error)
  }
 
  
})

app.post('/cancel_payment/:id',async (req,res)=>{
  let {id, transaction_amount, _id, userid} = await req.body
if(!id) {
  id = req.params.id
}
console.log(transaction_amount)
payment.cancel({
	id: id,
	requestOptions: {
		idempotencyKey: uuidv4()
	},
}).then(async (da)=>{

  const updatedUser = await User.findByIdAndUpdate(
    userid,
    { $set: { "orders.$[elem].order.status_detail": da.status_detail } },
    { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
  );
  console.log(updatedUser, 'updated cancel payment')
  let nowOrder = Order.findByIdAndUpdate({_id:_id}, data, { new: true })
console.log(nowOrder,'PEDIDO ATUALIZADO')
        res.redirect('/admin')

  res.redirect('/admin')
}).catch(console.log);
 
})

app.post('/logout',async (req,res)=>{
  try {
    let tk = await req.body.tk
    console.log(tk)
   let tt = await jwt.verify(tk,process.env.TOKEN_SECRET).payload
   await tt.destroy()
    res.redirect('/')
  } catch (error) {
    console.log(error)
  }
})


app.post('/process_payment', async (req,res)=>{


   try {
    let user = req.user
    const { payer,token,description,transaction_amount,paymentMethodId,installments,issuerId,phone,street_number, cep,address,whatsapp,name,lastname,email,items,cpf,city,state, birthday, gender,country,bairro } = await req.body;
    let srt_number = parseInt(street_number)
    console.log(payer,items)
    console.log(req.body)
   let passnew = await uuidv4()
    const timestamp = Date.now();
    const stringTimestamp = timestamp.toString();
    //let stringSemEspacosEHifens = cep.replace(/[\s-]/g, "");
    const clientData = {
      email: payer.email,
      first_name: payer.first_name,
      last_name: payer.last_name,
      phone: payer.phone,
      identification: {
        type: payer.identification.type,
        number: payer.identification.number
      },
   //   default_address: 'Home',
      address: {
        id: address,
        zip_code: cep,
        street_name: address,
        street_number: srt_number,
        city: {
          name:city
        },
        phone:payer.phone,
        state:state
      },
      date_registered: stringTimestamp,
      description: description,
    };
    
  ///// RESOLVER APARTE DA RENDERIZAÇÃO DOS ITEMS /////////////////////////////////////////////////////////
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
    //  COLOCAR O PEDIDO DENTRO DO ARRAY order E SALVAR NO MODEL ORDER.JS EM CADA CASO ONDE USO O MÉTODO paymente.create SERÁ NECESSÁRIO ATUALIZAR O USUÁRIO COM O PEDIDO OU CRIAR UM NOVO 
    // USUÁRIO  COM NOVO PEDIDO GERADO 
    customer.search({options:{email:payer.email}}).then((data)=>{
      console.log(data,data.results.length)
    if(data.results.length == 0)
  {
  
    customer.create({ body: clientData }).then(async (data)=>{
     // console.log(data)
      console.log('novo cliente')


      const userEmail1 = await User.findOne({$or: [{email: payer.email}]})
//console.log(userEmail1, 'USER EMAILLLLLLLLLLLLLLLLL')
if(userEmail1){

  payment
  .create({ body: paymentData })
  .then(async function (data) {
 /*   res.status(201).json({
      detail: data.status_detail,
      status: data.status,
      id: data.id,
      
    });*/
    let order1 = new Order({
      order:data,
      items:items
    })
   await order1.save()

   let usr = await User.findByIdAndUpdate({_id:userEmail1._id},{$push: { orders: order1 }},{new:true})
  // console.log(usr)
  // console.log(data,' <- pagamento criado' )
  res.redirect('/quiz')
  })
  .catch(function (error) {
    console.log(error);
//    const { errorMessage, errorStatus } = validateError(error);
    res.json({ error });
  });

 
   console.log('USUÁRIO SALVO NO BANCO')
//   res.redirect('/quiz')

}else{
  const newUser1 = new User({
    idmp:data.id,
    name:data.first_name,
    lastname:data.last_name,
    bairro:bairro,
    password:bcrypt.hashSync(passnew, 8),
    external_reference:data.external_reference,
    email:data.email,
    country:country,
    address:data.address.street_name,
    payer_id:data.id,
    billing_address:{
     city:city,
     address:data.address.street_name,
     street_number:srt_number,
     state:state,
     country:country,
     bairro:bairro,
     cep:cep
    },
    city:city,
    orders:data,
    gender:gender,
    birthday:birthday,
    cep:cep,
    state:state,
    cpfcnpj:data.identification.number,
    phone:phone,
    whatsapp:whatsapp,
    street_number:srt_number
    })
   await  newUser1.save()

   let order2 = new Order({
    order:data,
    items:items
  })
 await order2.save()
 let usrs = await User.findByIdAndUpdate({_id:newUser1._id},{$push: { orders: order2 }},{new:true})

   res.redirect('/quiz')

}


         
    payment
    .create({ body: paymentData })
    .then(async function (data) {
   /*   res.status(201).json({
        detail: data.status_detail,
        status: data.status,
        id: data.id,
        
      });*/
      let order1 = new Order({
        order:data,
        items:items
      })
     await order1.save()
  //   console.log(data,' <- pagamento criado' )
    res.redirect('/quiz')
    })
    .catch(function (error) {
      console.log(error);
  //    const { errorMessage, errorStatus } = validateError(error);
      res.json({ error });
    });
    }).catch(err => console.log(err));

  }else{
  payment
  .create({ body: paymentData })
  .then(async function (data) {

 //  console.log(data,' <- pagamento criado  e dados do usuário atualizado' )
  
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
  /*let order = new Order({
    order:data
  })
  let ord = [...order3]

 await order.save()*/
 const userEmail = await User.findOne({$or: [{email: payer.email}]})
 console.log(userEmail, 'USER EMAILLLLLLLLLLLLLLLLL')

 let order3 = await new Order({
  order:data,
  items:items
  
})

await order3.save()

 let usr = await User.findByIdAndUpdate({_id:userEmail._id},{$push: { orders: order3 }},{new:true})
 //console.log(usr, 'EMAIL ENCONTRADO')
  res.redirect('/quiz')
  })

  .catch(function (error) {
    console.log(error);
//    const { errorMessage, errorStatus } = validateError(error);
    res.json({ error });
  });
  }  
   // console.log(data)

      }).catch(console.log);
     // res.redirect('/quiz')
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
    let bags = await Bag.find({})
    res.render('loja',{user:user,publicKey:mercadoPagoPublicKey, products:products,bags:bags}) 
  } catch (error) {
    console.log(error)
  }

})

app.get('/admin',eAdmin,async(req,res)=>{

  try {
  let user = await req.user
  if(req.user.admin){
    let users = await User.find({})
    let products = await Product.find({})
    let orders = await Order.find({})
    let payments = await payment.search()
    let signatures = await preApproval.search()
    let totalPaid = await payments.results
    .filter((f) => f.captured === true)
    .reduce((sum, transaction) => {
      const netReceivedAmount = transaction.transaction_details.net_received_amount;
  
      return sum + netReceivedAmount;
    }, 0);
    const formattedTotal = totalPaid.toFixed(2);

    console.log("Total Net Received Amount (Last Two Decimals):", totalPaid / 100); // Convertendo de centavos para reais

    res.render('admin/admin',{user:user,users:users,payments:payments.results,signatures:signatures.results, products:products,orders:orders,total:formattedTotal, msg:false})
  }else{
    res.redirect('/minha-conta')
  }
 
  } catch (error) {
    console.log(error)
  }
  
})

app.put('/update-delivery-address/:id',async(req,res)=>{

  try {
    let id = req.params.id
    if(!id){
      id = req.body.id
    }
    let {cep, street_number, address, city, bairro, state, country} = await req.body
    let deliveryAddress = await User.findByIdAndUpdate({_id:id},{
      address:address,
      cep:cep,
      state:state,
      city:city,
      country:country,
      street_number:street_number,
      bairro:bairro
    },{new:true})
  
    if(deliveryAddress.admin == true){
      res.redirect('/admin')
    }else{
      res.redirect('/minha-conta')
    }
  } catch (error) {
    console.log(error)
  }

})

app.post('/registerBag',async (req,res)=>{

  try {
    let {products, name, price,photo, description} = await req.body // Obter os produtos do corpo da requisição

    // Verifique se 'products' é um array e não está vazio
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Formato de produtos inválido' });
    }
console.log(products)
    // Crie uma nova instância de Bag
    const newBag = new Bag({ 
      name:name,
      price:price,
      photo:photo,
      items:products,
      description:description
    })
    // Adicione os produtos à lista de items da nova sacola
   // newBag.items = products.map(product => product._id); // Supondo que 'products' contenha IDs de produtos válidos
    // Salve a nova sacola no banco de dados
    await newBag.save();

    console.log('Nova bag criada:', newBag);
    res.status(200).json({ message: 'bag criada com sucesso' });
  } catch (error) {
    console.error('Erro ao criar a bag:', error);
    res.status(500).json({ error: 'Erro ao criar a bag' });
  }

})

app.put('/editBag/:id',async (req,res)=>{


  try {
    let id = await req.params.id
    if(!id){
      id = await  req.body.id
    }
    let {price, description, photo, items,name} = await req.body
    let bag = await Bag.findByIdAndUpdate({_id:id},{
     price:price,
     descriptiom:description,
     photo:photo,
     items:items,
     name:name
    },{new:true})
  res.redirect('/admin')
  } catch (error) {
    console.log(error)
  }

})

app.put('/update-billing-address/:id',async(req,res)=>{

  try {
    let id = req.params.id
    if(!id){
      id = req.body.id
    }
    let {cep, street_number, city, bairro, state, country, address} = await req.body
    let billingAddress = await User.findByIdAndUpdate({_id:id},{
      billing_address:{
        cep:cep,
        street_number:street_number,
        city:city,
        state:state,
        country:country,
        bairro:bairro,
        address:address
      },
    
    },{new:true})

    if(billingAddress.admin == true){
      res.redirect('/admin')
    }else{
      res.redirect('/minha-conta')
    }
  } catch (error) {
    
  }

})


app.get('/',(req,res)=>{
  res.render('index',{msg:false})
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
// GERAR UM PEDIDO, UMA ASSINATURA E PESQUISA DE CLIENTES USANDO E-MAIL TESTE RAFA@RAFA.COM SENHA 123 PRA RENDEZIRAR OS DADOS CORRETAMENTE DINAMICAMENTE DE ACORDO DE COMO ESTA VINDO NO CONSOLE.LOG QUE AINDA VOU FAZER
app.get('/minha-conta',eAdmin,async(req,res)=>{
  try {
    if(req.user.admin == false){
      let user = await req.user
   //   let cli =await customer.get({customerId:user.idmp})
     // let payments = await payment.search({})
      //let signatures = await preApproval.search({})
  //  console.log(signatures,'SIGNATURES')
  // const sigs = await signatures.results.filter( sig => sig.external_reference == user.cpf);
  //console.log(sigs)
      res.render('cli/cli',{user:user,msg:false, publicKey:mercadoPagoPublicKey})
    }else{
      res.redirect('/')
    }
   
  } catch (error) {
    console.log(error)
  }
 
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
      console.log(user)
        if(user == null || user == undefined || user.password == null || !user.password || user.password == undefined ){
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
  let user = await req.user
  let users = await User.find({})
  let payments = await payment.search()
  let signatures = await preApproval.search()
  try {
   

    let {name,email,address,photo,cep,cpf,city,country,state,cnpj,password,street_number, lastname,phone} = await req.body
    
    const userExistss = await User.findOne({$or: [{email: email},{cpf:cpf}]})
    if (userExistss == null || userExistss == undefined || !userExistss) {
      let srt_number = parseInt(street_number)
    const timestamp2 = Date.now();
    const stringTimestamp2 = timestamp2.toString();
    const clientData2 = {
      email: email,
      first_name: name,
      last_name: lastname,
     // phone: phone,
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
        },
     
        state:state
      },
      date_registered: stringTimestamp2,
      description: '',
      phone:{
        area_code:'55',
        number:phone
      }
    };
let newCustomer = await customer.create({body:clientData2})
console.log(newCustomer)

      let user = new User({
        name:name,
        lastname:lastname,
        idmp: newCustomer.id,
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
   }else{
     res.render('admin/admin',{user:user,payments:payments.results,users:users,signatures:signatures.results,msg:'Já existe um E-mail ou CPF cadastrado'})
   }    
   
 
  } catch (error) {
    console.log(error)
  }
 
})

app.post('/iela/saveUser', async (req,res)=>{

  try {
    console.log(await req.body)
    let {name,email,address,cep,city,state,password,bairro,country,phone,lastname} = await req.body
    const userExists = await User.findOne({$or: [{email: email}]})
    if (userExists == null || userExists == undefined || !userExists) {
      let cpf = ''
      let street_number = '0000'
   
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
         id: address,
         zip_code: stringSemEspacosEHifens,
         street_name: address,
         street_number: srt_number,
         city: {
           name:city
         }
       },
       date_registered: stringTimestamp,
       description: 'IelaBag Assinatura',
       default_card: 'None'
     };
     
   let cust = await customer.create({ body: body })
   
   console.log(cust, 'CUSTOMER')
   let user = new User({
    name:name,
    idmp : cust.id,
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
  //  external_reference:cust.external_reference
  })
 await user.save()
 console.log('usuário salvo')
     res.redirect('/quiz')
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
   }else{
     res.status(403).send('E-mail inválido')
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

  try {
    let {name,email,address,photo,cep,cpf,city,country,state,cnpj,phone,whatsapp} = req.body
  let user = await req.user
  let users = await User.find({})
  let payments = await payment.search()
  const userEx = await User.findOne({$or: [{email: email,cpf:cpf}]})
  if (userEx == null || userEx == undefined || !userEx) {
    let user = await User.findByIdAndUpdate({_id:id},{
      name:name,
      email:email,
      address:address,
      cep:cep,
      cpf:cpf,
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
  }else{
    res.render('admin/admin',{user:user,payments:payments.results,users:users,msg:'Já existe um E-mail ou CPF cadastrado'})
  }
  } catch (error) {
    let userr = await req.user
    let usersr = await User.find({})
    let paymentsr = await payment.search()
    res.render('admin/admin',{user:userr,payments:paymentsr.results,users:usersr,msg:'Já existe um E-mail ou CPF cadastrado',error:false})

  } 
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

app.get('/quiz',(req,res)=>{
  let user = req.user
  res.render('quiz', {user:user})
})

app.listen(port, (error)=>{
  if(error){
    console.log(error)
  }else{
    console.log('runnin on port', port)
  }
})