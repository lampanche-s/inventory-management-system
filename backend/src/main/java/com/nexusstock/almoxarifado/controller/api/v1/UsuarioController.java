package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.AlterarMinhaSenhaRequestDTO;
import com.nexusstock.almoxarifado.dto.request.UsuarioCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.UsuarioUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.enums.RoleName;
import com.nexusstock.almoxarifado.service.UsuarioService;
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
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@Validated
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/heartbeat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> heartbeat() {
        usuarioService.registrarHeartbeatAtual();
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<PagedResponseDTO<UsuarioResponseDTO>> listar(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RoleName perfil,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "The page number cannot be negative.") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "The minimum page size is 1.") @Max(value = 100, message = "The maximum page size is 100.") int size,
            @RequestParam(required = false, defaultValue = "nome,asc") String sort
    ) {
        return ResponseEntity.ok(usuarioService.listar(search, perfil, ativo, page, size, sort));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponseDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioService.buscarPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<UsuarioResponseDTO> criar(@Valid @RequestBody UsuarioCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.criar(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<UsuarioResponseDTO> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(usuarioService.atualizar(id, request));
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Void> desativar(@PathVariable Long id) {
        usuarioService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/reativar")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Void> reativar(@PathVariable Long id) {
        usuarioService.reativar(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/minha-senha")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> alterarMinhaSenha(@Valid @RequestBody AlterarMinhaSenhaRequestDTO request) {
        usuarioService.alterarMinhaSenha(request.getSenhaAtual(), request.getNovaSenha());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        usuarioService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
