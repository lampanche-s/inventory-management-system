package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.SolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SolicitacaoMovimentacaoRepository extends JpaRepository<SolicitacaoMovimentacao, Long> {

    @Query("""
            SELECT s FROM SolicitacaoMovimentacao s
            JOIN s.item i
            JOIN s.solicitante sol
            LEFT JOIN s.aprovador apr
            WHERE (:search IS NULL
                OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(sol.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(sol.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(apr.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(apr.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(s.codigoPedido) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR s.status = :status)
            AND (:tipo IS NULL OR s.tipo = :tipo)
            AND (:solicitanteId IS NULL OR sol.id = :solicitanteId)
            """)
    Page<SolicitacaoMovimentacao> buscarComFiltros(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            Long solicitanteId,
            Pageable pageable
    );


    @Query("""
            SELECT s FROM SolicitacaoMovimentacao s
            JOIN s.item i
            JOIN s.solicitante sol
            LEFT JOIN s.aprovador apr
            WHERE (:search IS NULL
                OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(sol.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(sol.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(apr.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(apr.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(s.codigoPedido) LIKE LOWER(CONCAT('%', :search, '%')))
            AND (:status IS NULL OR s.status = :status)
            AND (:tipo IS NULL OR s.tipo = :tipo)
            AND (:solicitanteId IS NULL OR sol.id = :solicitanteId)
            AND COALESCE(s.dataDecisao, s.dataSolicitacao) >= :dataInicio
            AND COALESCE(s.dataDecisao, s.dataSolicitacao) < :dataFimExclusivo
            """)
    Page<SolicitacaoMovimentacao> buscarComFiltrosPorPeriodo(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            Long solicitanteId,
            LocalDateTime dataInicio,
            LocalDateTime dataFimExclusivo,
            Pageable pageable
    );

    List<SolicitacaoMovimentacao> findByStatusOrderByDataSolicitacaoDesc(StatusSolicitacaoMovimentacao status, Pageable pageable);

    long countByStatus(StatusSolicitacaoMovimentacao status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SolicitacaoMovimentacao s WHERE s.id = :id")
    Optional<SolicitacaoMovimentacao> buscarPorIdComLock(@Param("id") Long id);
}
