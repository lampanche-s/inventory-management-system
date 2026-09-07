package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.MovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.service.MovimentacaoEstoqueService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/movimentacoes")
@RequiredArgsConstructor
@Validated
public class MovimentacaoEstoqueController {

    private final MovimentacaoEstoqueService movimentacaoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<MovimentacaoResponseDTO> registrar(
            @Valid @RequestBody MovimentacaoRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacaoService.registrar(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<PagedResponseDTO<MovimentacaoResponseDTO>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) TipoMovimentacao tipo,
            @RequestParam(required = false) Long itemId,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "dataHora,desc") String sort
    ) {
        return ResponseEntity.ok(
                movimentacaoService.listar(
                        search,
                        data,
                        dataInicio,
                        dataFim,
                        usuarioId,
                        tipo,
                        itemId,
                        page,
                        size,
                        sort
                )
        );
    }

    @GetMapping("/recentes")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<MovimentacaoResponseDTO>> listarRecentes(
            @RequestParam(required = false, defaultValue = "10") Integer limit
    ) {
        return ResponseEntity.ok(movimentacaoService.listarRecentes(limit));
    }
}
