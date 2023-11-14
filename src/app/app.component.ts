import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { LayoutService } from './layout/service/app.layout.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
    constructor(private primengConfig: PrimeNGConfig, private layoutService: LayoutService) {}

    ngOnInit(): void {
        this.primengConfig.ripple = true;
        const themeEncoded = window.localStorage.getItem('theme');
        if (themeEncoded) {
            const themeConfig = JSON.parse(themeEncoded);            
            let updateTheme = false;
            const themeLink = <HTMLLinkElement>(
                document.getElementById('theme-link')
            );
            let newHref = themeLink.getAttribute('href');
            if (themeConfig.theme != 'indigo') {
                newHref = newHref!.replace('indigo', themeConfig.theme);
                updateTheme = true;
            }

            if (themeConfig.colorScheme != 'light') {
                newHref = newHref!.replace('light', themeConfig.colorScheme);
                updateTheme = true;
            }

            if (updateTheme) {
                this.layoutService.replaceThemeLink(newHref, () => {
                    this.layoutService.config.theme = themeConfig.theme;
                    this.layoutService.onConfigUpdate();
                });
            }
            this.layoutService.config = themeConfig;   
        }
    }
}
