package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoriaProdutoRequestDTO {

    @NotBlank(message = "The category name is required.")
    @Size(max = 80, message = "The category name must not exceed 80 characters.")
    private String nome;
}
