package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BackupBancoRequestDTO {

    @Size(max = 200, message = "The current password is invalid.")
    private String senhaAtual;
}
