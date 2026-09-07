package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.ItemCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.ItemUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.enums.StatusEstoque;

public interface ItemService {

    PagedResponseDTO<ItemResponseDTO> listar(
            String search,
            String categoria,
            StatusEstoque status,
            Boolean ativo,
            int page,
            int size,
            String sort
    );

    ItemResponseDTO buscarPorId(Long id);

    ItemResponseDTO buscarPorSku(String sku);

    ItemResponseDTO criar(ItemCreateRequestDTO request);

    ItemResponseDTO atualizar(Long id, ItemUpdateRequestDTO request);

    void desativar(Long id);

    void reativar(Long id);

    void excluir(Long id);

    Item buscarEntidadePorId(Long id);
}