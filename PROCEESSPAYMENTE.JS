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
let data = await customer.search({options:{email:payer.email}})

  console.log(data)
if(data.results == null || data.results == undefined || payer.email == '' || payer.email == null || payer.email == undefined)
{

let data1 = await customer.create({
body: {
email:payer.email,
first_name:first_name,
last_name:last_name,
phone:{
area_code:'55',
number:phone
},
default_address: 'Home',
address:{
zip_code:cep,
street_name:street_number,
street_number:srt_number
},
date_registered:stringTimestamp,
description:description,
identification:{
type:payer.identification.type,
number:payer.identification.number
}
} 
})

let ps = data1.email.split('@')
let pss = ps[0]


 // console.log(data)
  console.log('novo cliente',data1)
let dff =  await  customerCard.create({ customerId: data1.id, body: {token: token}})

  const userEmail1 = await User.findOne({$or: [{email: payer.email}]})
//console.log(userEmail1, 'USER EMAILLLLLLLLLLLLLLLLL')
if(userEmail1){

let data2 = await payment.create({ body: paymentData })

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




console.log('USUÁRIO atualizado NO BANCO')
//   res.redirect('/quiz')
//atualizarPedidosPendentes()

}else{
const newUser1 = new User({
idmp:data1.id,
name:data1.first_name,
lastname:data1.last_name,
bairro:bairro,
password:bcrypt.hashSync(payer.email.substr(0, payer.email.indexOf("@")), 8),
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
/*if(user.admin ==true){
res.status(200).send({data1})
}else{
res.status(200).send({data1})
}
*/


// send mail with defined transport object
const info = await transporter.sendMail({
from: 'teste@ielabag.com.br', // sender address
to: `teste@ielabag.com.br`, // list of receivers
subject: `Novo pedido e confirmação de um novo cadastro`, // Subject line

html: `
<b>Nome:</b>${data1.first_name} ${data1.last_name}\n
<b>Telefone:</b>${phone}\n
<b>Email:</b>${data1.email}\n
<b>Mensagem:</b> Novo usuário cadastrado\n
`, 
/* dkim:{
  domainName:'ielabag.com.br',
  privateKey:'"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAn4ZfHUOe2JbR4YqpFJizQ2nn1krqJMIKB2Sy4K3Qy5u8EN5CNvdCi5YhZou9i5jNv0KEtANDb0gFeydiX1axLxUHVhBaWZBpxDjPHHF/Ntk3vG+arPH7aiz4+7EVwMgJSdMpj6lsVtk38zn7Rsnf7ixb/x3WygaBsNqcvzBOQQIDAQAB"',
  keySelector:'titan2._domainkey.ielabag.com.br.'
} */
}).then(async ()=>{
  const info1 = await transporter.sendMail({
      from: 'teste@ielabag.com.br', // sender address
      to: `${data1.email}, teste@ielabag.com.br`, // list of receivers
      subject: `Dados do pedido e confirmação do cadastro devido a percepção de um novo e-mail`, // Subject line
     
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
          @mixin size($point) {
            @if $point == lg-device {
              @media (min-width: 1024px) and (max-width: 1600px) {
                @content;
              }
            } @else if $point == md-device {
              @media (min-width: 768px) and (max-width: 1023px) {
                @content;
              }
            } @else if $point == sm-device {
              @media (max-width: 767px) {
                @content;
              }
            }
          }
          @font-face {
            font-family: "Material Icons Outlined";
            font-style: normal;
            font-weight: 400;
            src: url(https://fonts.gstatic.com/s/materialiconsoutlined/v54/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUce.woff2)
              format("woff2");
          }
          
          .material-icons-outlined {
            font-family: "Material Icons Outlined";
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
          }
          @import url("https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap");
          
          * {
            box-sizing: border-box;
            ::before,
            ::after {
              box-sizing: border-box;
            }
          }
          body {
            font-family: "Jost", sans-serif;
            font-size: 14px;
            font-weight: 300;
            color: #34302d;
            padding: 0px;
            margin: 0px;
            box-sizing: border-box;
            background: linear-gradient(45deg, #ab5d6d, #913e4e),
              linear-gradient(45deg, #b26172, #ae5545);
            background-size: cover;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            min-width: 360px;
            @include size(sm-device) {
              align-items: baseline;
            }
            @include size(md-device) {
              align-items: baseline;
            }
          }
          
          .cart_wrapper {
            max-width: 1200px;
            width: 100%;
            max-height: 800px;
            display: flex;
            flex-wrap: wrap;
            background-color: white;
            box-shadow: 0 6px 32px rgba(0, 0, 0, 0.4);
            margin: 30px;
            overflow: hidden;
            @include size(md-device) {
              max-height: 1000px;
            }
            @include size(sm-device) {
              max-height: unset;
              max-width: 100%;
              margin: 15px;
            }
          
            // cart_lists
            .cart_lists {
              background-color: #ecf0f1;
              padding: 30px;
              width: calc(100% - 330px);
              flex: 0 0 calc(100% - 330px);
              @include size(md-device) {
                width: 100%;
                flex: 0 0 100%;
              }
              @include size(sm-device) {
                width: 100%;
                flex: 0 0 100%;
                padding: 20px;
              }
              .cart_title {
                display: flex;
                align-items: center;
                font-size: 22px;
                font-weight: 400;
                height: 50px;
          
                span {
                  margin-right: 8px;
                  padding-right: 8px;
                  line-height: 18px;
                  border-right: solid 2px #ddd;
                }
              }
              .cart_list_wrap {
                padding: 25px 40px;
                overflow: hidden;
                @include size(sm-device) {
                  padding-left: 0px;
                  padding-right: 0px;
                }
                .cart_responsive {
                  overflow-x: auto;
                  overflow-y: auto;
                  max-height: 380px;
                  @include size(md-device) {
                    max-height: 380px;
                  }
                  @include size(sm-device) {
                    // max-height: 800px;
                  }
                  &::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                  }
                  &::-webkit-scrollbar-thumb {
                    background-color: #ddd;
                  }
                  &::-webkit-scrollbar-track {
                    background-color: #eee;
                  }
          
                  .tr_item {
                    display: grid;
                    grid-template-columns: 80px 3fr 1fr 1fr 120px 50px;
                    margin-bottom: 15px;
                    transition: all 0.3s linear;
                    position: relative;
                    transform: scale(0.995);
                    @for $i from 1 through 50 {
                      &:nth-last-child(#{$i}) {
                        animation: listshow linear;
                        animation-duration: 1000ms - 180ms * $i;
                        transform-origin: top;
                        @keyframes listshow {
                          0% {
                            opacity: 0;
                            transform: scaleY(0);
                            transform-origin: top;
                          }
                          50% {
                            transform: scaleY(0);
                          }
                          100% {
                            opacity: 1;
                            transform: scaleY(1);
                          }
                        }
                      }
                    }
          
                    @include size(sm-device) {
                      grid-template-columns: 80px auto 80px auto;
                    }
          
                    &::after {
                      content: "";
                      position: absolute;
                      left: 0px;
                      bottom: 0px;
                      height: 2px;
                      background-color: #d9d9d9;
                      width: 0px;
                      margin: auto;
                    }
                    @keyframes line {
                      0% {
                        width: 0px;
                      }
                      100% {
                        width: calc(100% - 50px);
                      }
                    }
                    &:hover {
                      transform: scale(1);
                      &::after {
                        width: calc(100% - 50px);
                        animation: line 0.5s linear;
                      }
                    }
                    .td_item {
                      padding: 10px;
                      background-color: #e5e9ea;
                      display: flex;
                      flex-direction: column;
                      align-items: baseline;
                      justify-content: center;
                      font-weight: 400;
                      font-size: 16px;
                      color: #666;
                      transition: all 0.3s linear;
                      @include size(sm-device) {
                        padding: 5px;
                      }
                      &.item_img {
                        @include size(sm-device) {
                          grid-row-start: 1;
                          grid-row-end: 3;
                        }
                        img {
                          height: 60px;
                          width: 60px;
                          overflow: hidden;
                          border-radius: 100px;
                          max-width: 100%;
                        }
                      }
                      &.item_name {
                        @include size(sm-device) {
                          grid-row-start: 1;
                          grid-row-end: 2;
                          grid-column-start: 2;
                          grid-column-end: 5;
                          width: 100%;
                        }
                        .main {
                          font-size: 16px;
                          font-weight: 400;
                          color: #666;
                        }
                        .sub {
                          font-size: 12px;
                          color: #666;
                        }
                      }
                      &.item_qty {
                        select {
                          height: 30px;
                          background-color: transparent;
                          border-color: transparent;
                          border-width: 2px;
                          outline: none;
                          color: #666;
                          font-weight: 400;
                          font-size: 16px;
                          transition: all 0.3s linear;
                          &:focus {
                            background-color: #e2e2e2;
                          }
                          &:hover {
                            border-bottom: solid 2px #e2e2e2;
                          }
                        }
                      }
                      &.item_price {
                        label {
                          margin: auto;
                        }
                      }
          
                      &.item_remove {
                        background-color: transparent;
                        @include size(sm-device) {
                          position: absolute;
                          right: 0px;
                          top: 0px;
                        }
                        span {
                          font-size: 18px;
                          opacity: 0.6;
                          padding: 5px;
                          cursor: pointer;
                          transition: all 0.2s linear;
                          &:hover {
                            opacity: 1;
                            transform: scale(1.1);
                          }
                        }
                      }
                    }
                  }
                }
                .footer {
                  display: flex;
                  flex-wrap: wrap;
                  align-items: center;
                  padding: 20px 5px;
                  .back_cart {
                    width: 50%;
                    flex: 0 0 50%;
                    a {
                      color: #303030;
                      vertical-align: middle;
                      font-size: 14px;
                      font-weight: 400;
                      text-decoration: none;
                      transition: all 0.3s;
                      &:hover {
                        color: #111;
                        span {
                          animation: arrow 1.5s infinite ease;
                        }
                      }
                      span {
                        vertical-align: sub;
                        font-size: 18px;
                        margin-right: 5px;
                      }
                      @keyframes arrow {
                        0% {
                          transform: translateX(0px);
                        }
                        25% {
                          transform: translateX(-2px);
                        }
                        75% {
                          transform: translateX(2px);
                        }
                        100% {
                          transform: translateX(0px);
                        }
                      }
                    }
                  }
                  .subtotal {
                    width: calc(50% - 80px);
                    flex: 0 0 calc(50% - 50px);
                    text-align: right;
                    font-size: 16px;
                    @include size(sm-device) {
                      width: 50%;
                      flex: 0 0 50%;
                    }
                    label {
                      margin-right: 15px;
                    }
                  }
                }
              }
            }
          
            // cart_details
            .cart_details {
              background: linear-gradient(45deg, #303030, #4b4643);
              padding: 30px 40px;
              width: 330px;
              flex: 0 0 330px;
              box-shadow: -8px 0px 32px rgba(0, 0, 0, 0.36);
              position: relative;
              @include size(md-device) {
                width: 100%;
                flex: 0 0 100%;
              }
              @include size(sm-device) {
                width: 100%;
                flex: 0 0 100%;
                padding: 30px;
              }
              .cart_title {
                font-size: 22px;
                color: #f1c40f;
                font-weight: 400;
                margin-bottom: 60px;
                @include size(md-device) {
                  margin-bottom: 40px;
                }
              }
          
              .form_row {
                display: flex;
                flex-wrap: wrap;
                @include size(md-device) {
                  margin-bottom: 40px;
                }
                .form_group {
                  display: flex;
                  flex-wrap: wrap;
                  margin: 0px;
                  margin-bottom: 35px;
                  padding: 0px 10px;
                  width: 100%;
                  @include size(md-device) {
                    &:nth-child(2) {
                      width: 50%;
                    }
                    &:nth-child(3) {
                      width: 30% !important;
                      flex: 0 0 30% !important;
                    }
                    &:nth-child(4) {
                      width: 20% !important;
                      flex: 0 0 20% !important;
                    }
                  }
                  &.w_75 {
                    width: 65%;
                    flex: 0 0 65%;
                  }
                  &.w_25 {
                    width: 35%;
                    flex: 0 0 35%;
                  }
                  .input_label {
                    color: #f3f3f3;
                    font-weight: 300;
                    font-size: 16pxx;
                    width: 100%;
                    flex: 0 0 100%;
                    letter-spacing: 0.5px;
                  }
                  .input {
                    width: 100%;
                    flex: 0 0 100%;
                    background-color: transparent;
                    border: none;
                    outline: none;
                    color: #eee;
                    font-size: 16px;
                    font-weight: 400;
                    letter-spacing: 0.5px;
                    border-bottom: solid 2px #999;
                    height: 32px;
                    transition: all 0.3s linear;
                    &::placeholder {
                      font-size: 16px;
                      font-weight: 400;
                      color: rgba(255, 255, 255, 0.1);
                      transition: all 0.2s linear;
                    }
                    &:focus {
                      &::placeholder {
                        opacity: 0;
                      }
                    }
                  }
                  &.cart_type {
                    justify-content: space-between;
                    @include size(md-device) {
                      justify-content: left;
                    }
                    .type {
                      width: calc(100% / 3 - 15px);
                      padding: 0px;
                      margin-top: 5px;
                      cursor: pointer;
                      transition: all 0.3s linear;
                      @include size(md-device) {
                        width: 75px;
                      }
                      &:hover {
                        svg {
                          fill: #bbb;
                        }
                      }
                      svg {
                        width: 42px;
                        fill: #7f7a76;
                        transition: all 0.3s linear;
                      }
                      &.paypal {
                        svg {
                          width: 62px;
                          margin-top: -10px;
                        }
                      }
                    }
                    input {
                      display: none;
                      &#master {
                        &:checked ~ {
                          .master {
                            svg {
                              fill: #f4f4f4;
                            }
                          }
                        }
                      }
                      &#visa {
                        &:checked ~ {
                          .visa {
                            svg {
                              fill: #f4f4f4;
                            }
                          }
                        }
                      }
                      &#paypal {
                        &:checked ~ {
                          .paypal {
                            svg {
                              fill: #f4f4f4;
                            }
                          }
                        }
                      }
                    }
                  }
                }
          
                .btn {
                  width: calc(100%);
                  height: 65px;
                  margin: 0px -40px;
                  background-color: #f1c40f;
                  border: none;
                  color: #333;
                  font-size: 15px;
                  font-weight: 400;
                  position: absolute;
                  bottom: 0px;
                  transition: all 0.3s linear;
                  @include size(sm-device) {
                    position: static;
                    margin: auto;
                  }
                  &:hover {
                    background-color: darken($color: #f1c40f, $amount: 4);
                  }
                  &:active {
                    box-shadow: inset 0 0 28px 0px rgba(0, 0, 0, 0.3);
                  }
                }
              }
            }
          }
          
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
                          <h4 class="congratulation-contents-title"> Obrigado pelo contsato ${data1.first_name} ${data1.last_name}! </h4>
                          <p class="congratulation-contents-para"> 
                          <h2> Dados de acesso </h2>
                          login: ${data1.email} <br>
                          senha: ${pss} <br>

                          <section class="cart_wrapper">
<div class="cart_lists">
<div class="cart_title">
  <span class="material-icons-outlined">local_mall</span>
  Your Shopping Cart
</div>

<div class="cart_list_wrap">
  <div class="cart_responsive">


  
    <div class="tr_item">
      <div class="td_item item_img">
        <img src="https://i.ibb.co/vQHXcYb/b68912b3426baa0b1f4c410a02174879.jpg" />
      </div>
      <div class="td_item item_name">
        <label class="main">Denim Jacket</label>
        <label class="sub">Ref. 007891987</label>
      </div>
      <div class="td_item item_color">
        <label>Blue</label>
      </div>
      <div class="td_item item_qty">
        <select>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="more">More</option>
        </select>
      </div>
      <div class="td_item item_price">
        <label>$ 260.00</label>
      </div>
      <div class="td_item item_remove">
        <span class="material-icons-outlined">close</span>
      </div>
    </div>

    

    


  </div>
  <div class="footer">
    <div class="back_cart">
      <a href="#back">
        <span class="material-icons-outlined">west</span>
        Back to Shop
      </a>
    </div>
    <div class="subtotal">
      <label>Subtotal: </label>
      <strong>$2451.00</strong>
    </div>
  </div>
</div>
</div>


</section>
<script>
function card_format(value) {
var v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
var matches = v.match(/\d{4,16}/g);
var match = (matches && matches[0]) || "";
var parts = [];
for (i = 0, len = match.length; i < len; i += 4) {
parts.push(match.substring(i, i + 4));
}
if (parts.length) {
return parts.join(" ");
} else {
return value;
}
}

document.getElementById("card_number").oninput = function () {
this.value = card_format(this.value);
};

function ex_format(value) {
var v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
var matches = v.match(/\d{2,4}/g);
var match = (matches && matches[0]) || "";
var parts = [];
for (i = 0, len = match.length; i < len; i += 2) {
parts.push(match.substring(i, i + 2));
}
if (parts.length) {
return parts.join(" / ");
} else {
return value;
}
}

document.getElementById("card_date").oninput = function () {
this.value = ex_format(this.value);
};

function checkDigit(event) {
var code = event.which ? event.which : event.keyCode;

if ((code < 48 || code > 57) && code > 31) {
return false;
}

return true;
}

</script>

                           </p>
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

    console.log("Message sent: %s", info1.messageId);

}).catch(err=>{
console.log(err)
})

}


     
let dataPayment = await payment.create({ body: paymentData })
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
let data4 = dataPayment
res.status(200).send({data4})
}else{
let data4 = dataPayment

res.status(200).send({data4})
}



}else{


let data4  =  await payment.create({ body: paymentData })

//let ccard = await customerCard.get({ customerId: data.results[0].id, cardId : data.results[0].cards[0].config.options.integratorId }).then(console.log).catch(console.log);


let ncardCreated = await customerCard.create({ customerId: data.results[0].id, body: {token: token}})

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

}  
// console.log(data)




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


let user = req.user
    
    let { transaction_amount, payer_email, email, cpf, name, address, city, state, country, cep,phone, method, token,deviceId, password,payer, street_number, last_name,first_name} = await req.body;
   // let token = await req.body.token
    console.log(token)
    console.log(req.body)
   console.log(method)
   let stringSemHifens = cep.replace(/-/g, "");

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
var usuarioEncontrado
console.log('Data Atual:', dataAtualFormatada);
console.log('Data Futura (2 dias depois):', dataFuturaFormatada);

let custumerSigg = await customerSig.search()
console.log(custumerSigg)
if(custumerSigg.results != null){
  usuarioEncontrado = await custumerSigg.results.find(function(usuario) {
    return usuario.email === payer.email;
  });
  
}

const clientDataSig = {
  email:payer.email,
  first_name:first_name,
  last_name:last_name,
  phone:{
    area_code:'55',
    number:phone
  },
  identification:{
type:payer.identification.type,
number:payer.identification.number
  },
// default_address: 'Home',address method
  address: {
    id: address,
    zip_code: stringSemHifens,
    street_name: address,
    street_number: srt_number,
    city: {
      name:city
    }, 
   
  },
 // date_registered: stringTimestamp,
  description: 'Assinatura IelaBag',
};
console.log(usuarioEncontrado)
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
    //  status_detail:"pending_challenge"
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
  let signature = await sigPreApproval.create({body:signatureData,three_d_secure_mode: 'optional'})
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
  let signature = await sigPreApproval.create({body:signatureData, three_d_secure_mode: 'optional'})
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
  