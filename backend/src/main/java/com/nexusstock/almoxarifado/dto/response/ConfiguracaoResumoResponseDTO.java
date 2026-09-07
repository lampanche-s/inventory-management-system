package com.nexusstock.almoxarifado.dto.response;

public record ConfiguracaoResumoResponseDTO(
        long itens,
        long movimentacoes,
        long fornecedores,
        long usuarios,
        long solicitacoes,
        long categorias,
        long totalRegistrosOperacionais
) {
}