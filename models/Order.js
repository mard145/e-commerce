const mongoose = require('mongoose')

const Order = new mongoose.Schema({
     rank:Number,
    // payer:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
     order:{ type: mongoose.Schema.Types.Mixed},
     items:{ type: mongoose.Schema.Types.Mixed},
     token:String,
     createdAt: {
        type: Date,
        default: Date.now, // Esta é a data de criação
      },
    });

const OrderModel = mongoose.model('Pedido', Order);

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

