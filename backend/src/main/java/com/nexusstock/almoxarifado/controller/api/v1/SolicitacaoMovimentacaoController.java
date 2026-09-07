package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.DecisaoSolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoLoteRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoLoteResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.service.SolicitacaoMovimentacaoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/solicitacoes")
@RequiredArgsConstructor
@Validated
public class SolicitacaoMovimentacaoController {

    private final SolicitacaoMovimentacaoService solicitacaoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<SolicitacaoMovimentacaoResponseDTO> criar(
            @Valid @RequestBody SolicitacaoMovimentacaoRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitacaoService.criar(request));
    }

    @PostMapping("/lote")
    @PreAuthorize("hasAnyRole('SOLICITANTE', 'SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<SolicitacaoMovimentacaoLoteResponseDTO> criarEmLote(
            @Valid @RequestBody SolicitacaoMovimentacaoLoteRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitacaoService.criarEmLote(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StatusSolicitacaoMovimentacao status,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) Long solicitanteId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "dataSolicitacao,desc") String sort
    ) {
        return ResponseEntity.ok(solicitacaoService.listar(search, status, tipo, solicitanteId, data, page, size, sort));
    }

    @GetMapping("/minhas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO>> listarMinhas(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StatusSolicitacaoMovimentacao status,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "dataSolicitacao,desc") String sort
    ) {
        return ResponseEntity.ok(solicitacaoService.listarMinhas(search, status, tipo, data, page, size, sort));
    }

    @PostMapping("/{id}/cancelar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SolicitacaoMovimentacaoResponseDTO> cancelar(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(solicitacaoService.cancelar(id));
    }

    @GetMapping("/pendentes")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<SolicitacaoMovimentacaoResponseDTO>> listarPendentes(
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(solicitacaoService.listarPendentes(limit));
    }

    @GetMapping("/pendentes/contagem")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Map<String, Long>> contarPendentes() {
        return ResponseEntity.ok(Map.of("total", solicitacaoService.contarPendentes()));
    }

    @PostMapping("/{id}/aprovar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<SolicitacaoMovimentacaoResponseDTO> aprovar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DecisaoSolicitacaoMovimentacaoRequestDTO request
    ) {
        return ResponseEntity.ok(solicitacaoService.aprovar(id, request));
    }

    @PostMapping("/{id}/rejeitar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<SolicitacaoMovimentacaoResponseDTO> rejeitar(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DecisaoSolicitacaoMovimentacaoRequestDTO request
    ) {
        return ResponseEntity.ok(solicitacaoService.rejeitar(id, request));
    }
}
