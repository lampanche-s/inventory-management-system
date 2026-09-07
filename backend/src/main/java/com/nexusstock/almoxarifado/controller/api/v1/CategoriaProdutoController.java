package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.CategoriaProdutoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.CategoriaProdutoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.service.CategoriaProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaProdutoController {

    private final CategoriaProdutoService categoriaService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<CategoriaProdutoResponseDTO>> listar() {
        return ResponseEntity.ok(categoriaService.listar());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<CategoriaProdutoResponseDTO> criar(@Valid @RequestBody CategoriaProdutoRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.criar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<CategoriaProdutoResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaProdutoRequestDTO request
    ) {
        return ResponseEntity.ok(categoriaService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        categoriaService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/itens")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<List<ItemResponseDTO>> listarItens(@PathVariable Long id) {
        return ResponseEntity.ok(categoriaService.listarItens(id));
    }

    @PostMapping("/{categoriaId}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<ItemResponseDTO> vincularItem(
            @PathVariable Long categoriaId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(categoriaService.vincularItem(categoriaId, itemId));
    }

    @DeleteMapping("/{categoriaId}/itens/{itemId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<ItemResponseDTO> desvincularItem(
            @PathVariable Long categoriaId,
            @PathVariable Long itemId
    ) {
        return ResponseEntity.ok(categoriaService.desvincularItem(categoriaId, itemId));
    }
}