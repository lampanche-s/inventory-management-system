package com.nexusstock.almoxarifado.security;

import com.nexusstock.almoxarifado.service.AuthService;
import com.nexusstock.almoxarifado.service.ConfiguracaoService;
import com.nexusstock.almoxarifado.service.ItemService;
import com.nexusstock.almoxarifado.service.SolicitacaoMovimentacaoService;
import com.nexusstock.almoxarifado.service.UsuarioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
class AuthorizationMatrixTests {

    private static final String SUPER_ADMINISTRADOR = "SUPER_ADMINISTRADOR";
    private static final String ADMINISTRADOR = "ADMINISTRADOR";
    private static final String USUARIO = "USUARIO";
    private static final String SOLICITANTE = "SOLICITANTE";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ItemService itemService;

    @MockitoBean
    private UsuarioService usuarioService;

    @MockitoBean
    private SolicitacaoMovimentacaoService solicitacaoMovimentacaoService;

    @MockitoBean
    private ConfiguracaoService configuracaoService;

    @MockitoBean
    private AuthService authService;

    @Test
    void requisicaoAnonimaEmRecursoProtegidoRetornaUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/itens"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void leituraDeItensAceitaOsQuatroPerfisAtuais() throws Exception {
        for (String role : perfisAtuais()) {
            mockMvc.perform(get("/api/v1/itens").with(user("matrix-user").roles(role)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void operacaoDeEstoqueRecusaSolicitante() throws Exception {
        for (String role : new String[]{SUPER_ADMINISTRADOR, ADMINISTRADOR, USUARIO}) {
            mockMvc.perform(patch("/api/v1/itens/1/desativar").with(user("matrix-user").roles(role)))
                    .andExpect(status().isNoContent());
        }

        mockMvc.perform(patch("/api/v1/itens/1/desativar")
                        .with(user("matrix-user").roles(SOLICITANTE)))
                .andExpect(status().isForbidden());
    }

    @Test
    void consultaIndividualDeUsuarioExigePerfilAdministrativo() throws Exception {
        for (String role : new String[]{SUPER_ADMINISTRADOR, ADMINISTRADOR}) {
            mockMvc.perform(get("/api/v1/usuarios/1").with(user("matrix-user").roles(role)))
                    .andExpect(status().isOk());
        }

        for (String role : new String[]{USUARIO, SOLICITANTE}) {
            mockMvc.perform(get("/api/v1/usuarios/1").with(user("matrix-user").roles(role)))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void heartbeatAceitaQualquerUsuarioAutenticado() throws Exception {
        for (String role : perfisAtuais()) {
            mockMvc.perform(post("/api/v1/usuarios/heartbeat").with(user("matrix-user").roles(role)))
                    .andExpect(status().isNoContent());
        }
    }

    @Test
    void decisaoDeSolicitacaoRecusaSolicitante() throws Exception {
        for (String role : new String[]{SUPER_ADMINISTRADOR, ADMINISTRADOR, USUARIO}) {
            mockMvc.perform(post("/api/v1/solicitacoes/1/aprovar")
                            .with(user("matrix-user").roles(role)))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/v1/solicitacoes/1/aprovar")
                        .with(user("matrix-user").roles(SOLICITANTE)))
                .andExpect(status().isForbidden());
    }

    @Test
    void resetOperacionalAceitaSomenteSuperAdministrador() throws Exception {
        String request = """
                {
                  "confirmacao": "RESET_DATABASE",
                  "senhaAtual": "test-password"
                }
                """;

        mockMvc.perform(post("/api/v1/configuracoes/reset-operacional")
                        .with(user("matrix-user").roles(SUPER_ADMINISTRADOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isNoContent());

        for (String role : new String[]{ADMINISTRADOR, USUARIO, SOLICITANTE}) {
            mockMvc.perform(post("/api/v1/configuracoes/reset-operacional")
                            .with(user("matrix-user").roles(role))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isForbidden());
        }
    }


    @Test
    void backupBancoAceitaSomenteSuperAdministradorEEntregaArquivoBinario() throws Exception {
        byte[] backup = new byte[]{1, 2, 3, 4};
        String request = """
                {
                  "senhaAtual": " exact password "
                }
                """;

        when(configuracaoService.exportarBackupBancoPostgres(" exact password ")).thenReturn(backup);

        mockMvc.perform(post("/api/v1/configuracoes/backup-banco")
                        .with(user("matrix-user").roles(SUPER_ADMINISTRADOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        org.hamcrest.Matchers.containsString("attachment; filename=\"almoxarifado-backup-banco-")))
                .andExpect(content().bytes(backup));

        for (String role : new String[]{ADMINISTRADOR, USUARIO, SOLICITANTE}) {
            mockMvc.perform(post("/api/v1/configuracoes/backup-banco")
                            .with(user("matrix-user").roles(role))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isForbidden());
        }

        mockMvc.perform(post("/api/v1/configuracoes/backup-banco")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void backupBancoSemSenhaReautenticadaRetornaUnauthorizedSemDetalhesInternos() throws Exception {
        when(configuracaoService.exportarBackupBancoPostgres(null))
                .thenThrow(new BadCredentialsException("internal reauthentication detail"));

        mockMvc.perform(post("/api/v1/configuracoes/backup-banco")
                        .with(user("matrix-user").roles(SUPER_ADMINISTRADOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("internal reauthentication detail"))));
    }

    private String[] perfisAtuais() {
        return new String[]{SUPER_ADMINISTRADOR, ADMINISTRADOR, USUARIO, SOLICITANTE};
    }
}
