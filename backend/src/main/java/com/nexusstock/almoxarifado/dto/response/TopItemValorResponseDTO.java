package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class TopItemValorResponseDTO {

    private Long itemId;
    private String nome;
    private String sku;
    private BigDecimal quantidadeAtual;
    private BigDecimal precoMedio;
    private BigDecimal valorEmEstoque;
    private BigDecimal percentualSobreTotal;
}