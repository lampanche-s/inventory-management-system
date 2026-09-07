package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.entity.CategoriaProduto;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.ResourceInUseException;
import com.nexusstock.almoxarifado.repository.CategoriaProdutoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriaProdutoServiceImplTests {

    @Mock
    private CategoriaProdutoRepository categoriaRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private EstoqueCalculoService estoqueCalculoService;

    private CategoriaProdutoServiceImpl service;
    private CategoriaProduto categoria;

    @BeforeEach
    void setUp() {
        service = new CategoriaProdutoServiceImpl(
                categoriaRepository,
                itemRepository,
                estoqueCalculoService
        );

        categoria = new CategoriaProduto();
        categoria.setId(5L);
        categoria.setNome("Cleaning");
        categoria.setAtivo(true);
        when(categoriaRepository.findById(5L)).thenReturn(Optional.of(categoria));
    }

    @Test
    void impedeVinculoComCategoriaInativaSemAlterarItem() {
        categoria.setAtivo(false);

        assertThatThrownBy(() -> service.vincularItem(5L, 10L))
                .isInstanceOf(BusinessException.class)
                .hasMessage("An inactive category cannot be linked to an item.");

        verify(itemRepository, never()).findById(10L);
        verify(itemRepository, never()).save(any());
    }

    @Test
    void impedeExclusaoQuandoQualquerItemContinuaVinculado() {
        when(itemRepository.countByCategoriaIgnoreCase("Cleaning")).thenReturn(1L);

        assertThatThrownBy(() -> service.excluir(5L))
                .isInstanceOf(ResourceInUseException.class)
                .hasMessageContaining("including inactive ones");

        verify(categoriaRepository, never()).delete(categoria);
    }

    @Test
    void excluiCategoriaSemItensVinculados() {
        when(itemRepository.countByCategoriaIgnoreCase("Cleaning")).thenReturn(0L);

        service.excluir(5L);

        verify(categoriaRepository).delete(categoria);
    }
}
