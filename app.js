
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
//var MongoDBStore = require('connect-mongodb-session')(session);

/*var store = new MongoDBStore({
  uri:process.env.ATLAS,
  collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});
*/
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: "mail.ielabag.com.br",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: 'teste@ielabag.com.br',
    pass: 'slipknots2145#'
  }
});


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
/*app.use(require('express-session')({
  secret: tokenSecret,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));*/
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
mongoose.connect(process.env.ATLAS).then(()=>{
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
const {CronJob} = require('cron')

const MemoryStore = require('memorystore')(session)

app.use(session({
    cookie: { maxAge: 86400000 },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    resave: true,
    saveUninitialized: true,
    secret: process.env.TOKEN_SECRET
}))
let me = require('mercadopago')
let { MercadoPagoConfig, Payment, Customer, MerchantOrder,PreApproval, PreApprovalPlan, CustomerCard , CardToken} = require('mercadopago');


// Step 2: Initialize the client object
const client = new MercadoPagoConfig({ accessToken: process.env.ACESSTOKENNEWPROD});
const clientSignature = new MercadoPagoConfig({ accessToken: process.env.ACESSTOKENSIGMYPROD});


// Step 3: Initialize the API object

const payment = new Payment(client)
const customer = new Customer(client)
const merchantOrder = new MerchantOrder(client)
const preApproval = new PreApproval(client) 
const sigPreApproval = new PreApproval(clientSignature)
const customerCardSig = new CustomerCard(clientSignature)
const customerSig = new Customer(clientSignature)
const cardTokenSig = new CardToken(clientSignature)
const preApprovalPlan = new PreApprovalPlan(client)
const customerCard = new CustomerCard(client)
const cardToken = new CardToken(client)
const mercadoPagoPublicKey =  process.env.PUBLICKETNEWPROD;

if (!mercadoPagoPublicKey) {
  console.log("Error: public key not defined");
  process.exit(1);
}

const mercadoPagoPublicKeySignature = process.env.PUBLICKEYSIGMYPROD ;
if (!mercadoPagoPublicKeySignature) {
  console.log("Error: public key not defined");
  process.exit(1);
}


async function capture2Days() {
  try {
    
      // Buscar todos os pagamentos com status "pending_capture"
      const response = await payment.search({
          qs: {
              status_detail: 'pending_capture'
          }
      });

      const pagamentosPendentesCapture = response.results;

      // Capturar pagamentos que têm exatamente dois dias de idade e não são "approved"
      const dataAtual = new Date();
      const doisDiasEmMilissegundos = 2 * 24 * 60 * 60 * 1000; // 2 dias em milissegundos

      for (const pagamento of pagamentosPendentesCapture) {
          const dataCriacaoPagamento = new Date(pagamento.date_created);
          const diferencaTempo = dataAtual - dataCriacaoPagamento;

          // Verificar se o pagamento tem exatamente dois dias de idade e não é "approved"
          if (diferencaTempo >= doisDiasEmMilissegundos &&
              pagamento.status !== 'approved' &&
              diferencaTempo <= (doisDiasEmMilissegundos + 1000)) { // Leva em conta uma margem de erro de 1 segundo
              await payment.capture({
                  id: pagamento.id,
                  transaction_amount: pagamento.transaction_amount,
                  requestOptions: {
                      idempotencyKey: uuidv4()
                  }
              });
              console.log(`Pagamento ${pagamento.id} capturado com sucesso.`);
          }
      }
  } catch (error) {
      console.error('Erro ao capturar pagamentos:', error);
  }
}


// Função para buscar e atualizar os pedidos pendentes no banco de dados
async function atualizarPedidosPendentes() {
  try {
    // Buscar pedidos pendentes na API do MercadoPago
    const pedidosPendentes = await payment.search();

    // Atualizar ou inserir os pedidos no banco de dados
    for (const pedido of pedidosPendentes.results) {
     // console.log(pedido)

      const filter = { 'order.id': pedido.id };
      const update = { $set: { order: pedido } };
      const options = { upsert: true };
      const options1 = { upsert: false };
      const existingPedido = await Order.findOne({ 'order.id': pedido.id });
      console.log(existingPedido)
      if(existingPedido.order.id != undefined || existingPedido.order.id != null){
        await Order.updateOne(filter, update, options1);
       console.log('atualizado', existingPedido.order.id, existingPedido.id)

      }else if (existingPedido.order.id == undefined){
         let uio = await new Order({
              order:pedido
             });

      console.log('criado', uio.order.id)

      }else{
        console.log('pedido')
      }
    }

    console.log('Pedidos pendentes atualizados com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar pedidos pendentes:', error);
  }
}


// Executar a função periodicamente usando cronjob
/*const jobb = new CronJob(
	'* * * * * *', // cronTime
	atualizarPedidosPendentes, // onTick
	null, // onComplete
	true, // start
  'America/Sao_Paulo' // timeZone
);
*/



//  '0 0 */2 * *' 
const job = new CronJob(
	'0 0 */2 * *', // cronTime
	capture2Days, // onTick
	null, // onComplete
	true, // start
  'America/Sao_Paulo' // timeZone
);


const fs = require('fs');
const { truncate } = require('fs/promises')
//const Cart = require('cestino')
app.use(cors())
app.use(express.static(path.join(__dirname,'public')))
//app.use('./pedido',express.static(path.join(__dirname,'public')))


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.json({limit: '100mb'}))
app.use(express.urlencoded({extended:true,limit: '100mb'}))
app.use(methodOverride('_method'))

/*function redirecionarSeRotaNaoExiste(req, res, next) {
  console.log(req.route)
  // Verifica se a rota original não existe
  if (!req.route) {
      // Redireciona para a rota específica
       res.redirect('/');
  }
  // Continua com o próximo middleware
  next();
}

// Adiciona o middleware para todas as solicitações
app.use(redirecionarSeRotaNaoExiste);*/


app.post('/resetPassword', eAdmin,async (req,res)=>{

  try {
    let allpay = await payment.search()

    let user = req.user
    const { currentPassword, newPassword, confirmNewPassword } = await req.body;
    const userID = await req.user._id;
    let errors = [];
  
    //Check required fields
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      errors.push({ msg: "Por favor preencha os dados corretamente." });
    }
  
    //Check passwords match
    if (newPassword !== confirmNewPassword) {
      errors.push({ msg: "As senhas não conferem." });
    }
  
    //Check password length
    if (newPassword.length < 6 || confirmNewPassword.length < 6) {
      errors.push({ msg: "A senha tem que ter no mínimo 6 caracteres." });
    }
  
    if (errors.length > 0) {
      if(req.user.admin == false){
        res.render("cli/cli", {
          error:errors,
          msg: req.user.name,
          user:user,
          publicKey:mercadoPagoPublicKey,
          payments:allpay
        });
      }else if(req.user.admin == true){
        res.render("admin/admin", {
          error:errors,
          msg: req.user.name,
          user:user,
          publicKey:mercadoPagoPublicKey,
          payments:allpay
        });
      }else{
        console.log('nem admin e nem cliente ?')
      }
      
    } else {
      //VALIDATION PASSED
      //Ensure current password submitted matches
  
      User.findOne({ _id: userID }).then(async (user) => {
        //encrypt newly submitted password
        // async-await syntax
        const isMatch = await bcrypt.compareSync(currentPassword, user.password);
  
        if (isMatch) {
          console.log(user.password);
          //Update password for user with new password
        await  bcrypt.genSalt(10, async (err, salt) =>
           await bcrypt.hash(newPassword, salt, async (err, hash) => {
              if (err) throw err;
              user.password = await hash;
            await  user.save();
            })
          );
     //     req.flash("success_msg", "Password successfully updated!");
          if(req.user.admin == true){
            res.redirect("/admin");
          }else{
            res.redirect('/minha-conta')
          }
        } else {
          //Password does not match
          errors.push({ msg: "A senha atual não confere." });
          res.render("cli/cli", {
            error:errors,
            msg: req.user.name,
            user:user,
            publicKey:mercadoPagoPublicKey,
            payments:allpay
          });
        }
      });
    }
  } catch (error) {
    
  }

});

app.get('/pedido/:id',eAdmin, async (req,res)=>{

try {
  let user = await req.user
 // console.log(user)
  //let tkCard1 =  await customerCard.list({ customerId: user.idmp });

  let {id, _id} = await req.body
  if(!id){
   id = await  req.params.id
   // console.log(_id,'PARAMS')

  } 

  if(user.admin == true){
 // let pedido  = await Order.findOne({'order.id':id})
  //console.log(pedido, _id, await req.body, 'PEDIDO')

  let cards = await customerCard.list({ customerId: user.idmp })
	//console.log(cards, 'CARDS')
  res.render( '/admin/parcial', {pedido:id, user:user, cards:cards, publicKey:mercadoPagoPublicKey})
  }else{
 // let pedido  = await Order.findOne({'order.id':id})
  //console.log(pedido, _id, await req.body, 'PEDIDO')

  let cards = await customerCard.list({ customerId: user.idmp })
	//console.log(cards, 'CARDS')
  res.render( './cli/parcial', {pedido:id, user:user, cards:cards, publicKey:mercadoPagoPublicKey})
  }

} catch (error) {
  console.log(error)
}

})

app.post('/parcial/:id',eAdmin,async (req,res)=>{

  try {
    let user = await req.user
  let {id, transaction_amount, _id, userid, payment_method_id, issuer_id,cart, tokenn} = await req.body
if(!id) {
  id = req.params.id
}
console.log(await req.body, 'HEYAH')

customerCard.list({ customerId: user.idmp })
	.then((result) => {

console.log(result,'RESULT1')
  const body = {
    transaction_amount: parseFloat(transaction_amount),
    token: tokenn,
    description: `Pagamento parcial ${cart}`,
    installments: 1,
    payment_method_id: payment_method_id,
    issuer_id: issuer_id,
    payer: {
      type: 'customer',
      id: result[0].customer_id
  },
  capture:true

};

  payment.create({ body: body }).then(async(result) => {
    
    const updatedUserr = await User.findByIdAndUpdate(
      userid,
      { $set: { "orders.$[elem].order.status_detail": result.status_detail, "orders.$[elem].order.transaction_amount": result.transaction_amount, "orders.$[elem].order.id": result.id, "orders.$[elem].order.date_last_updated":result.date_last_updated  } },
      { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
    );
    console.log(updatedUserr, 'updated capture')

    let orrd = await Order.findById(_id)
 //   let or = Order.findByIdAndUpdate({_id:_id}, {partialData:orrd}, { new: true })
    console.log(orrd, 'ORRRD')
    let nowOrder1 = await Order.findByIdAndUpdate({_id:_id}, {order:result, partial:true}, { new: true })
    console.log(nowOrder1,'PEDIDO ATUALIZADO')
         // res.redirect('/minha-conta')
    
    console.log(result)
  //  atualizarPedidosPendentes()
  }).catch(err=>{
    console.log(err)
  })

payment.cancel({
	id: id,
	requestOptions: {
		idempotencyKey: uuidv4()
	},
}).then(async (da)=>{

 /* const updatedUser = await User.findByIdAndUpdate(
    userid,
    { $set: { "orders.$[elem].order.status_detail": da.status_detail } },
    { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
  );
  console.log(updatedUser, 'updated cancel payment') */
  let nowOrder = Order.findByIdAndUpdate({_id:_id}, da, { new: true })
console.log(nowOrder,'PEDIDO ATUALIZADO, cancel')

  
if(user.admin == true){
  res.redirect('/admin')
}else{
  res.redirect('/minha-conta')
}
//atualizarPedidosPendentes()
}).catch(console.log);


}).catch(err=>{
  console.log(err)
})



 
  } catch (error) {
    console.log(error)
  }
 
  
})

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
      back_url: "https://www.ielabag.cpm.br/admin"
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
    
    let { transaction_amount, payer_email, email, cpf, name, address, city, state, country, cep,phone, method, token,deviceId, password,payer, street_number} = await req.body;
   // let token = await req.body.token
    console.log(token)
    console.log(req.body)
   console.log(method)

   let srt_number = parseInt(street_number)
   const timestamp = Date.now();
   const stringTimestamp = timestamp.toString();
    const dataAtual = new Date();
    // Adicionar 2 dias
    const data2 = new Date(dataAtual);
    const data30 = new Date(dataAtual);

    data2.setDate(dataAtual.getDate() );
    data30.setDate(dataAtual.getDate() + 30);

    // Formatar as datas para o formato ISO 8601
const formatoISO = { timeZone: 'UTC' };
const dataAtualFormatada = data2.toISOString().split('T')[0];
const dataFuturaFormatada = data30.toISOString().split('T')[0];

console.log('Data Atual:', dataAtualFormatada);
console.log('Data Futura (2 dias depois):', dataFuturaFormatada);

let custumerSigg = await customerSig.search()

var usuarioEncontrado = custumerSigg.results.find(function(usuario) {
  return usuario.email === payer.email;
});

const clientDataSig = {
  payer:{
    email:payer.email,
    identification:{
      number:payer.identification.number,
      type:payer.identification.type
    }
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
  description: 'Assinatura IelaBag',
};

const signatureData =   {
  back_url: "https://www.ielabag.com.br",

      reason: 'IelaBag assinatura',
      deviceId:deviceId,
      //external_reference:payer.identification.number,
     // token:token,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        start_date:data2,
        end_date: data30, 
        transaction_amount: parseFloat(transaction_amount),
        currency_id: "BRL"
      },
      payer_email:payer.email,
      card_token_id:token,
     // deviceId:deviceId,
      status: "authorized",
      status_detail:"pending_challenge"
    /*  external_reference:cpf,
      payment_methods_allowed: {
        payment_types: [
          {
            id:method
          }
        ],
      },*/
    }
    console.log(signatureData)
console.log(usuarioEncontrado)
// Verifique se o usuário foi encontrado
if (usuarioEncontrado) {
  console.log('Usuário encontrado:', usuarioEncontrado);
 let cardnn =  await  customerCardSig.create({ customerId: usuarioEncontrado.id, body: {
    token: token,
  } })
  let signature = await sigPreApproval.create({body:signatureData,three_d_secure_mode: 'optional',requestOptions:{idempotencyKey:uuidv4()}})
  let data4 = signature
  res.status(200).send({data4})
  // Agora você pode usar o usuário encontrado conforme necessário, por exemplo:
  // var usuarioVariavel = usuarioEncontrado;
} else {
 
  let sigClient = await customerSig.create( {body:clientDataSig} )
  console.log('Usuário não encontrado, então usuário criado no mp',sigClient);

 

 let cardnew = await  customerCardSig.create({ customerId: sigClient.id, body: {
    token: token,
  } })

  console.log(cardnew)
  let signature = await sigPreApproval.create({body:signatureData, three_d_secure_mode: 'optional', requestOptions:{idempotencyKey:uuidv4()}})
  let data4 = signature
  res.status(200).send({data4})

}
    




 console.log(signature,'3333333')
 const userexist = await User.findOne({$or: [{payer_id: signature.payer_id}]})

if(userexist == null || userexist == undefined || !userexist){
  const usrexist = await User.findOne({$or: [{email: payer.email}]})
    if(usrexist == null || usrexist == undefined || !usrexist){
        let newuser = new User({
          name:name,
          lastname:lastname,
          payer_id: signature.payer_id,
          email:email,
          password:bcrypt.hashSync(password, 8),
          address:address,
          cep:cep,
          cpfcnpj:payer.identification.number,
          city:city,
          country:'Brasil',
          state:'São Paulo',
     
          phone:phone
        })
        await newuser.save()
        console.log('usuario salvo mediante assinatura sem plano associado')
      //  res.redirect('/')
    }else{
      await User.findByIdAndUpdate({_id:usrexist._id},{
        payer_id:signature.payer_id
      },{new:true})

      let newsig = await User.findByIdAndUpdate({_id:usrexist._id},{$push: { signatures: signature }},{new:true})

      console.log('payer_id atualizado', newsig)
   //   res.status(200).send({data4})
    }
  
}
 
 //console.log(signature)
 // res.redirect('/quiz')
   } catch (error) {
   let data4
   data4 = error
   console.log({data4})
   res.send({data4})
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
//atualizarPedidosPendentes()
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


app.post('/cancel_payment/:id',async (req,res)=>{

  try {
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
        { $set: { "orders.$[elem].order": da } },
        { new: true, arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(_id) }] }
      );
      console.log(updatedUser, 'updated cancel payment')
      let nowOrder = Order.findByIdAndUpdate({_id:_id}, {order:da}, { new: true })
    console.log(nowOrder,'PEDIDO ATUALIZADO')
    //atualizarPedidosPendentes()
            res.redirect('/admin')
    
    }).catch(console.log);
  } catch (error) {
    console.log(error)
  }

 
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


app.post('/process_payment',eAdmin, async (req,res)=>{


   try {
    let user = req.user
    const { payer,token,description,transaction_amount,paymentMethodId,installments,issuerId,phone,street_number, cep,address,whatsapp,name,last_name,email,items,cpfcnpj,city,state, birthday, gender,country,bairro , first_name} = await req.body;
    let srt_number = parseInt(street_number)
    console.log(payer,items)
    console.log(req.body)
  // let passnew = await uuidv4()
    const timestamp = Date.now();
    const stringTimestamp = timestamp.toString();
    //let stringSemEspacosEHifens = cep.replace(/[\s-]/g, "");
    const clientData = {
      payer:{
        email:payer.email,
        identification:{
          number:payer.identification.number,
          type:payer.identification.type
        }
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
    console.log(clientData,'CLIENTEDATAAAAAAAAA')
  ///// RESOLVER APARTE DA RENDERIZAÇÃO DOS ITEMS /////////////////////////////////////////////////////////
    const paymentData = {
      transaction_amount: transaction_amount,
      token: token,
      description: description,
      installments: Number(installments),
      payment_method_id: paymentMethodId,
      issuer_id: issuerId,
      payer: payer,
      external_reference:payer.identification.number,
      capture:false,
      metadata:{
        emaill:payer.email,
        cpfcnpj:payer.identification.number,
        typpe:payer.identification.type
      }
      
    };
    console.log(paymentData, 'PAYMENTDATA')
    //  COLOCAR O PEDIDO DENTRO DO ARRAY order E SALVAR NO MODEL ORDER.JS EM CADA CASO ONDE USO O MÉTODO paymente.create SERÁ NECESSÁRIO ATUALIZAR O USUÁRIO COM O PEDIDO OU CRIAR UM NOVO 
    // USUÁRIO  COM NOVO PEDIDO GERADO 
    customer.search({options:{email:payer.email}}).then(async (data)=>{
      console.log(data,data.results.length)
    if(data.results.length == 0)
  {
  
    customer.create({ body: clientData }).then(async (data1)=>{
     // console.log(data)
      console.log('novo cliente')
  let dff =  await  customerCard.create({ customerId: data1.id, body: {token: token,}})

      const userEmail1 = await User.findOne({$or: [{email: payer.email}]})
//console.log(userEmail1, 'USER EMAILLLLLLLLLLLLLLLLL')
if(userEmail1){

  payment
  .create({ body: paymentData })
  .then(async function (data2) {
 /*   res.status(201).json({
      detail: data.status_detail,
      status: data.status,
      id: data.id,
      
    });*/
    let order1 = await new Order({
      order:data2,
      items:items
    })
   await order1.save()
console.log(data2, ' DATA 22222222222222222222')
   let usr = await User.findByIdAndUpdate({_id:userEmail1._id},{$push: { orders: order1 }},{new:true})
   let usr0 = await User.findByIdAndUpdate({_id:userEmail1._id},{idmp:dff.customer_id},{new:true})
  // console.log(usr)
  // console.log(data,' <- pagamento criado' )
  if(user.admin ==true){
    res.status(200).send({data2})
  }else{
    res.status(200).send({data2})
  }
  })
  .catch(function (error) {
    console.log(error);
//    const { errorMessage, errorStatus } = validateError(error);
    res.json({ error });
  });

 
   console.log('USUÁRIO atualizado NO BANCO')
//   res.redirect('/quiz')
//atualizarPedidosPendentes()

}else{
  const newUser1 = new User({
    idmp:data1.id,
    name:data1.first_name,
    lastname:data1.last_name,
    bairro:bairro,
    password:bcrypt.hashSync(passnew, 8),
    external_reference:data1.external_reference,
    email:data1.email,
    country:country,
    address:data1.address.street_name,
    billing_address:{
     city:city,
     address:data1.address.street_name,
     street_number:srt_number,
     state:state,
     country:country,
     bairro:bairro,
     cep:cep
    },
    city:city,
    orders:data1,
    gender:gender,
    birthday:birthday,
    cep:cep,
    state:state,
    cpfcnpj:data1.identification.number,
    phone:phone,
    whatsapp:whatsapp,
    street_number:srt_number
    
    })
   await  newUser1.save()

   let order2 = new Order({
    order:data1,
    items:items
  })
 await order2.save()
 let usrs = await User.findByIdAndUpdate({_id:newUser1._id},{$push: { orders: order2 }},{new:true})
 let usr0 = await User.findByIdAndUpdate({_id:newUser1._id},{idmp:data1.id},{new:true})
 //atualizarPedidosPendentes()
 if(user.admin ==true){
  res.status(200).send({data1})
}else{
  res.status(200).send({data1})
}

}


         
    payment
    .create({ body: paymentData })
    .then(async function (dataPayment) {
   /*   res.status(201).json({
        detail: data.status_detail,
        status: data.status,
        id: data.id,
        
      });*/
      let order1 = new Order({
        order:dataPayment,
        items:items
      })
     await order1.save()
  //   console.log(data,' <- pagamento criado' )
  console.log(dataPayment, 'datapaymeeeeeeeeeent')
  //atualizarPedidosPendentes()
 if(user.admin ==true){
  res.status(200).send({dataPayment})
}else{
  res.status(200).send({dataPayment})
}
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
  .then(async function (data4) {

 //let ccard = await customerCard.get({ customerId: data.results[0].id, cardId : data.results[0].cards[0].config.options.integratorId }).then(console.log).catch(console.log);


    await  customerCard.create({ customerId: data.results[0].id, body: {
      token: token,
    } }).then(console.log).catch(console.log);

 //  console.log(data,' <- pagamento criado  e dados do usuário atualizado' )
  
 const userEmail = await User.findOne({$or: [{email: payer.email}]})
 console.log(data4, 'USER EMAILLLLLLLLLLLLLLLLL')

 let order3 = await new Order({
  order:data4,
  items:items
  
})

await order3.save()

 let usr = await User.findByIdAndUpdate({_id:userEmail._id},{$push: { orders: order3 }},{new:true})
 let usr0 = await User.findByIdAndUpdate({_id:userEmail._id},{idmp:data.results[0].id},{new:true})

// atualizarPedidosPendentes()

 if(user.admin ==true){
  res.status(200).send({data4})
}else{
  res.status(200).send({data4})
}
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
    res.json({error})
   }

})




//app.get('/', (req,res)=>{
  //  res.render('index',{msg:false,error:false})
//})

app.get('/bags',eAdmin,async (req,res)=>{
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
    let payments = await payment.search({options:{criteria:'desc',sort:'date_created'}})
    console.log(payments)
    let signatures = await sigPreApproval.search()
    let totalPaid = await payments.results
    .filter((f) => f.captured === true)
    .reduce((sum, transaction) => {
      const netReceivedAmount = transaction.transaction_details.net_received_amount;
  
      return sum + netReceivedAmount;
    }, 0);
    const formattedTotal = totalPaid.toFixed(2);

    console.log("Total Net Received Amount (Last Two Decimals):", totalPaid / 100); // Convertendo de centavos para reais

    res.render('admin/admin',{user:user,users:users,payments:payments.results,signatures:signatures.results, products:products,orders:orders,total:formattedTotal, msg:false, error:false})
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

app.get('/check',(req,res)=>{
  
  res.render('checkoutAssinatura', {publicKey:mercadoPagoPublicKey})
})

app.get('/termos-e-condicoes',(req,res)=>{
  res.render('termosecondicoes')
})

app.get('/cadastro',(req,res)=>{

  res.render('cadastro',{msg:false, publicKey:mercadoPagoPublicKeySignature})
})
async function ff(){
  try {
    let allPayments = await payment.search({options:{criteria:'asc',sort:'date_created'}})
    allPayments.results.forEach(p=>{
      if(p.payer.email == 'ada@upsoft.com'){
        console.log(p)
      }
    })
    console.log(allPayments.results)
  } catch (error) {
    console.log(error)
  }

}
//ff()
// GERAR UM PEDIDO, UMA ASSINATURA E PESQUISA DE CLIENTES USANDO E-MAIL TESTE RAFA@RAFA.COM SENHA 123 PRA RENDEZIRAR OS DADOS CORRETAMENTE DINAMICAMENTE DE ACORDO DE COMO ESTA VINDO NO CONSOLE.LOG QUE AINDA VOU FAZER
app.get('/minha-conta',eAdmin,async(req,res)=>{
  try {
    if(req.user.admin == false){
      let user = await req.user
console.log(user.idmp)
   /*   if(user.idmp == '' || user.idmp == undefined || user.idmp == null){
        let nuser =await customer.create({body:{email:user.email}})
        let nj = await User.findOneAndUpdate({_id:user._id},{idmp:nuser.id},{new:true})  
      }*/

 //  let tkCard =  await customerCard.list({ customerId: user.idmp });
let allPayments = await payment.search()
let ppp =  allPayments.results.find(function(payment) {
  return payment.status_detail !== 'cc_rejected_card_disabled';
});
//console.log(allPayments)
 //*  let paymentsUser = await  customer.get({customerId:user.idmp})
//console.log(paymentsUser)
   //   let cli =await customer.get({customerId:user.idmp})
     // let payments = await payment.search({})
      //let signatures = await preApproval.search({})
  //  console.log(signatures,'SIGNATURES')
  // const sigs = await signatures.results.filter( sig => sig.external_reference == user.cpf);
  //console.log(sigs)
      res.render('cli/cli',{user:user, msg:false,payments:[ppp], publicKey:mercadoPagoPublicKeySignature  , error:false})
    }else{
      res.redirect('/')
    }
   
  } catch (error) {
    console.log(error)
  }
 
})

app.get('/obrigado', (req,res)=>{
  let usr = req.user
  res.render('congratulations',{user:usr})
})

app.post('/sendEmail', express.urlencoded({extended:true}),express.json(),async (req,res)=>{

  try {

      
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: 'teste@ielabag.com.br', // sender address
    to: `teste@ielabag.com.br`, // list of receivers
    subject: `${await req.body.assunto}`, // Subject line
   
    html: `
    <b>Nome:</b>${await req.body.nome}\n
    <b>Telefone:</b>${await req.body.telefone}\n
    <b>Email:</b>${await req.body.email}\n
    <b>Mensagem:</b>${await req.body.message}\n
    `, 
   /* dkim:{
      domainName:'ielabag.com.br',
      privateKey:'"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAn4ZfHUOe2JbR4YqpFJizQ2nn1krqJMIKB2Sy4K3Qy5u8EN5CNvdCi5YhZou9i5jNv0KEtANDb0gFeydiX1axLxUHVhBaWZBpxDjPHHF/Ntk3vG+arPH7aiz4+7EVwMgJSdMpj6lsVtk38zn7Rsnf7ixb/x3WygaBsNqcvzBOQQIDAQAB"',
      keySelector:'titan2._domainkey.ielabag.com.br.'
    } */
  }).then(async ()=>{
      const info = await transporter.sendMail({
          from: 'teste@ielabag.com.br', // sender address
          to: `${await req.body.email}, teste@ielabag.com.br`, // list of receivers
          subject: `${await req.body.assunto}`, // Subject line
         
          html: `
        
          <!DOCTYPE html>
          <html lang="en">
          
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title> Congratulations Page Design By WebJourney - Html Template </title>
              <!-- FontAwesome -->
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
              <!-- Latest compiled and minified CSS -->
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
              <style>
              .congratulation-wrapper {
                  max-width: 550px;
                  margin-inline: auto;
                  -webkit-box-shadow: 0 0 20px #f3f3f3;
                  box-shadow: 0 0 20px #f3f3f3;
                  padding: 30px 20px;
                  background-color: #fff;
                  border-radius: 10px;
              }
          
              .congratulation-contents.center-text .congratulation-contents-icon {
                  margin-inline: auto;
              }
              .congratulation-contents-icon {
                  display: -webkit-box;
                  display: -ms-flexbox;
                  display: flex;
                  -webkit-box-align: center;
                  -ms-flex-align: center;
                  align-items: center;
                  -webkit-box-pack: center;
                  -ms-flex-pack: center;
                  justify-content: center;
                  height: 100px;
                  width: 100px;
                  background-color: pink;
                  color: #fff;
                  font-size: 50px;
                  border-radius: 50%;
                  margin-bottom: 30px;
              }
              .congratulation-contents-title {
                  font-size: 32px;
                  line-height: 36px;
                  margin: -6px 0 0;
              }
              .congratulation-contents-para {
                  font-size: 16px;
                  line-height: 24px;
                  margin-top: 15px;
              }
              .btn-wrapper {
                  display: block;
              }
              .cmn-btn.btn-bg-1 {
                  background: pink;
                  color: #fff;
                  border: 2px solid transparent;
                  border-radius:3px;
                  text-decoration: none;
                  padding:5px;
              }
              </style>
          </head>
          
          <body>
              <!-- Congratulations area start -->
              <div class="congratulation-area text-center mt-5">
                  <div class="container">
                      <div class="congratulation-wrapper">
                          <div class="congratulation-contents center-text">
                              <div class="congratulation-contents-icon">
                                  <i class="fas fa-check"></i>
                              </div>
                              <h4 class="congratulation-contents-title"> Obrigado pelo contsato ${await req.body.nome}! </h4>
                              <p class="congratulation-contents-para"> Aguarde o contato do suporte ou administração. </p>
                              <div class="btn-wrapper mt-4">
                                  <a href="javascript:void(0)" class="cmn-btn btn-bg-1"> Voltar para o site </a>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              <!-- Congratulations area end -->
          
          <!-- Latest compiled JavaScript -->
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
          </body>
          </html>      
 

          `, 
        })
  }).catch(err=>{
    console.log(err)
  })

  console.log("Message sent: %s", info.messageId);
    

      res.render('index',{error:false,msg:'E-mail enviado aguarde o contato do suporte ou administração'})
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
        cpfcnpj:cpfcnpj,
        city:city,
        country:country,
        state:state,
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
    
    let {name,email,address,cep,city,state,password,bairro,country,phone,lastname,birthday, profissao, civil_state, social_network, onde_conheceu, ligacao, oqbusca, favoinfluencers, tamanho, altura, peso, roupas_soltas, gosta_acessorios, interesse, manter_estilo, comquemmora, portaria, tempet, detalhe_especifico, fotos} = await req.body
    console.log(await req.body)
    const userExists = await User.findOne({$or: [{email: email}]})
    if (userExists == null || userExists == undefined || !userExists) {
      let cpf = ''
      let street_number = '0000'
   
     let srt_number = parseInt(street_number)
  
     const timestamp = Date.now();
     const stringTimestamp = timestamp.toString();
     let stringSemEspacosEHifens = cep.replace(/[\s-]/g, "");
    
  
     const body = {
     //  email: email,
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
     
   //let cust = await customer.create({ body: body })
   
   //console.log(cust, 'CUSTOMER')
   let user = new User({
    name:name,
   // idmp : cust.id,
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
    birthday:birthday,
    profissao:profissao,
    civil_state:civil_state,
    social_network:social_network,
    onde_conheceu:onde_conheceu,
    ligacao:ligacao,
    oqbusca:oqbusca,
    favoinfluencers:favoinfluencers,
    tamanho:tamanho,
    altura:altura,
    peso:peso,
    roupas_soltas:roupas_soltas,
    gosta_acessorios:gosta_acessorios,
    interesse:interesse,
    manter_estilo:manter_estilo,
    comquemmora:comquemmora,
    portaria:portaria,
    tempet:tempet,
    detalhe_especifico:detalhe_especifico,
    fotos:fotos
  //  external_reference:cust.external_reference
  })
 await user.save()
 console.log('usuário salvo')
     res.redirect('/check')
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

app.post('/iela/quiz',eAdmin, async (req,res)=>{

  try {
    
    let {birthday, profissao, civil_state, social_network, onde_conheceu, ligacao, oqbusca, favoinfluencers, tamanho, altura, peso, roupas_soltas, gosta_acessorios, interesse, manter_estilo, comquemmora, portaria, tempet, detalhe_especifico, fotos,email} = await req.body
    console.log(await req.body)
    const userExists = await User.findOne({$or: [{email: email}]})
    console.log(userExists)
    if (userExists != null || userExists != undefined || userExists) {
    
   let userr = await  User.findByIdAndUpdate({_id:userExists._id},{
  
   // idmp : cust.id,
  
   
    birthday:birthday,
    profissao:profissao,
    civil_state:civil_state,
    social_network:social_network,
    onde_conheceu:onde_conheceu,
    ligacao:ligacao,
    oqbusca:oqbusca,
    favoinfluencers:favoinfluencers,
    tamanho:tamanho,
    altura:altura,
    peso:peso,
    roupas_soltas:roupas_soltas,
    gosta_acessorios:gosta_acessorios,
    interesse:interesse,
    manter_estilo:manter_estilo,
    comquemmora:comquemmora,
    portaria:portaria,
    tempet:tempet,
    detalhe_especifico:detalhe_especifico,
    fotos:fotos
  //  external_reference:cust.external_reference
  },{new:true})
// await user.save()
 console.log('usuário e o quiz atualizado')
     res.redirect('/minha-conta')
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
     res.status(403).send('E-mail não existe')
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