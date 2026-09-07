package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.DecisaoSolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoLoteRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoLoteResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;

import java.time.LocalDate;
import java.util.List;

public interface SolicitacaoMovimentacaoService {

    SolicitacaoMovimentacaoResponseDTO criar(SolicitacaoMovimentacaoRequestDTO request);

    SolicitacaoMovimentacaoLoteResponseDTO criarEmLote(SolicitacaoMovimentacaoLoteRequestDTO request);

    PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO> listar(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            Long solicitanteId,
            LocalDate data,
            int page,
            int size,
            String sort
    );

    PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO> listarMinhas(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            LocalDate data,
            int page,
            int size,
            String sort
    );

    SolicitacaoMovimentacaoResponseDTO cancelar(Long id);

    List<SolicitacaoMovimentacaoResponseDTO> listarPendentes(Integer limit);

    Long contarPendentes();

    SolicitacaoMovimentacaoResponseDTO aprovar(Long id, DecisaoSolicitacaoMovimentacaoRequestDTO request);

    SolicitacaoMovimentacaoResponseDTO rejeitar(Long id, DecisaoSolicitacaoMovimentacaoRequestDTO request);
}
