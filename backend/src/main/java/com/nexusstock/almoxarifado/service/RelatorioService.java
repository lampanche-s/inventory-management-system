package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.response.CurvaAbcResponseDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.RelatorioResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.TopItemValorResponseDTO;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;

import java.time.LocalDate;
import java.util.List;

public interface RelatorioService {

    RelatorioResumoResponseDTO obterResumo(
            LocalDate dataInicio,
            LocalDate dataFim
    );

    List<CurvaAbcResponseDTO> obterCurvaAbc();

    List<TopItemValorResponseDTO> obterTopItensPorValor(Integer limit);

    PagedResponseDTO<MovimentacaoResponseDTO> obterMovimentacoes(
            String search,
            LocalDate dataInicio,
            LocalDate dataFim,
            TipoMovimentacao tipo,
            Long usuarioId,
            Long itemId,
            String categoria,
            Long fornecedorId,
            int page,
            int size,
            String sort
    );
}