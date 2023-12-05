const mongoose = require('mongoose')

const Order = new mongoose.Schema({
     rank:Number,
     payer:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
     order:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
     total:Number, //transactions_amount
     status:String,
     status_detail:String,
     currency:String,
     description:String,
     authorization_code:String,
     taxes_amount:Number,
     shipping_amount:Number,
     collector_id:Number,
     total_refunded:Number,  //transactions_refunded_amount
     cupum_amount:Number,
     installments:Number,
     transaction_details:{type:mongoose.Schema.Types.Mixed},
     fee_details:{type: mongoose.Schema.Types.Mixed},
     captured:Boolean,
     card:{type:mongoose.Schema.Types.Mixed},
     refunds:{type:mongoose.Schema.Types.Mixed},
     processing_mode:String,
     point_of_interaction:{type:mongoose.Schema.Types.Mixed},
     accounts_info:{type:mongoose.Schema.Types.Mixed},
     createdAt: {
        type: Date,
        default: Date.now, // Esta é a data de criação
      },
    });

const OrderModel = mongoose.model('Order', Order);

// Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await OrderModel.find({})
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

module.exports = OrderModel

