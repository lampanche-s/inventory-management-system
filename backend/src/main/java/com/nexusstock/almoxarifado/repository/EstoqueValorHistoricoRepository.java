package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.EstoqueValorHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EstoqueValorHistoricoRepository extends JpaRepository<EstoqueValorHistorico, Long> {

    List<EstoqueValorHistorico> findByDataHoraBetweenOrderByDataHoraAsc(
            LocalDateTime inicio,
            LocalDateTime fim
    );

    EstoqueValorHistorico findTopByDataHoraLessThanEqualOrderByDataHoraDesc(LocalDateTime dataHora);
}
