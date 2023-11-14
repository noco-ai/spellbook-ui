import { Component, ElementRef, ViewChild } from '@angular/core';
import { LayoutService } from '../../service/app.layout.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
})
export class AppSidebarComponent {
    timeout: any = null;

    @ViewChild('menuContainer') menuContainer!: ElementRef;
    constructor(public layoutService: LayoutService, public el: ElementRef) {}

    onMouseEnter() {
        if (!this.layoutService.state.anchored) {
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            this.layoutService.state.sidebarActive = true;
        }
    }

    onMouseLeave() {
        if (!this.layoutService.state.anchored) {
            if (!this.timeout) {
                this.timeout = setTimeout(
                    () => (this.layoutService.state.sidebarActive = false),
                    300
                );
            }
        }
    }

    anchor() {
        this.layoutService.state.anchored = !this.layoutService.state.anchored;
    }
}
