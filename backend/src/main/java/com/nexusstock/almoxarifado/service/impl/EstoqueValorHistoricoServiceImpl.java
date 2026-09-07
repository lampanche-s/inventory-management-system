package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.entity.EstoqueValorHistorico;
import com.nexusstock.almoxarifado.repository.EstoqueValorHistoricoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EstoqueValorHistoricoServiceImpl implements EstoqueValorHistoricoService {

    private final EstoqueValorHistoricoRepository estoqueValorHistoricoRepository;
    private final ItemRepository itemRepository;

    @Override
    @Transactional
    public void registrarSnapshot(String origem) {
        BigDecimal valorTotal = itemRepository.calcularValorTotalEstoque();

        EstoqueValorHistorico historico = new EstoqueValorHistorico();
        historico.setValorTotal(valorTotal == null ? BigDecimal.ZERO : valorTotal);
        historico.setDataHora(LocalDateTime.now());
        historico.setOrigem(origem == null || origem.isBlank() ? "SISTEMA" : origem.trim());

        estoqueValorHistoricoRepository.save(historico);
    }
}
