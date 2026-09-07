package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.response.CurvaAbcResponseDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.RelatorioResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.TopItemValorResponseDTO;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.service.RelatorioService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/relatorios")
@RequiredArgsConstructor
@Validated
public class RelatorioController {

    private final RelatorioService relatorioService;

    @GetMapping("/resumo")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<RelatorioResumoResponseDTO> obterResumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim
    ) {
        return ResponseEntity.ok(relatorioService.obterResumo(dataInicio, dataFim));
    }

    @GetMapping("/curva-abc")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<CurvaAbcResponseDTO>> obterCurvaAbc() {
        return ResponseEntity.ok(relatorioService.obterCurvaAbc());
    }

    @GetMapping("/top-itens-por-valor")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<TopItemValorResponseDTO>> obterTopItensPorValor(
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(relatorioService.obterTopItensPorValor(limit));
    }

    @GetMapping("/movimentacoes")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<PagedResponseDTO<MovimentacaoResponseDTO>> obterMovimentacoes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) Long fornecedorId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "dataHora,desc") String sort
    ) {
        return ResponseEntity.ok(
                relatorioService.obterMovimentacoes(
                        search,
                        dataInicio,
                        dataFim,
                        tipo,
                        usuarioId,
                        itemId,
                        categoria,
                        fornecedorId,
                        page,
                        size,
                        sort
                )
        );
    }
}
