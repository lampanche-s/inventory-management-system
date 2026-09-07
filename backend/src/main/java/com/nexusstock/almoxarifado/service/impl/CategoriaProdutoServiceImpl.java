package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.ItemMapper;
import com.nexusstock.almoxarifado.dto.request.CategoriaProdutoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.CategoriaProdutoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.entity.CategoriaProduto;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.ResourceInUseException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.CategoriaProdutoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.service.CategoriaProdutoService;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaProdutoServiceImpl implements CategoriaProdutoService {

    private static final String SEM_CATEGORIA = "Uncategorized";

    private final CategoriaProdutoRepository categoriaRepository;
    private final ItemRepository itemRepository;
    private final EstoqueCalculoService estoqueCalculoService;

    @Override
    @Transactional(readOnly = true)
    public List<CategoriaProdutoResponseDTO> listar() {
        return categoriaRepository.findByAtivoTrueOrderByNomeAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CategoriaProdutoResponseDTO criar(CategoriaProdutoRequestDTO request) {
        String nome = normalizarNome(request.getNome());

        if (categoriaRepository.existsByNomeIgnoreCase(nome)) {
            throw new BusinessException("A category with this name already exists.");
        }

        CategoriaProduto categoria = new CategoriaProduto();
        categoria.setNome(nome);
        categoria.setAtivo(true);

        return toResponse(categoriaRepository.save(categoria));
    }

    @Override
    @Transactional
    public CategoriaProdutoResponseDTO atualizar(Long id, CategoriaProdutoRequestDTO request) {
        CategoriaProduto categoria = buscarEntidadePorId(id);

        String nomeAntigo = categoria.getNome();
        String nomeNovo = normalizarNome(request.getNome());

        categoriaRepository.findByNomeIgnoreCase(nomeNovo)
                .filter(encontrada -> !encontrada.getId().equals(id))
                .ifPresent(encontrada -> {
                    throw new BusinessException("Another category with this name already exists.");
                });

        categoria.setNome(nomeNovo);
        CategoriaProduto atualizada = categoriaRepository.save(categoria);

        itemRepository.atualizarCategoriaDosItens(nomeAntigo, nomeNovo);

        return toResponse(atualizada);
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        CategoriaProduto categoria = buscarEntidadePorId(id);

        long quantidadeItens = itemRepository.countByCategoriaIgnoreCase(categoria.getNome());

        if (quantidadeItens > 0) {
            throw new ResourceInUseException("This category has linked items, including inactive ones. Move or unlink them before deleting the category.");
        }

        categoriaRepository.delete(categoria);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemResponseDTO> listarItens(Long id) {
        CategoriaProduto categoria = buscarEntidadePorId(id);

        return itemRepository.findByCategoriaAndAtivoTrueOrderByNomeAsc(categoria.getNome())
                .stream()
                .map(item -> ItemMapper.toResponse(item, estoqueCalculoService))
                .toList();
    }

    @Override
    @Transactional
    public ItemResponseDTO vincularItem(Long categoriaId, Long itemId) {
        CategoriaProduto categoria = buscarEntidadePorId(categoriaId);

        if (!Boolean.TRUE.equals(categoria.getAtivo())) {
            throw new BusinessException("An inactive category cannot be linked to an item.");
        }

        Item item = buscarItemPorId(itemId);
        item.setCategoria(categoria.getNome());

        return ItemMapper.toResponse(itemRepository.save(item), estoqueCalculoService);
    }

    @Override
    @Transactional
    public ItemResponseDTO desvincularItem(Long categoriaId, Long itemId) {
        CategoriaProduto categoria = buscarEntidadePorId(categoriaId);
        Item item = buscarItemPorId(itemId);

        if (!categoria.getNome().equalsIgnoreCase(item.getCategoria())) {
            throw new BusinessException("This item is not linked to this category.");
        }

        garantirCategoriaSemCategoria();

        item.setCategoria(SEM_CATEGORIA);

        return ItemMapper.toResponse(itemRepository.save(item), estoqueCalculoService);
    }

    @Override
    @Transactional
    public void garantirCategoriasPadrao() {
        List<String> nomesPadrao = List.of(
                "Office supplies",
                "Cleaning",
                "Personal protective equipment",
                "IT equipment",
                "Maintenance",
                "Break room",
                "Packaging",
                SEM_CATEGORIA
        );

        for (String nome : nomesPadrao) {
            if (!categoriaRepository.existsByNomeIgnoreCase(nome)) {
                CategoriaProduto categoria = new CategoriaProduto();
                categoria.setNome(nome);
                categoria.setAtivo(true);
                categoriaRepository.save(categoria);
            }
        }
    }

    private CategoriaProduto buscarEntidadePorId(Long id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }

    private Item buscarItemPorId(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));
    }

    private CategoriaProdutoResponseDTO toResponse(CategoriaProduto categoria) {
        return CategoriaProdutoResponseDTO.builder()
                .id(categoria.getId())
                .nome(categoria.getNome())
                .quantidadeItens(itemRepository.countByCategoriaAndAtivoTrue(categoria.getNome()))
                .ativo(categoria.getAtivo())
                .build();
    }

    private String normalizarNome(String nome) {
        if (nome == null || nome.trim().isBlank()) {
            throw new BusinessException("The category name is required.");
        }

        return nome.trim();
    }

    private void garantirCategoriaSemCategoria() {
        if (!categoriaRepository.existsByNomeIgnoreCase(SEM_CATEGORIA)) {
            CategoriaProduto categoria = new CategoriaProduto();
            categoria.setNome(SEM_CATEGORIA);
            categoria.setAtivo(true);
            categoriaRepository.save(categoria);
        }
    }
}
