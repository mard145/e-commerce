const PrimeiraColecao = require('./Order');
const SegundaColecao = require('./User');

// Consultar documentos da primeira coleção
PrimeiraColecao.find({ _id: seuIdAqui }).then(docs => {
  // Iterar sobre os documentos
  docs.forEach(doc => {
    // Extrair dados relevantes que você deseja atualizar
    const dadosParaAtualizar = {
      campo1: doc.campo1,
      campo2: doc.campo2,
      // Adicione mais campos conforme necessário
    };

    // Atualizar documentos na segunda coleção com base nos dados extraídos
    SegundaColecao.updateMany({ id: doc.id }, { $set: dadosParaAtualizar })
      .then(result => {
        console.log(`Documentos atualizados na segunda coleção: ${result.nModified}`);
      })
      .catch(error => {
        console.error('Erro ao atualizar documentos na segunda coleção:', error);
      });
  });
})
.catch(error => {
  console.error('Erro ao consultar documentos da primeira coleção:', error);
});