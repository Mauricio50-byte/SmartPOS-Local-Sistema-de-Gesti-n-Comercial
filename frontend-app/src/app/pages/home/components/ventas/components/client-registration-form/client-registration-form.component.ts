import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
    standalone: false,
    selector: 'app-client-registration-form',
    templateUrl: './client-registration-form.component.html',
    styleUrls: ['./client-registration-form.component.scss'],
})
export class ClientRegistrationFormComponent {
    @Input() datosClienteGroup!: FormGroup;
    @Output() cancelar = new EventEmitter<void>();

    onCancelar() {
        this.cancelar.emit();
    }
}
