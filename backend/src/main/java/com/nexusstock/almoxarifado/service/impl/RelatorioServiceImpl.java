package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.MovimentacaoMapper;
import com.nexusstock.almoxarifado.dto.response.CurvaAbcResponseDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.RelatorioResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.TopItemValorResponseDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import com.nexusstock.almoxarifado.service.RelatorioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RelatorioServiceImpl implements RelatorioService {

    private final ItemRepository itemRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final EstoqueCalculoService estoqueCalculoService;

    @Override
    @Transactional(readOnly = true)
    public RelatorioResumoResponseDTO obterResumo(
            LocalDate dataInicio,
            LocalDate dataFim
    ) {
        LocalDateTime inicio = definirInicio(dataInicio);
        LocalDateTime fim = definirFim(dataFim);

        Long itensCriticos = itemRepository.contarItensAbaixoDoMinimo() + itemRepository.contarItensZerados();

        return RelatorioResumoResponseDTO.builder()
                .valorTotalEstoque(itemRepository.calcularValorTotalEstoque())
                .totalItens(itemRepository.countByAtivoTrue())
                .itensCriticos(itensCriticos)
                .totalEntradas(movimentacaoRepository.somarQuantidadePorTipoEPeriodo(TipoMovimentacao.ENTRADA, inicio, fim))
                .totalSaidas(movimentacaoRepository.somarQuantidadePorTipoEPeriodo(TipoMovimentacao.SAIDA, inicio, fim))
                .quantidadeMovimentacoes(movimentacaoRepository.countByDataHoraBetween(inicio, fim))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CurvaAbcResponseDTO> obterCurvaAbc() {
        List<Item> itens = itemRepository.buscarItensAtivosOrdenadosPorValor();

        BigDecimal valorTotal = itens.stream()
                .map(item -> estoqueCalculoService.calcularValorEmEstoque(
                        item.getQuantidadeAtual(),
                        item.getPrecoMedio()
                ))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (valorTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        BigDecimal acumulado = BigDecimal.ZERO;
        List<CurvaAbcResponseDTO> resultado = new ArrayList<>();

        for (Item item : itens) {
            BigDecimal valorEmEstoque = estoqueCalculoService.calcularValorEmEstoque(
                    item.getQuantidadeAtual(),
                    item.getPrecoMedio()
            );

            BigDecimal percentual = valorEmEstoque
                    .multiply(BigDecimal.valueOf(100))
                    .divide(valorTotal, 2, RoundingMode.HALF_UP);

            acumulado = acumulado.add(percentual);

            resultado.add(CurvaAbcResponseDTO.builder()
                    .itemId(item.getId())
                    .nome(item.getNome())
                    .sku(item.getSku())
                    .valorEmEstoque(valorEmEstoque)
                    .percentual(percentual)
                    .percentualAcumulado(acumulado)
                    .classe(definirClasseAbc(acumulado))
                    .build());
        }

        return resultado;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopItemValorResponseDTO> obterTopItensPorValor(Integer limit) {
        int limiteFinal = limit == null ? 10 : Math.max(1, Math.min(limit, 50));

        List<Item> itens = itemRepository.buscarItensAtivosOrdenadosPorValor();

        BigDecimal valorTotal = itens.stream()
                .map(item -> estoqueCalculoService.calcularValorEmEstoque(
                        item.getQuantidadeAtual(),
                        item.getPrecoMedio()
                ))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return itens.stream()
                .limit(limiteFinal)
                .map(item -> toTopItemValor(item, valorTotal))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<MovimentacaoResponseDTO> obterMovimentacoes(
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
    ) {
        LocalDateTime inicio = definirInicio(dataInicio);
        LocalDateTime fim = definirFim(dataFim);

        Pageable pageable = PageRequest.of(page, limitarSize(size), criarSort(sort));

        Page<MovimentacaoEstoque> movimentacoes = movimentacaoRepository.buscarRelatorioComFiltros(
                normalizarSearch(search),
                tipo,
                usuarioId,
                itemId,
                categoria,
                fornecedorId,
                inicio,
                fim,
                pageable
        );

        return PagedResponseDTO.<MovimentacaoResponseDTO>builder()
                .content(movimentacoes.getContent()
                        .stream()
                        .map(MovimentacaoMapper::toResponse)
                        .toList())
                .page(movimentacoes.getNumber())
                .size(movimentacoes.getSize())
                .totalElements(movimentacoes.getTotalElements())
                .totalPages(movimentacoes.getTotalPages())
                .first(movimentacoes.isFirst())
                .last(movimentacoes.isLast())
                .build();
    }

    private TopItemValorResponseDTO toTopItemValor(Item item, BigDecimal valorTotal) {
        BigDecimal valorEmEstoque = estoqueCalculoService.calcularValorEmEstoque(
                item.getQuantidadeAtual(),
                item.getPrecoMedio()
        );

        BigDecimal percentualSobreTotal = BigDecimal.ZERO;

        if (valorTotal.compareTo(BigDecimal.ZERO) > 0) {
            percentualSobreTotal = valorEmEstoque
                    .multiply(BigDecimal.valueOf(100))
                    .divide(valorTotal, 2, RoundingMode.HALF_UP);
        }

        return TopItemValorResponseDTO.builder()
                .itemId(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .quantidadeAtual(item.getQuantidadeAtual())
                .precoMedio(item.getPrecoMedio())
                .valorEmEstoque(valorEmEstoque)
                .percentualSobreTotal(percentualSobreTotal)
                .build();
    }

    private String definirClasseAbc(BigDecimal percentualAcumulado) {
        if (percentualAcumulado.compareTo(BigDecimal.valueOf(80)) <= 0) {
            return "A";
        }

        if (percentualAcumulado.compareTo(BigDecimal.valueOf(95)) <= 0) {
            return "B";
        }

        return "C";
    }

    private LocalDateTime definirInicio(LocalDate dataInicio) {
        if (dataInicio != null) {
            return dataInicio.atStartOfDay();
        }

        return LocalDate.of(1900, 1, 1).atStartOfDay();
    }

    private LocalDateTime definirFim(LocalDate dataFim) {
        if (dataFim != null) {
            return dataFim.atTime(LocalTime.MAX);
        }

        return LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX);
    }

    private int limitarSize(int size) {
        if (size > 100) {
            return 100;
        }

        return Math.max(size, 1);
    }

    private Sort criarSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "dataHora");
        }

        String[] partes = sort.split(",");

        String campo = partes[0].trim();
        String direcao = partes.length > 1 ? partes[1].trim() : "desc";

        if (!campoPermitidoParaOrdenacao(campo)) {
            campo = "dataHora";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(direcao)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(direction, campo);
    }

    private boolean campoPermitidoParaOrdenacao(String campo) {
        return campo.equals("dataHora")
                || campo.equals("tipo")
                || campo.equals("quantidade")
                || campo.equals("motivo")
                || campo.equals("createdAt");
    }

    private String normalizarSearch(String search) {
        if (search == null || search.trim().isBlank()) {
            return null;
        }

        return search.trim();
    }
}