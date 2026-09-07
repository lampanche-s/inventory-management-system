package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.ItemCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.ItemUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.service.ItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/itens")
@RequiredArgsConstructor
@Validated
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO', 'SOLICITANTE')")
    public ResponseEntity<PagedResponseDTO<ItemResponseDTO>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) StatusEstoque status,
            @RequestParam(required = false, defaultValue = "true") Boolean ativo,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "nome,asc") String sort
    ) {
        return ResponseEntity.ok(
                itemService.listar(search, categoria, status, ativo, page, size, sort)
        );
    }

    @GetMapping("/sku/{sku}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO', 'SOLICITANTE')")
    public ResponseEntity<ItemResponseDTO> buscarPorSku(@PathVariable String sku) {
        return ResponseEntity.ok(itemService.buscarPorSku(sku));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO', 'SOLICITANTE')")
    public ResponseEntity<ItemResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.buscarPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<ItemResponseDTO> criar(@Valid @RequestBody ItemCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemService.criar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<ItemResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody ItemUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(itemService.atualizar(id, request));
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        itemService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Void> reativar(@PathVariable Long id) {
        itemService.reativar(id);
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        itemService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
