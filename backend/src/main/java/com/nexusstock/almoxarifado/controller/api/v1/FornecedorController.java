package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.FornecedorRequestDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResponseDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.service.FornecedorService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fornecedores")
@RequiredArgsConstructor
@Validated
public class FornecedorController {

    private final FornecedorService fornecedorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<PagedResponseDTO<FornecedorResponseDTO>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "nome,asc") String sort
    ) {
        return ResponseEntity.ok(fornecedorService.listar(search, ativo, page, size, sort));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<FornecedorResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(fornecedorService.buscarPorId(id));
    }

    @GetMapping("/resumo")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<FornecedorResumoResponseDTO>> listarResumo(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "true") Boolean ativo,
            @RequestParam(required = false, defaultValue = "20") @Min(value = 1, message = "The minimum limit is 1.") @Max(value = 100, message = "The maximum limit is 100.") int limit
    ) {
        return ResponseEntity.ok(fornecedorService.listarResumo(search, ativo, limit));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<FornecedorResponseDTO> criar(@Valid @RequestBody FornecedorRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fornecedorService.criar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<FornecedorResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody FornecedorRequestDTO request
    ) {
        return ResponseEntity.ok(fornecedorService.atualizar(id, request));
    }

    @DeleteMapping("/{fornecedorId}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<ItemResponseDTO> desvincularItem(
            @PathVariable Long fornecedorId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(fornecedorService.desvincularItem(fornecedorId, itemId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Void> excluirDefinitivamente(@PathVariable Long id) {
        fornecedorService.excluirDefinitivamente(id);
        return ResponseEntity.noContent().build();
    }
}
