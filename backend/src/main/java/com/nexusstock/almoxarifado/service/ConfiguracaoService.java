package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.response.ConfiguracaoResumoResponseDTO;

import java.util.Map;

public interface ConfiguracaoService {

    ConfiguracaoResumoResponseDTO obterResumo();

    Map<String, Object> exportarBackupOperacional();

    byte[] exportarBackupBancoPostgres(String senhaAtual);

    void resetarDadosOperacionais(String senhaAtual);
}
