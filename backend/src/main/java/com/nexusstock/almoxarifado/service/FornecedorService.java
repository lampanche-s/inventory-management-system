package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.FornecedorRequestDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResponseDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.entity.Fornecedor;

import java.util.List;

public interface FornecedorService {

    List<FornecedorResponseDTO> listar();

    PagedResponseDTO<FornecedorResponseDTO> listar(
            String search,
            Boolean ativo,
            int page,
            int size,
            String sort
    );

    FornecedorResponseDTO buscarPorId(Long id);

    List<FornecedorResumoResponseDTO> listarResumo();

    List<FornecedorResumoResponseDTO> listarResumo(String search, Boolean ativo, int limit);

    FornecedorResponseDTO criar(FornecedorRequestDTO request);

    FornecedorResponseDTO atualizar(Long id, FornecedorRequestDTO request);

    void excluirDefinitivamente(Long id);

    ItemResponseDTO desvincularItem(Long fornecedorId, Long itemId);

    Fornecedor buscarEntidadePorId(Long id);
}