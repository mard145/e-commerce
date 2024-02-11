const mongoose = require('mongoose')

const user = new mongoose.Schema({
     admin:{type:Boolean, default:false},
     rank:Number,
     idmp:String,
     name:String,
     token:String,
     lastname:String,
     nickname:String,
     photo:String,
     bairro:String,
     password:String,
     external_reference:String,
     email:String,
     country:String,
     address:String,
     payer_id:String,
     billing_address:{
      city:String,
      address:String,
      street_number:Number,
      state:String,
      country:String,
      bairro:String,
      cep:String
     },
     profissao:String,
     civil_state:String,
     city:String,
     gender:String,
     birthday:String,
     social_network:String,
     onde_conheceu:String,
     ligacao:String,
     oqbusca:String,
     favoinfluencers:String,
     tamanho:String,
     altura:String,
     peso:String,
     roupas_soltas:String,
     gosta_acessorios:String,
     interesse:String,
     manter_estilo:String,
     comquemmora:String,
     portaria:String,
     tempet:String,
     detalhe_especifico:String,
     fotos:{type:mongoose.Schema.Types.Mixed},
     cep:String,
     state:String,
     cpfcnpj:String,
     phone:String,
     whatsapp:String,
     street_number:Number,
     orders:[{ type: mongoose.Schema.Types.Mixed, ref: 'Order' }],
     signatures:[{ type: mongoose.Schema.Types.Mixed, ref: 'Signature' }],
     createdAt: {
        type: Date,
        default: Date.now, // Esta é a data de criação
      },
    });

const UserModel = mongoose.model('user', user);

// Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await UserModel.find({})
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
}
attSortRank()

module.exports = UserModel

