package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.MovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;

import java.time.LocalDate;
import java.util.List;

public interface MovimentacaoEstoqueService {

    MovimentacaoResponseDTO registrar(MovimentacaoRequestDTO request);

    PagedResponseDTO<MovimentacaoResponseDTO> listar(
            String search,
            LocalDate data,
            LocalDate dataInicio,
            LocalDate dataFim,
            Long usuarioId,
            TipoMovimentacao tipo,
            Long itemId,
            int page,
            int size,
            String sort
    );

    List<MovimentacaoResponseDTO> listarRecentes(Integer limit);
}