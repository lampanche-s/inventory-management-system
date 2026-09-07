package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SolicitacaoMovimentacaoLoteResponseDTO {

    private String codigoPedido;
    private Integer totalItens;
    private List<SolicitacaoMovimentacaoResponseDTO> solicitacoes;
}
