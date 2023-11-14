import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GolemComponent } from './component/servers.component';

@NgModule({
    imports: [RouterModule.forChild([{ path: '', component: GolemComponent }])],
    exports: [RouterModule],
})
export class GolemRoutingModule {}
