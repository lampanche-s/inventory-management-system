package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class SolicitacaoMovimentacaoLoteItemRequestDTO {

    @NotNull(message = "The item is required.")
    private Long itemId;

    @NotNull(message = "The quantity is required.")
    @DecimalMin(value = "0.001", message = "The quantity must be greater than zero.")
    @Digits(integer = 12, fraction = 3, message = "The quantity must contain at most 12 integer digits and 3 decimal places.")
    private BigDecimal quantidade;
}
