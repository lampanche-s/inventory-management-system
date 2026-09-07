package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CurvaAbcResponseDTO {

    private Long itemId;
    private String nome;
    private String sku;
    private BigDecimal valorEmEstoque;
    private BigDecimal percentual;
    private BigDecimal percentualAcumulado;
    private String classe;
}