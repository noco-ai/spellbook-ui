import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { RoutingModule } from './routing.module';
import { AppComponent } from './app.component';
import { AppLayoutModule } from './layout/app.layout.module';

@NgModule({
    declarations: [AppComponent],
    imports: [RoutingModule, AppLayoutModule],
    providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
    bootstrap: [AppComponent],
})
export class AppModule {}
