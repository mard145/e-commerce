
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
let { MercadoPagoConfig, Payment } = require('mercadopago');

// Step 2: Initialize the client object
const client = new MercadoPagoConfig({ accessToken: 'TEST-2786362695625116-120401-0596ae3d8c32e13740229eb17d033c5e-1058457871'});

// Step 3: Initialize the API object
const payment = new Payment(client);
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


app.post('/process_payment',express.json(),express.urlencoded({extended:true}), async (req,res)=>{
  let user = req.user
  const { payer,token,description,transactionAmount,paymentMethodId,installments,issuerId,phone } = req.body;
  

  const paymentData = {
    transaction_amount: Number(transactionAmount),
    token: token,
    description: description,
    installments: Number(installments),
    payment_method_id: paymentMethodId,
    issuer_id: issuerId,
    payer: {
      email: payer.email,
      phone:phone,

      identification: {
        type: payer.identification.docType,
        number: payer.identification.docNumber,
      },
    },
    capture:false
  };

  payment
    .create({ body: paymentData })
    .then(async function (data) {
      res.status(201).json({
        detail: data.status_detail,
        status: data.status,
        id: data.id,
        
      });
     console.log(data)
    
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
})

app.get('/', (req,res)=>{
    res.render('index',{msg:false,error:false})
})

app.get('/store',async (req,res)=>{
  try {
    let user = await req.user
    let products = await Product.find({})
    res.render('loja',{user:user,publicKey:mercadoPagoPublicKey, products:products}) 
  } catch (error) {
    console.log(error)
  }

})

app.get('/admin',(req,res)=>{
  let user = req.user
  res.render('admin',{user:user})
})

app.get('/profile',eAdmin,(req,res)=>{
  let user = req.user
  res.render('profile',{user:user})
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
          res.redirect('/user')
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
  res.redirect('/admin/users')

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
  
  res.redirect('/admin/users')
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