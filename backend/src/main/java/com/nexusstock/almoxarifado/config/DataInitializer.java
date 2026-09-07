package com.nexusstock.almoxarifado.config;

import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.enums.RoleName;
import com.nexusstock.almoxarifado.repository.PerfilRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final PerfilRepository perfilRepository;

    @Override
    @Transactional
    public void run(String... args) {
        criarPerfisSeNaoExistirem();
    }

    private void criarPerfisSeNaoExistirem() {
        criarPerfilSeNaoExistir(RoleName.SUPER_ADMINISTRADOR, "Internal system administration access");
        criarPerfilSeNaoExistir(RoleName.ADMINISTRADOR, "System administrator");
        criarPerfilSeNaoExistir(RoleName.USUARIO, "Inventory operations employee");
        criarPerfilSeNaoExistir(RoleName.SOLICITANTE, "Inventory request user");
    }

    private void criarPerfilSeNaoExistir(RoleName nome, String descricao) {
        if (!perfilRepository.existsByNome(nome)) {
            Perfil perfil = new Perfil(nome, descricao);
            perfilRepository.save(perfil);
        }
    }

}
