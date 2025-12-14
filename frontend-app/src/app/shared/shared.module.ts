import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { ProductCardComponent } from './components/product-card/product-card.component';
import { CartItemComponent } from './components/cart-item/cart-item.component';
import { PaymentSelectorComponent } from './components/payment-selector/payment-selector.component';

@NgModule({
    declarations: [
        ProductCardComponent,
        CartItemComponent,
        PaymentSelectorComponent
    ],
    imports: [
        CommonModule,
        IonicModule,
        FormsModule
    ],
    exports: [
        ProductCardComponent,
        CartItemComponent,
        PaymentSelectorComponent,
        CommonModule,
        IonicModule,
        FormsModule
    ]
})
export class SharedModule { }
