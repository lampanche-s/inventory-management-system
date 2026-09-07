package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.StatusEstoque;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ItemResumoResponseDTO {

    private Long id;
    private String nome;
    private String sku;
    private BigDecimal quantidadeAtual;
    private BigDecimal estoqueMinimo;
    private StatusEstoque statusEstoque;
    private String statusEstoqueLabel;
    private String fornecedorNome;
    private String localizacaoFormatada;
}