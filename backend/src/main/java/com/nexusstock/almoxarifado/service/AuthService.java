package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.LoginRequestDTO;
import com.nexusstock.almoxarifado.dto.response.LoginResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;

public interface AuthService {

    LoginResponseDTO login(LoginRequestDTO request);

    UsuarioResponseDTO me();
}