package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, Long> {

    List<MovimentacaoEstoque> findTop10ByOrderByDataHoraDesc();

    List<MovimentacaoEstoque> findAllByOrderByDataHoraDesc(Pageable pageable);

    @Query("""
            SELECT m
            FROM MovimentacaoEstoque m
            JOIN m.item i
            JOIN m.usuario u
            WHERE (:search IS NULL
                   OR :search = ''
                   OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(CAST(m.motivo AS string)) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(m.observacao, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:tipo IS NULL OR m.tipo = :tipo)
              AND (:usuarioId IS NULL OR u.id = :usuarioId)
              AND (:itemId IS NULL OR i.id = :itemId)
              AND m.dataHora >= :dataInicio
              AND m.dataHora <= :dataFim
            """)
    Page<MovimentacaoEstoque> buscarComFiltros(
            @Param("search") String search,
            @Param("tipo") TipoMovimentacao tipo,
            @Param("usuarioId") Long usuarioId,
            @Param("itemId") Long itemId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable
    );

    @Query("""
            SELECT m
            FROM MovimentacaoEstoque m
            JOIN m.item i
            JOIN i.fornecedor f
            JOIN m.usuario u
            WHERE (:search IS NULL
                   OR :search = ''
                   OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(CAST(m.motivo AS string)) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(COALESCE(m.observacao, '')) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:tipo IS NULL OR m.tipo = :tipo)
              AND (:usuarioId IS NULL OR u.id = :usuarioId)
              AND (:itemId IS NULL OR i.id = :itemId)
              AND (:categoria IS NULL OR i.categoria = :categoria)
              AND (:fornecedorId IS NULL OR f.id = :fornecedorId)
              AND m.dataHora >= :dataInicio
              AND m.dataHora <= :dataFim
            """)
    Page<MovimentacaoEstoque> buscarRelatorioComFiltros(
            @Param("search") String search,
            @Param("tipo") TipoMovimentacao tipo,
            @Param("usuarioId") Long usuarioId,
            @Param("itemId") Long itemId,
            @Param("categoria") String categoria,
            @Param("fornecedorId") Long fornecedorId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            Pageable pageable
    );

    long countByDataHoraBetween(LocalDateTime inicio, LocalDateTime fim);

    long countByTipoAndDataHoraBetween(
            TipoMovimentacao tipo,
            LocalDateTime inicio,
            LocalDateTime fim
    );

    @Query("""
            SELECT COALESCE(SUM(m.quantidade), 0)
            FROM MovimentacaoEstoque m
            WHERE m.tipo = :tipo
              AND m.dataHora >= :inicio
              AND m.dataHora <= :fim
            """)
    BigDecimal somarQuantidadePorTipoEPeriodo(
            @Param("tipo") TipoMovimentacao tipo,
            @Param("inicio") LocalDateTime inicio,
            @Param("fim") LocalDateTime fim
    );
}
