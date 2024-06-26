// Função para escapar valores nulos
function escapeIfNotNull(value) {
  if (value !== null) {
    if (!isNaN(value)) {
      if (Number.isInteger(value)) {
        return value.toString(); // Converte números inteiros diretamente para string
      } else {
        return parseFloat(value).toFixed(3); // Altere a precisão conforme necessário
      }
    }
    return `'${value}'`;
  }
  return "NULL";
}

module.exports = {
  escapeIfNotNull,
};
