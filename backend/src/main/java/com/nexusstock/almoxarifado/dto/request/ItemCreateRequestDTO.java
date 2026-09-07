package com.nexusstock.almoxarifado.dto.request;

import com.nexusstock.almoxarifado.enums.UnidadeMedida;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ItemCreateRequestDTO {

    @NotBlank(message = "The item name is required.")
    @Size(max = 150, message = "The name must not exceed 150 characters.")
    private String nome;
    @Size(max = 80, message = "The code must not exceed 80 characters.")
    private String sku;

    @NotBlank(message = "The category is required.")
    @Size(max = 80, message = "The category must not exceed 80 characters.")
    private String categoria;

    @NotNull(message = "The unit is required.")
    private UnidadeMedida unidade;

    @NotNull(message = "The supplier is required.")
    private Long fornecedorId;

    @Size(max = 50, message = "The aisle must not exceed 50 characters.")
    private String corredor;

    @Size(max = 50, message = "The shelf must not exceed 50 characters.")
    private String prateleira;
    @Size(max = 255, message = "The location must not exceed 255 characters.")
    private String localizacao;

    @NotNull(message = "The initial quantity is required.")
    @DecimalMin(value = "0.000", message = "The initial quantity cannot be negative.")
    @Digits(integer = 12, fraction = 3, message = "The initial quantity must contain at most 12 integer digits and 3 decimal places.")
    private BigDecimal quantidadeInicial;

    @NotNull(message = "The minimum stock is required.")
    @DecimalMin(value = "0.000", message = "The minimum stock cannot be negative.")
    @Digits(integer = 12, fraction = 3, message = "The minimum stock must contain at most 12 integer digits and 3 decimal places.")
    private BigDecimal estoqueMinimo;

    @NotNull(message = "The average price is required.")
    @DecimalMin(value = "0.00", message = "The average price cannot be negative.")
    @Digits(integer = 13, fraction = 2, message = "The average price must contain at most 13 integer digits and 2 decimal places.")
    private BigDecimal precoMedio;

    private LocalDate dataValidade;

    @Min(value = 0, message = "The warning period cannot be negative.")
    @Max(value = 3650, message = "The warning period must not exceed 3650 days.")
    private Integer diasAvisoValidade = 30;

    @Size(max = 500, message = "The image URL must not exceed 500 characters.")
    private String imagemUrl;
}
