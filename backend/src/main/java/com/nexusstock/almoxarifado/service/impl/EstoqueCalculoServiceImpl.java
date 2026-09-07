package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class EstoqueCalculoServiceImpl implements EstoqueCalculoService {

    @Override
    public StatusEstoque calcularStatus(BigDecimal quantidadeAtual, BigDecimal estoqueMinimo) {
        BigDecimal quantidade = quantidadeAtual != null ? quantidadeAtual : BigDecimal.ZERO;
        BigDecimal minimo = estoqueMinimo != null ? estoqueMinimo : BigDecimal.ZERO;

        if (quantidade.compareTo(BigDecimal.ZERO) <= 0) {
            return StatusEstoque.ZERADO;
        }

        if (quantidade.compareTo(minimo) < 0) {
            return StatusEstoque.ABAIXO_MINIMO;
        }

        return StatusEstoque.SAUDAVEL;
    }

    @Override
    public BigDecimal calcularValorEmEstoque(BigDecimal quantidadeAtual, BigDecimal precoMedio) {
        BigDecimal quantidade = quantidadeAtual != null ? quantidadeAtual : BigDecimal.ZERO;
        BigDecimal preco = precoMedio != null ? precoMedio : BigDecimal.ZERO;

        return quantidade.multiply(preco);
    }
}