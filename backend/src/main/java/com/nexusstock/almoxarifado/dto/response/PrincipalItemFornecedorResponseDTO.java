package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PrincipalItemFornecedorResponseDTO {

    private Long id;
    private String nome;
    private String sku;
    private BigDecimal quantidadeAtual;
    private BigDecimal valorEmEstoque;
}