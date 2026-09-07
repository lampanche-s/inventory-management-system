package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardResponseDTO {

    private DashboardResumoResponseDTO resumo;
    private List<EstoqueCriticoResponseDTO> estoqueCritico;
    private List<MovimentacaoResponseDTO> ultimasMovimentacoes;
    private List<CurvaAbcResponseDTO> curvaAbc;
}
