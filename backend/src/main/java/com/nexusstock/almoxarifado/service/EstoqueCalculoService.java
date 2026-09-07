package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.enums.StatusEstoque;

import java.math.BigDecimal;

public interface EstoqueCalculoService {

    StatusEstoque calcularStatus(BigDecimal quantidadeAtual, BigDecimal estoqueMinimo);

    BigDecimal calcularValorEmEstoque(BigDecimal quantidadeAtual, BigDecimal precoMedio);
}