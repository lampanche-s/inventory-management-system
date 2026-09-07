package com.nexusstock.almoxarifado.exception;

public class LoginRateLimitException extends RuntimeException {

    public LoginRateLimitException() {
        super("Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.");
    }
}
