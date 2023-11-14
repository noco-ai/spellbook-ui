import { Component } from '@angular/core';
import { LayoutService } from '../../service/app.layout.service';

@Component({
    selector: 'app-right-sidebar',
    templateUrl: './right-sidebar.component.html',
})
export class AppRightSidebarComponent {
    constructor(public layoutService: LayoutService) {}

    get visible(): boolean {
        return this.layoutService.state.profileSidebarVisible;
    }

    set visible(_val: boolean) {
        this.layoutService.state.profileSidebarVisible = _val;
    }
}
