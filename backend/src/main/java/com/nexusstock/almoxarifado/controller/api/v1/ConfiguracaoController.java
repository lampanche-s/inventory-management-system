package com.nexusstock.almoxarifado.controller.api.v1;

import com.nexusstock.almoxarifado.dto.request.BackupBancoRequestDTO;
import com.nexusstock.almoxarifado.dto.request.ResetOperacionalRequestDTO;
import com.nexusstock.almoxarifado.dto.response.ConfiguracaoResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.service.AuthService;
import com.nexusstock.almoxarifado.service.ConfiguracaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/configuracoes")
@RequiredArgsConstructor
public class ConfiguracaoController {

    private final AuthService authService;
    private final ConfiguracaoService configuracaoService;

    @GetMapping("/sessao")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR', 'USUARIO')")
    public ResponseEntity<UsuarioResponseDTO> obterSessao() {
        return ResponseEntity.ok(authService.me());
    }

    @GetMapping("/resumo")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<ConfiguracaoResumoResponseDTO> obterResumo() {
        return ResponseEntity.ok(configuracaoService.obterResumo());
    }

    @GetMapping("/backup-operacional")
    @PreAuthorize("hasAnyRole('SUPER_ADMINISTRADOR', 'ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> exportarBackupOperacional() {
        return ResponseEntity.ok(configuracaoService.exportarBackupOperacional());
    }

    @PostMapping(value = "/backup-banco", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMINISTRADOR')")
    public ResponseEntity<ByteArrayResource> exportarBackupBanco(
            @Valid @RequestBody BackupBancoRequestDTO request
    ) {
        byte[] backup = configuracaoService.exportarBackupBancoPostgres(request.getSenhaAtual());

        String filename = "almoxarifado-backup-banco-" + LocalDate.now() + ".backup";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(backup.length)
                .body(new ByteArrayResource(backup));
    }

    @PostMapping("/reset-operacional")
    @PreAuthorize("hasRole('SUPER_ADMINISTRADOR')")
    public ResponseEntity<Void> resetarDadosOperacionais(
            @Valid @RequestBody ResetOperacionalRequestDTO request
    ) {
        if (!"RESET_DATABASE".equals(request.getConfirmacao())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Confirmacao invalida para reset operacional."
            );
        }

        configuracaoService.resetarDadosOperacionais(request.getSenhaAtual());

        return ResponseEntity.noContent().build();
    }
}
