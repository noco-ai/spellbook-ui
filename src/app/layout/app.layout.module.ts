import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputTextModule } from 'primeng/inputtext';
import { SidebarModule } from 'primeng/sidebar';
import { BadgeModule } from 'primeng/badge';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { AppConfigModule } from './config/app.config.module';
import { AppLayoutComponent } from './component/app.layout.component';
import { AppBreadcrumbComponent } from './component/breadcrumb/breadcrumb.component';
import { AppSidebarComponent } from './component/sidebar/sidebar.component';
import { AppTopbarComponent } from './component/topbar/topbar.component';
import { AppRightSidebarComponent } from './component/right-sidebar/right-sidebar.component';
import { AppMenuComponent } from './component/menu/menu.component';
import { AppMenuitemComponent } from './component/menu/menuitem.component';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@NgModule({
    declarations: [
        AppLayoutComponent,
        AppBreadcrumbComponent,
        AppSidebarComponent,
        AppTopbarComponent,
        AppRightSidebarComponent,
        AppMenuComponent,
        AppMenuitemComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        InputTextModule,
        SidebarModule,
        BadgeModule,
        RadioButtonModule,
        InputSwitchModule,
        ButtonModule,
        TooltipModule,
        RippleModule,
        RouterModule,
        AppConfigModule,
    ],
})
export class AppLayoutModule {}
