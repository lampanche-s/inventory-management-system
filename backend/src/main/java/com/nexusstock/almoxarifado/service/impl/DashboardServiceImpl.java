package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.MovimentacaoMapper;
import com.nexusstock.almoxarifado.dto.response.CurvaAbcResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardGraficoPontoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardGraficoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardResponseDTO;
import com.nexusstock.almoxarifado.dto.response.DashboardResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.EstoqueCriticoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.entity.EstoqueValorHistorico;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.repository.EstoqueValorHistoricoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.service.DashboardService;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ItemRepository itemRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final EstoqueCalculoService estoqueCalculoService;
    private final EstoqueValorHistoricoRepository estoqueValorHistoricoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponseDTO obterDashboard() {
        return DashboardResponseDTO.builder()
                .resumo(obterResumo())
                .estoqueCritico(obterEstoqueCritico())
                .ultimasMovimentacoes(obterUltimasMovimentacoes())
                .curvaAbc(obterCurvaAbc())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardGraficoResponseDTO obterGrafico(String periodo) {
        String periodoNormalizado = normalizarPeriodo(periodo);

        LocalDate dataFim = LocalDate.now();
        LocalDate dataInicio = switch (periodoNormalizado) {
            case "1S" -> dataFim.minusDays(6);
            case "1M" -> dataFim.minusMonths(1).plusDays(1);
            case "3M" -> dataFim.minusMonths(3).plusDays(1);
            case "6M" -> dataFim.minusMonths(6).plusDays(1);
            case "1A" -> dataFim.minusYears(1).plusDays(1);
            default -> dataFim.minusDays(6);
        };

        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(LocalTime.MAX);

        Map<LocalDate, BigDecimal> entradasPorData = criarMapaPeriodo(dataInicio, dataFim);
        Map<LocalDate, BigDecimal> saidasPorData = criarMapaPeriodo(dataInicio, dataFim);
        Map<LocalDate, BigDecimal> valorEstoquePorData = criarMapaPeriodo(dataInicio, dataFim);

        preencherMovimentacoesGrafico(inicio, fim, entradasPorData, saidasPorData);
        preencherValorEstoqueGrafico(dataInicio, dataFim, valorEstoquePorData);

        List<DashboardGraficoPontoResponseDTO> pontos = new ArrayList<>();

        for (LocalDate data = dataInicio; !data.isAfter(dataFim); data = data.plusDays(1)) {
            pontos.add(DashboardGraficoPontoResponseDTO.builder()
                    .data(data)
                    .entradas(entradasPorData.getOrDefault(data, BigDecimal.ZERO))
                    .saidas(saidasPorData.getOrDefault(data, BigDecimal.ZERO))
                    .valorTotalEstoque(valorEstoquePorData.getOrDefault(data, BigDecimal.ZERO))
                    .build());
        }

        return DashboardGraficoResponseDTO.builder()
                .periodo(periodoNormalizado)
                .dataInicio(dataInicio)
                .dataFim(dataFim)
                .pontos(pontos)
                .build();
    }

    private DashboardResumoResponseDTO obterResumo() {
        LocalDate hoje = LocalDate.now();

        var inicioHoje = hoje.atStartOfDay();
        var fimHoje = hoje.atTime(LocalTime.MAX);

        return DashboardResumoResponseDTO.builder()
                .totalItens(itemRepository.countByAtivoTrue())
                .valorTotalEstoque(itemRepository.calcularValorTotalEstoque())
                .itensAbaixoMinimo(itemRepository.contarItensAbaixoDoMinimo())
                .itensZerados(itemRepository.contarItensZerados())
                .movimentacoesHoje(movimentacaoRepository.countByDataHoraBetween(inicioHoje, fimHoje))
                .totalEntradasHoje(movimentacaoRepository.countByTipoAndDataHoraBetween(TipoMovimentacao.ENTRADA, inicioHoje, fimHoje))
                .totalSaidasHoje(movimentacaoRepository.countByTipoAndDataHoraBetween(TipoMovimentacao.SAIDA, inicioHoje, fimHoje))
                .build();
    }

    private List<EstoqueCriticoResponseDTO> obterEstoqueCritico() {
        return itemRepository.buscarEstoqueCritico()
                .stream()
                .limit(10)
                .map(this::toEstoqueCritico)
                .toList();
    }

    private EstoqueCriticoResponseDTO toEstoqueCritico(Item item) {
        StatusEstoque status = estoqueCalculoService.calcularStatus(
                item.getQuantidadeAtual(),
                item.getEstoqueMinimo()
        );

        return EstoqueCriticoResponseDTO.builder()
                .itemId(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .quantidadeAtual(item.getQuantidadeAtual())
                .estoqueMinimo(item.getEstoqueMinimo())
                .statusEstoque(status)
                .statusEstoqueLabel(status.getLabel())
                .fornecedorNome(item.getFornecedor().getNome())
                .localizacaoFormatada(formatarLocalizacao(item))
                .build();
    }

    private List<MovimentacaoResponseDTO> obterUltimasMovimentacoes() {
        return movimentacaoRepository.findTop10ByOrderByDataHoraDesc()
                .stream()
                .map(MovimentacaoMapper::toResponse)
                .toList();
    }

    private List<CurvaAbcResponseDTO> obterCurvaAbc() {
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

            String classe = definirClasseAbc(acumulado);

            resultado.add(CurvaAbcResponseDTO.builder()
                    .itemId(item.getId())
                    .nome(item.getNome())
                    .sku(item.getSku())
                    .valorEmEstoque(valorEmEstoque)
                    .percentual(percentual)
                    .percentualAcumulado(acumulado)
                    .classe(classe)
                    .build());
        }

        return resultado;
    }

    private void preencherMovimentacoesGrafico(
            LocalDateTime inicio,
            LocalDateTime fim,
            Map<LocalDate, BigDecimal> entradasPorData,
            Map<LocalDate, BigDecimal> saidasPorData
    ) {
        List<MovimentacaoEstoque> movimentacoes = entityManager
                .createQuery("""
                        SELECT m
                        FROM MovimentacaoEstoque m
                        WHERE m.dataHora BETWEEN :inicio AND :fim
                        ORDER BY m.dataHora ASC
                        """, MovimentacaoEstoque.class)
                .setParameter("inicio", inicio)
                .setParameter("fim", fim)
                .getResultList();

        for (MovimentacaoEstoque movimentacao : movimentacoes) {
            LocalDate data = movimentacao.getDataHora().toLocalDate();
            BigDecimal quantidade = movimentacao.getQuantidade() == null ? BigDecimal.ZERO : movimentacao.getQuantidade();

            if (movimentacao.getTipo() == TipoMovimentacao.ENTRADA) {
                entradasPorData.merge(data, quantidade, BigDecimal::add);
            }

            if (movimentacao.getTipo() == TipoMovimentacao.SAIDA) {
                saidasPorData.merge(data, quantidade, BigDecimal::add);
            }
        }
    }

    private void preencherValorEstoqueGrafico(
            LocalDate dataInicio,
            LocalDate dataFim,
            Map<LocalDate, BigDecimal> valorEstoquePorData
    ) {
        LocalDateTime inicio = dataInicio.atStartOfDay();
        LocalDateTime fim = dataFim.atTime(LocalTime.MAX);

        List<EstoqueValorHistorico> historicos = estoqueValorHistoricoRepository
                .findByDataHoraBetweenOrderByDataHoraAsc(inicio, fim);

        EstoqueValorHistorico anterior = estoqueValorHistoricoRepository
                .findTopByDataHoraLessThanEqualOrderByDataHoraDesc(inicio.minusNanos(1));

        BigDecimal valorAtual = anterior == null
                ? BigDecimal.ZERO
                : anterior.getValorTotal();

        int index = 0;

        for (LocalDate data = dataInicio; !data.isAfter(dataFim); data = data.plusDays(1)) {
            LocalDateTime limiteDia = data.atTime(LocalTime.MAX);

            while (index < historicos.size()
                    && !historicos.get(index).getDataHora().isAfter(limiteDia)) {
                valorAtual = historicos.get(index).getValorTotal();
                index++;
            }

            valorEstoquePorData.put(data, valorAtual == null ? BigDecimal.ZERO : valorAtual);
        }

        BigDecimal valorTotalAtual = itemRepository.calcularValorTotalEstoque();

        if (valorTotalAtual != null && valorEstoquePorData.values().stream().allMatch(v -> v.compareTo(BigDecimal.ZERO) == 0)) {
            valorEstoquePorData.put(dataFim, valorTotalAtual);
        }
    }

    private Map<LocalDate, BigDecimal> criarMapaPeriodo(LocalDate dataInicio, LocalDate dataFim) {
        Map<LocalDate, BigDecimal> mapa = new LinkedHashMap<>();

        for (LocalDate data = dataInicio; !data.isAfter(dataFim); data = data.plusDays(1)) {
            mapa.put(data, BigDecimal.ZERO);
        }

        return mapa;
    }

    private String normalizarPeriodo(String periodo) {
        if (periodo == null || periodo.isBlank()) {
            return "1S";
        }

        return switch (periodo.trim().toUpperCase()) {
            case "1S", "7D", "1W" -> "1S";
            case "1M" -> "1M";
            case "3M" -> "3M";
            case "6M" -> "6M";
            case "1A", "12M", "1Y" -> "1A";
            default -> "1S";
        };
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

    private String formatarLocalizacao(Item item) {
        String localizacao = limparLocalizacaoResposta(item.getLocalizacao());

        if (localizacao != null && !localizacao.isBlank()) {
            return localizacao;
        }

        String corredor = limparLocalizacaoResposta(item.getCorredor());
        String prateleira = limparLocalizacaoResposta(item.getPrateleira());

        if ((corredor == null || corredor.isBlank()) && (prateleira == null || prateleira.isBlank())) {
            return "Location not specified";
        }

        return "Aisle " + corredor + " - Shelf " + prateleira;
    }

    private String limparLocalizacaoResposta(String valor) {
        if (valor == null) {
            return null;
        }

        String texto = valor.trim();

        if (texto.isBlank()) {
            return null;
        }

        String normalizado = texto
                .toLowerCase()
                .replace("–", "-")
                .replace("—", "-")
                .replaceAll("\\s+", " ")
                .trim();

        String compacto = normalizado.replace(" ", "");

        if (
                normalizado.equals("-") ||
                normalizado.equals("--") ||
                normalizado.equals("corredor - - prateleira -") ||
                normalizado.equals("corredor - prateleira -") ||
                compacto.equals("corredor--prateleira-") ||
                compacto.equals("corredor-prateleira-") ||
                compacto.equals("corredor-prateleira")
        ) {
            return null;
        }

        return texto;
    }
}
