package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class FornecedorRequestDTO {

    @NotBlank(message = "The supplier name is required.")
    @Size(max = 150, message = "The name must not exceed 150 characters.")
    private String nome;

    @Size(max = 20, message = "The CPF/CNPJ must not exceed 20 characters.")
    private String cnpj;

    @Size(max = 120, message = "The contact name must not exceed 120 characters.")
    private String contato;

    @Size(max = 30, message = "The phone number must not exceed 30 characters.")
    private String telefone;

    @Email(message = "Enter a valid email address.")
    @Size(max = 150, message = "The email address must not exceed 150 characters.")
    private String email;

    @Size(max = 100, message = "The city must not exceed 100 characters.")
    private String cidade;
    @Size(max = 20, message = "The postal code must not exceed 20 characters.")
    private String cep;

    @Size(max = 180, message = "The street address must not exceed 180 characters.")
    private String logradouro;

    @Size(max = 120, message = "The district must not exceed 120 characters.")
    private String bairro;

    @Size(max = 2, message = "The Brazilian state code must contain at most 2 characters.")
    private String uf;

    @Size(max = 180, message = "The address details must not exceed 180 characters.")
    private String complemento;

    @DecimalMin(value = "0.00", message = "The score must be at least 0.")
    @DecimalMax(value = "100.00", message = "The score must not exceed 100.")
    @Digits(integer = 3, fraction = 2, message = "The score must contain at most 3 integer digits and 2 decimal places.")
    private BigDecimal score;

    private Boolean ativo;
}
