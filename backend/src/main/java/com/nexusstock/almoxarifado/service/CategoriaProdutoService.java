package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.CategoriaProdutoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.CategoriaProdutoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;

import java.util.List;

public interface CategoriaProdutoService {

    List<CategoriaProdutoResponseDTO> listar();

    CategoriaProdutoResponseDTO criar(CategoriaProdutoRequestDTO request);

    CategoriaProdutoResponseDTO atualizar(Long id, CategoriaProdutoRequestDTO request);

    void excluir(Long id);

    List<ItemResponseDTO> listarItens(Long id);

    ItemResponseDTO vincularItem(Long categoriaId, Long itemId);

    ItemResponseDTO desvincularItem(Long categoriaId, Long itemId);

    void garantirCategoriasPadrao();
}