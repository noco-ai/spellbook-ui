import { Component, ElementRef, ViewChild } from '@angular/core';
import { LayoutService } from '../../service/app.layout.service';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
})
export class AppTopbarComponent {
    @ViewChild('menubutton') menuButton!: ElementRef;

    constructor(public layoutService: LayoutService) {}

    onMenuButtonClick() {
        this.layoutService.onMenuToggle();
    }

    onProfileButtonClick() {
        this.layoutService.showProfileSidebar();
    }

    onConfigButtonClick() {
        this.layoutService.showConfigSidebar();
    }
}
